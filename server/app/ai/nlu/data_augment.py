# =============================================================================
# NLU Data Augmentation Module - Synthetic Training Data Generation
# =============================================================================
# This module generates synthetic training data for the NLU system to improve
# model robustness and coverage. It includes:
#
# Core Functions:
# 1. load_schema: Loads the NLU schema definition from YAML
# 2. make_templates: Creates slot-aware templates for each intent
# 3. synth_examples: Generates synthetic examples using templates
# 4. add_code_switch: Adds code-switched variants (English + Indic)
# 5. validate_spans: Ensures character spans align with text content
#
# Data Generation Strategy:
# - Template-based: Uses predefined patterns with slot placeholders
# - Multilingual: Generates English and Indic language variants
# - Code-switching: Creates natural mixed-language expressions
# - Span validation: Ensures all slot annotations are valid
#
# Usage: This module is used during data preparation to expand the training
# dataset and improve model generalization across different languages and
# expression patterns.
# =============================================================================

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path
from typing import Dict, List, Any

def load_schema(schema_path: Path) -> Dict[str, Any]:
    """
    Load the NLU schema definition from YAML file.
    
    Args:
        schema_path: Path to the schema.yaml file
        
    Returns:
        Dictionary containing the loaded schema configuration
    """
    import yaml
    with open(schema_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def make_templates() -> Dict[str, List[str]]:
    """
    Create slot-aware templates for each intent.
    
    Returns:
        Dictionary mapping intent names to lists of template strings
        Templates contain slot placeholders like {crop}, {location}, etc.
    """
    return {
        "irrigation_when": [
            "When should I irrigate my {crop} in {location}?",
            "Kab paani dena chahiye {crop} ko {location} mein?",
            "Irrigation timing for {crop} at {location}",
            "{crop} ko {location} mein kab paani dein?",
            "When to water {crop} in {location}?"
        ],
        "seed_recommendation": [
            "Which {crop} seeds are good for {location}?",
            "{location} ke liye kaunse {crop} ke beej achhe hain?",
            "Recommend {crop} varieties for {location}",
            "{crop} ke liye beej recommendation {location} mein",
            "Best {crop} seeds for {location} area"
        ],
        "stress_risk": [
            "Is my {crop} at risk in {location}?",
            "Kya mera {crop} {location} mein risk mein hai?",
            "Stress assessment for {crop} in {location}",
            "{crop} ka stress check {location} mein",
            "Risk evaluation for {crop} at {location}"
        ]
    }

def synth_examples(n: int = 1000, langs: List[str] = None) -> List[Dict[str, Any]]:
    """
    Generate synthetic training examples using templates.
    
    Args:
        n: Number of examples to generate
        langs: List of languages to generate examples for
        
    Returns:
        List of example dictionaries with text and slot annotations
    """
    if langs is None:
        langs = ['en', 'hi']
    
    templates = make_templates()
    examples = []
    
    # Sample slot values for generation
    crops = ["wheat", "paddy", "cotton", "rice"]
    locations = ["Jaipur", "Punjab", "Gujarat", "Maharashtra"]
    
    for _ in range(n):
        intent = random.choice(list(templates.keys()))
        template = random.choice(templates[intent])
        
        # Fill template slots
        text = template.format(
            crop=random.choice(crops),
            location=random.choice(locations)
        )
        
        # Create slot annotations (simplified for demo)
        slots = {}
        if "{crop}" in template:
            crop_start = text.find(random.choice(crops))
            if crop_start != -1:
                crop_end = crop_start + len(random.choice(crops))
                slots["crop"] = [{"start": crop_start, "end": crop_end, "value": text[crop_start:crop_end]}]
        
        if "{location}" in template:
            loc_start = text.find(random.choice(locations))
            if loc_start != -1:
                loc_end = loc_start + len(random.choice(locations))
                slots["location"] = [{"start": loc_start, "end": loc_end, "value": text[loc_start:loc_end]}]
        
        examples.append({
            "text": text,
            "intent": intent,
            "slots": slots,
            "lang": random.choice(langs)
        })
    
    return examples

def add_code_switch(examples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Add code-switched variants to existing examples.
    
    Args:
        examples: List of existing examples
        
    Returns:
        List with additional code-switched variants
    """
    # Simple code-switching: replace some English words with Hindi equivalents
    en_to_hi = {
        "irrigate": "paani dena",
        "seeds": "beej",
        "good": "achhe",
        "risk": "risk",
        "when": "kab"
    }
    
    code_switched = []
    for example in examples:
        if example["lang"] == "en":
            # Create a code-switched variant
            text = example["text"]
            for en_word, hi_word in en_to_hi.items():
                if en_word in text.lower():
                    # Simple replacement (in practice, more sophisticated logic needed)
                    text = text.replace(en_word, hi_word)
                    break
            
            if text != example["text"]:
                code_switched.append({
                    **example,
                    "text": text,
                    "lang": "hi-en"  # Mark as code-switched
                })
    
    return examples + code_switched

def validate_spans(examples: List[Dict[str, Any]]) -> bool:
    """
    Validate that all slot spans align with text content.
    
    Args:
        examples: List of examples to validate
        
    Returns:
        True if all spans are valid, False otherwise
    """
    for example in examples:
        text = example["text"]
        for slot_name, spans in example["slots"].items():
            for span in spans:
                start = span["start"]
                end = span["end"]
                value = span["value"]
                
                # Check bounds
                if start < 0 or end > len(text) or start >= end:
                    return False
                
                # Check content matches
                if text[start:end] != value:
                    return False
    
    return True

def main():
    """Main CLI function for data augmentation."""
    parser = argparse.ArgumentParser(description="Generate synthetic NLU training data")
    parser.add_argument("--n", type=int, default=1000, help="Number of examples to generate")
    parser.add_argument("--langs", type=str, default="en,hi", help="Comma-separated languages")
    parser.add_argument("--output", type=Path, default=Path("nlu/utterances.jsonl"), help="Output file path")
    
    args = parser.parse_args()
    langs = args.langs.split(",")
    
    # Generate examples
    examples = synth_examples(args.n, langs)
    examples = add_code_switch(examples)
    
    # Validate
    if not validate_spans(examples):
        print("Warning: Some spans are invalid!")
    
    # Save to file
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, 'w', encoding='utf-8') as f:
        for example in examples:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')
    
    print(f"Generated {len(examples)} examples, saved to {args.output}")

if __name__ == "__main__":
    main()

