from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict

import torch
from transformers import AutoModel, AutoTokenizer

from nlu.train_joint import JointHead


def load_runtime(model_dir: Path):
    labels = json.loads((model_dir / "labels.json").read_text(encoding="utf-8"))
    intents = labels["intents"]
    slot_labels = labels["slot_labels"]
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModel.from_pretrained(model_dir)
    head = JointHead(hidden_size=model.config.hidden_size, num_intents=len(intents), num_slots=len(slot_labels))
    state = torch.load(model_dir / "joint_head.pt", map_location="cpu")
    head.load_state_dict(state)
    model.eval()
    head.eval()
    return tokenizer, model, head, intents, slot_labels


def predict(tokenizer, model, head, intents, slot_labels, text: str) -> Dict:
    enc = tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**enc)
        intent_logits, slot_logits = head(outputs.last_hidden_state, enc["attention_mask"])
        intent = intents[int(torch.argmax(intent_logits, dim=-1))]
        slot_ids = torch.argmax(slot_logits, dim=-1)[0].tolist()
    return {"intent": intent, "slot_ids": slot_ids, "slot_labels": slot_labels}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model_dir", type=Path, required=True)
    ap.add_argument("--text", type=str, required=True)
    args = ap.parse_args()
    tokenizer, model, head, intents, slot_labels = load_runtime(args.model_dir)
    out = predict(tokenizer, model, head, intents, slot_labels, args.text)
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()

