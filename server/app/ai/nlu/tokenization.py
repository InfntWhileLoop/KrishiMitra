# =============================================================================
# NLU Tokenization Module - Text Preprocessing and BIO Tag Alignment
# =============================================================================
# This module handles all text preprocessing and tokenization for the NLU system,
# including:
#
# Core Functions:
# 1. align_tokens_and_slots: Maps character-level slot spans to token-level BIO tags
# 2. Basic whitespace tokenization as a fallback when advanced tokenizers unavailable
#
# BIO Tagging System:
# - B-{slot}: Beginning of a slot span
# - I-{slot}: Inside/continuation of a slot span  
# - O: Outside any slot (default)
#
# Example:
# Text: "When should I irrigate my wheat in Jaipur?"
# Tokens: ["When", "should", "I", "irrigate", "my", "wheat", "in", "Jaipur", "?"]
# BIO Tags: ["O", "O", "O", "O", "O", "B-crop", "O", "B-location", "O"]
#
# Usage: This module is used during training to prepare data and during
# inference to process new text inputs for the NLU model.
# =============================================================================

from __future__ import annotations

import re
from typing import List, Tuple, Dict, Any


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


def align_tokens_and_slots(text: str, slots: Dict[str, List[Dict[str, Any]]]) -> Tuple[List[str], List[str]]:
    """
    Align character-level slot spans with token-level BIO tags.
    
    This function takes raw text and slot annotations with character spans,
    then produces tokenized text and corresponding BIO tags for training.
    
    Args:
        text: Raw input text (e.g., "When should I irrigate my wheat in Jaipur?")
        slots: Dictionary mapping slot names to lists of span dictionaries
               Each span dict has: {"start": int, "end": int, "value": str}
    
    Returns:
        tokens: List of tokens from whitespace splitting
        bio_tags: List of BIO tags corresponding to each token
        
    Example:
        >>> text = "irrigate wheat in Jaipur"
        >>> slots = {"crop": [{"start": 9, "end": 14, "value": "wheat"}],
        ...          "location": [{"start": 18, "end": 24, "value": "Jaipur"}]}
        >>> tokens, tags = align_tokens_and_slots(text, slots)
        >>> print(tokens)  # ['irrigate', 'wheat', 'in', 'Jaipur']
        >>> print(tags)    # ['O', 'B-crop', 'O', 'B-location']
    """
    # Simple whitespace tokenization (fallback when advanced tokenizers unavailable)
    tokens = text.split()
    
    # Initialize all tags as 'O' (outside any slot)
    bio_tags = ["O"] * len(tokens)
    
    # Process each slot type
    for slot_name, spans in slots.items():
        for span in spans:
            start_char = span["start"]
            end_char = span["end"]
            
            # Find which tokens fall within this span
            current_pos = 0
            for i, token in enumerate(tokens):
                token_start = current_pos
                token_end = current_pos + len(token)
                
                # Check if this token overlaps with the slot span
                if (token_start < end_char and token_end > start_char):
                    if token_start >= start_char:
                        # Token starts within or at start of span
                        bio_tags[i] = f"B-{slot_name}"
                    else:
                        # Token continues a span
                        bio_tags[i] = f"I-{slot_name}"
                
                # Move to next token position (accounting for whitespace)
                current_pos = token_end + 1
    
    return tokens, bio_tags


def validate_bio_tags(tokens: List[str], bio_tags: List[str]) -> bool:
    """
    Validate that BIO tags follow proper sequence rules.
    
    Rules:
    - I-{slot} must follow B-{slot} or I-{slot} of the same type
    - No I-{slot} at the beginning of a sequence
    
    Args:
        tokens: List of tokens
        bio_tags: List of BIO tags
        
    Returns:
        bool: True if tags are valid, False otherwise
    """
    if len(tokens) != len(bio_tags):
        return False
    
    for i, tag in enumerate(bio_tags):
        if tag.startswith("I-"):
            slot_name = tag[2:]  # Remove "I-" prefix
            
            # Check if previous tag is valid
            if i == 0:
                return False  # I- tag cannot start a sequence
            
            prev_tag = bio_tags[i-1]
            if prev_tag not in [f"B-{slot_name}", f"I-{slot_name}"]:
                return False
    
    return True


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


