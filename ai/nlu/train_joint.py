from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from transformers import AutoConfig, AutoModel, AutoTokenizer

from nlu.tokenization import build_slot_label_list


DEFAULT_MODEL = "prajjwal1/bert-tiny"


@dataclass
class Example:
    text: str
    intent: str
    slots: Dict[str, str] | None
    spans: List[Dict] | None


class NLUDataset(Dataset):
    def __init__(self, examples: List[Example], tokenizer, slot_labels: List[str], intent_labels: List[str]):
        self.examples = examples
        self.tokenizer = tokenizer
        self.intent_to_id = {l: i for i, l in enumerate(intent_labels)}
        self.slot_to_id = {l: i for i, l in enumerate(slot_labels)}
        self.slot_labels = slot_labels

    def __len__(self) -> int:
        return len(self.examples)

    def __getitem__(self, idx: int):
        ex = self.examples[idx]
        enc = self.tokenizer(ex.text, truncation=True, padding=False, return_offsets_mapping=True)
        offsets = enc.pop("offset_mapping")
        slot_char_spans: List[Tuple[int, int]] = []
        slot_types: List[str] = []
        if ex.spans:
            for sp in ex.spans:
                slot_char_spans.append((int(sp["start"]), int(sp["end"])))
                slot_types.append(sp["slot"])
        elif ex.slots:
            for slot_name, slot_value in ex.slots.items():
                start = ex.text.lower().find(str(slot_value).lower())
                if start >= 0:
                    end = start + len(str(slot_value))
                    slot_char_spans.append((start, end))
                    slot_types.append(slot_name)
        # create per-token slot labels (wordpiece-level): naive: assign B- first tokenpiece, I- rest
        slot_ids = [self.slot_to_id["O"] for _ in enc["input_ids"]]
        for (s, e), slot_name in zip(slot_char_spans, slot_types):
            firstpiece = True
            for i, (os, oe) in enumerate(offsets):
                if os == 0 and oe == 0:
                    continue  # special tokens
                if not (oe <= s or e <= os):
                    prefix = "B-" if firstpiece else "I-"
                    label = f"{prefix}{slot_name}"
                    slot_ids[i] = self.slot_to_id.get(label, self.slot_to_id["O"])
                    firstpiece = False

        intent_id = self.intent_to_id[ex.intent]
        enc["labels_intent"] = intent_id
        enc["labels_slots"] = slot_ids
        return enc


def collate(batch, pad_id: int):
    max_len = max(len(x["input_ids"]) for x in batch)
    input_ids, attention_mask, labels_slots = [], [], []
    labels_intent = []
    for x in batch:
        pad_len = max_len - len(x["input_ids"])
        input_ids.append(x["input_ids"] + [pad_id] * pad_len)
        attention_mask.append(x["attention_mask"] + [0] * pad_len)
        ls = x["labels_slots"] + [0] * pad_len
        labels_slots.append(ls)
        labels_intent.append(x["labels_intent"])
    return {
        "input_ids": torch.tensor(input_ids),
        "attention_mask": torch.tensor(attention_mask),
        "labels_slots": torch.tensor(labels_slots),
        "labels_intent": torch.tensor(labels_intent),
    }


class JointHead(nn.Module):
    def __init__(self, hidden_size: int, num_intents: int, num_slots: int):
        super().__init__()
        self.intent = nn.Linear(hidden_size, num_intents)
        self.slots = nn.Linear(hidden_size, num_slots)

    def forward(self, hidden_states: torch.Tensor, attention_mask: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        cls = hidden_states[:, 0]
        intent_logits = self.intent(cls)
        slot_logits = self.slots(hidden_states)
        return intent_logits, slot_logits


def load_examples(path: Path) -> List[Example]:
    lines = [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]
    examples: List[Example] = []
    for l in lines:
        examples.append(
            Example(
                text=l["text"],
                intent=l["intent"],
                slots=l.get("slots"),
                spans=l.get("spans"),
            )
        )
    return examples


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=Path(__file__).with_name("utterances.jsonl"))
    ap.add_argument("--schema", type=Path, default=Path(__file__).with_name("schema.yaml"))
    ap.add_argument("--model_name", type=str, default=DEFAULT_MODEL)
    ap.add_argument("--epochs", type=int, default=1)
    ap.add_argument("--batch_size", type=int, default=8)
    ap.add_argument("--lr", type=float, default=5e-4)
    ap.add_argument("--output_dir", type=Path, default=Path("artifacts/joint"))
    args = ap.parse_args()

    import yaml

    schema = yaml.safe_load(args.schema.read_text(encoding="utf-8"))
    intents: List[str] = list(schema["intents"])
    slot_names: List[str] = list(schema["slots"].keys())
    slot_labels = build_slot_label_list(slot_names)

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    config = AutoConfig.from_pretrained(args.model_name)
    base = AutoModel.from_pretrained(args.model_name)

    examples = load_examples(args.data)
    if len(examples) < 4:
        examples = examples * 2

    dataset = NLUDataset(examples, tokenizer, slot_labels, intents)
    pad_id = tokenizer.pad_token_id
    if pad_id is None:
        pad_id = tokenizer.sep_token_id if hasattr(tokenizer, "sep_token_id") and tokenizer.sep_token_id is not None else 0
    dl = DataLoader(dataset, batch_size=args.batch_size, shuffle=True, collate_fn=lambda b: collate(b, pad_id))

    head = JointHead(config.hidden_size, num_intents=len(intents), num_slots=len(slot_labels))
    model = base
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    head.to(device)

    opt = torch.optim.AdamW(list(model.parameters()) + list(head.parameters()), lr=args.lr)
    ce_intent = nn.CrossEntropyLoss()
    ce_slots = nn.CrossEntropyLoss()

    model.train()
    head.train()
    for epoch in range(args.epochs):
        for batch in dl:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels_intent = batch["labels_intent"].to(device)
            labels_slots = batch["labels_slots"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            hidden_states = outputs.last_hidden_state
            intent_logits, slot_logits = head(hidden_states, attention_mask)
            loss = ce_intent(intent_logits, labels_intent) + ce_slots(slot_logits.view(-1, slot_logits.size(-1)), labels_slots.view(-1))
            opt.zero_grad()
            loss.backward()
            opt.step()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    # Save head and labels
    torch.save(head.state_dict(), args.output_dir / "joint_head.pt")
    with (args.output_dir / "labels.json").open("w", encoding="utf-8") as f:
        json.dump({"intents": intents, "slot_labels": slot_labels}, f, ensure_ascii=False)
    tokenizer.save_pretrained(args.output_dir)
    model.save_pretrained(args.output_dir)
    print(f"Saved to {args.output_dir}")


if __name__ == "__main__":
    main()

