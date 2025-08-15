from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import List

import numpy as np
import torch
from transformers import AutoModel, AutoTokenizer

from nlu.train_joint import JointHead


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model_dir", type=Path, required=True)
    ap.add_argument("--data", type=Path, default=Path(__file__).with_name("utterances.jsonl"))
    args = ap.parse_args()

    labels = json.loads((args.model_dir / "labels.json").read_text(encoding="utf-8"))
    intents = labels["intents"]
    slot_labels = labels["slot_labels"]

    tokenizer = AutoTokenizer.from_pretrained(args.model_dir)
    model = AutoModel.from_pretrained(args.model_dir)
    hidden = model.config.hidden_size
    head = JointHead(hidden_size=hidden, num_intents=len(intents), num_slots=len(slot_labels))
    state = torch.load(args.model_dir / "joint_head.pt", map_location="cpu")
    head.load_state_dict(state)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device).eval()
    head.to(device).eval()

    lines = [json.loads(l) for l in args.data.read_text(encoding="utf-8").splitlines() if l.strip()]
    correct = 0
    with torch.no_grad():
        for ex in lines:
            enc = tokenizer(ex["text"], return_tensors="pt")
            for k in enc:
                enc[k] = enc[k].to(device)
            outputs = model(**enc)
            intent_logits, slot_logits = head(outputs.last_hidden_state, enc["attention_mask"])
            pred_intent = intents[int(torch.argmax(intent_logits, dim=-1))]
            if pred_intent == ex["intent"]:
                correct += 1
    acc = correct / max(1, len(lines))
    print(json.dumps({"intent_acc": acc}, indent=2))


if __name__ == "__main__":
    main()

