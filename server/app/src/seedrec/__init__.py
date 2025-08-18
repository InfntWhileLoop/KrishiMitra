"""Seed Variety Recommender - Intelligent variety selection based on local conditions."""

__version__ = "0.1.0"
__author__ = "ML Engineer"

from .traits import load_traits, validate_traits
from .scoring import score_variety, combine_scores
from .recommend import recommend_varieties

__all__ = [
    "load_traits",
    "validate_traits", 
    "score_variety",
    "combine_scores",
    "recommend_varieties",
]
