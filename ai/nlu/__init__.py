# =============================================================================
# NLU Module - Natural Language Understanding for Agriculture Assistant
# =============================================================================
# This module provides the core Natural Language Understanding capabilities
# for the agriculture assistant, including:
#
# Core Components:
# - Intent Classification: Identifies user intent (irrigation, seed recommendation, stress risk)
# - Slot Filling: Extracts structured information (crop, date, location, stage)
# - Multilingual Support: English + Indic language processing with code-switching
# - Joint Training: Single model for both intent and slot tasks
#
# Key Files:
# - schema.yaml: Defines intents, slots, and their types
# - train_joint.py: Training pipeline for the joint intent+slot model
# - eval_joint.py: Model evaluation and testing
# - export_tflite.py: Export to TFLite for edge deployment
# - tokenization.py: Text preprocessing and BIO tag alignment
# - data_augment.py: Synthetic data generation and augmentation
# - gazetteers/: Domain-specific vocabulary for slot normalization
#
# Model Architecture:
# - Backbone: TinyBERT for efficient inference
# - Joint Head: Intent classification + slot filling in single forward pass
# - Output: Intent probabilities + BIO-tagged slot spans
# =============================================================================

"""Natural Language Understanding module for agriculture assistant."""

__all__ = []

