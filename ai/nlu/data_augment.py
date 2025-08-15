from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Dict, Iterable

import click


@click.command()
@click.option("--input_path", type=click.Path(path_type=Path), default=Path(__file__).with_name("utterances.jsonl"))
@click.option("--gazetteer_dir", type=click.Path(path_type=Path), default=Path(__file__).with_name("gazetteers"))
@click.option("--output_path", type=click.Path(path_type=Path), default=Path("artifacts/augmented.jsonl"))
@click.option("--num", type=int, default=20)
def main(input_path: Path, gazetteer_dir: Path, output_path: Path, num: int) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    crops = _read_list(gazetteer_dir / "crops.txt")
    stages = _read_list(gazetteer_dir / "stages.txt")
    base = [json.loads(line) for line in input_path.read_text(encoding="utf-8").splitlines() if line.strip()]

    templates = [
        ("irrigation_when", "When to irrigate {crop} in {location}?", ["crop", "location"]),
        ("seed_recommendation", "Recommend seeds for {crop} at {stage}", ["crop", "stage"]),
        ("stress_risk", "Is there stress risk for {crop} in {location}?", ["crop", "location"]),
    ]

    with output_path.open("w", encoding="utf-8") as f:
        for ex in base:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")
        for _ in range(num):
            intent, tmpl, fields = random.choice(templates)
            crop = random.choice(crops)
            stage = random.choice(stages)
            location = random.choice(["Jaipur", "Pune", "Patna", "Delhi"])  # tiny set
            mapping = {"crop": crop, "stage": stage, "location": location}
            text = tmpl.format(**mapping)
            slots = {k: mapping[k] for k in fields}
            f.write(json.dumps({"text": text, "intent": intent, "slots": slots}, ensure_ascii=False) + "\n")


def _read_list(p: Path) -> Iterable[str]:
    if not p.exists():
        return []
    return [line.strip() for line in p.read_text(encoding="utf-8").splitlines() if line.strip()]


if __name__ == "__main__":
    main()

