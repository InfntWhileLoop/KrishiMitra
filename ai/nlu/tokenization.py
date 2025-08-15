from __future__ import annotations

from dataclasses import dataclass
from typing import List, Dict, Tuple


BIO_PREFIXES = ["B-", "I-"]


@dataclass
class Labels:
    intents: List[str]
    slot_labels: List[str]


def build_slot_label_list(slots: List[str]) -> List[str]:
    labels = ["O"]
    for slot in slots:
        labels.append(f"B-{slot}")
        labels.append(f"I-{slot}")
    return labels


def align_tokens_and_slots(tokens: List[str], char_spans: List[Tuple[int, int]], slot_char_spans: Dict[str, List[Tuple[int, int]]], slot_label_list: List[str]) -> List[int]:
    """
    Given whitespace tokens with character spans and a mapping of slot -> list of character spans,
    return per-token BIO indices into slot_label_list.
    This is a simplified aligner that treats wordpieces as part of the same tokenization step in tests.
    """
    label_to_id = {label: i for i, label in enumerate(slot_label_list)}
    result = [label_to_id["O"] for _ in tokens]

    def span_overlaps(a: Tuple[int, int], b: Tuple[int, int]) -> bool:
        return not (a[1] <= b[0] or b[1] <= a[0])

    for slot, spans in slot_char_spans.items():
        for span in spans:
            first = True
            for i, tok_span in enumerate(char_spans):
                if span_overlaps(span, tok_span):
                    prefix = "B-" if first else "I-"
                    label = f"{prefix}{slot}"
                    result[i] = label_to_id.get(label, label_to_id["O"])
                    first = False
    return result


def simple_whitespace_tokenize(text: str) -> Tuple[List[str], List[Tuple[int, int]]]:
    tokens: List[str] = []
    spans: List[Tuple[int, int]] = []
    i = 0
    for part in text.split():
        start = text.find(part, i)
        end = start + len(part)
        tokens.append(part)
        spans.append((start, end))
        i = end
    return tokens, spans


