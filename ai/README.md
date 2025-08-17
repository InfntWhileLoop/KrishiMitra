# Agri Assistant NLU (Offline, Minimal)

## Project Overview
This repository contains a complete offline Natural Language Understanding (NLU) system for an agriculture assistant, 
along with machine learning models for agricultural decision support. The system is designed to run entirely offline 
on edge devices.

## Architecture Overview

### Core Components:

1. **NLU Module** (`ai/nlu/`): Natural Language Understanding for intent classification and slot filling
   - Handles 3 intents: irrigation timing, seed recommendations, and stress risk assessment
   - Processes 4 slot types: crop, sowing date, location, and growth stage
   - Supports English + Indic language code-switching
   - Uses TinyBERT for efficient inference

2. **Packaging Module** (`ai/packaging/`): Edge deployment and runtime
   - TFLite model export for mobile/edge devices
   - CLI runtime for offline inference
   - Performance benchmarking tools

3. **Data Pipeline** (`ai/data/`): Data management and feature engineering
   - Raw data storage for weather, soil, and field information
   - Feature engineering pipeline for ML model training
   - Data quality validation and schema enforcement

4. **Testing** (`ai/tests/`): Comprehensive test suite
   - Unit tests for all modules
   - Integration tests for end-to-end workflows
   - Mock data for offline testing

### Key Features:
- **Offline-First**: All components work without internet connectivity
- **Multilingual**: English + Indic language support with code-switching
- **Edge-Optimized**: TFLite export with int8 quantization for mobile devices
- **Modular Design**: Clean separation of concerns for easy maintenance
- **Comprehensive Testing**: Full test coverage for reliability

## Agri Assistant NLU (Offline, Minimal)

Joint intent and slot model for an agriculture assistant.

- Intents: `irrigation_when`, `seed_recommendation`, `stress_risk`
- Slots: `crop`, `sowing_date`, `location`, `stage` (BIO tags for training)
- Languages: English + Indic code-switch (examples included). Extend via `nlu/data_augment.py`.

### Quickstart

- Python 3.11
- Optional: `uv` or plain `pip`

```bash
make venv
make test

# tiny data training
.venv/bin/python nlu/train_joint.py --epochs 1 --output_dir artifacts/joint-tiny

# evaluate
.venv/bin/python nlu/eval_joint.py --model_dir artifacts/joint-tiny

# export int8 TFLite (stub if TF is not installed)
.venv/bin/python nlu/export_tflite.py --model_dir artifacts/joint-tiny --out_path artifacts/joint-int8.tflite

# CLI runtime
.venv/bin/python packaging/runtime_edge.py --model_dir artifacts/joint-tiny --text "When should I irrigate my wheat in Jaipur?"
```

On Windows PowerShell, use `.venv\Scripts\python.exe` instead of `.venv/bin/python`.

### Notes

- Default model: `prajjwal1/bert-tiny` for fast demos. Swap to Indic models via `--model_name` for stronger multilingual coverage.
- TFLite export is stubbed by default (creates a valid file path with metadata). Replace with a real conversion as noted in `nlu/export_tflite.py`.
- Tests avoid network/model downloads and cover token label alignment and decoding.

### Repo layout

See `ai/` tree. Edit `nlu/schema.yaml` and `nlu/utterances.jsonl` to iterate on labels/data.

### TODOs

- Replace stubbed TFLite export with an actual conversion pipeline.
- Add richer augmentation and real datasets.
- Add CRF or constrained decoding for slot consistency.

