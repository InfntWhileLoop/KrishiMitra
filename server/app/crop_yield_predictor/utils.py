"""Utility functions for data preprocessing and standardization."""

import re
from typing import Union
import pandas as pd


def norm(text: Union[str, float, int]) -> str:
    """
    Standardize text by uppercasing, trimming, removing punctuation, and collapsing spaces.
    
    Args:
        text: Input text to normalize
        
    Returns:
        Normalized text string
        
    Examples:
        >>> norm("  Uttar Pradesh  ")
        'UTTAR PRADESH'
        >>> norm("Madhya Pradesh!")
        'MADHYA PRADESH'
        >>> norm("  New   Delhi  ")
        'NEW DELHI'
    """
    if pd.isna(text):
        return ""
    
    # Convert to string and uppercase
    text_str = str(text).upper().strip()
    
    # Remove punctuation except spaces
    text_str = re.sub(r'[^\w\s]', '', text_str)
    
    # Collapse multiple spaces to single space
    text_str = re.sub(r'\s+', ' ', text_str)
    
    return text_str.strip()


def create_join_key(state: str, district: str, year: Union[int, str]) -> str:
    """
    Create a canonical join key from state, district, and year.
    
    Args:
        state: State name
        district: District name  
        year: Year (will be converted to string)
        
    Returns:
        Canonical join key string
    """
    state_norm = norm(state)
    district_norm = norm(district)
    year_str = str(year)
    
    return f"{state_norm}_{district_norm}_{year_str}"


def validate_yield_value(yield_val: float) -> bool:
    """
    Validate yield values with sanity filters.
    
    Args:
        yield_val: Yield value in kg/ha
        
    Returns:
        True if value passes filters, False otherwise
    """
    if pd.isna(yield_val):
        return False
    
    # Keep values between 0 and 20000 kg/ha
    return 0 < yield_val < 20000


def normalize_crop_name(crop_name: str) -> str:
    """
    Normalize crop names by mapping synonyms to canonical forms.
    
    Args:
        crop_name: Raw crop name
        
    Returns:
        Normalized crop name
    """
    crop_mapping = {
        "PADDY": "RICE",
        "DHAN": "RICE", 
        "GEHU": "WHEAT",
        "KAPAS": "COTTON",
        "BAJRA": "PEARL_MILLET",
        "JOWAR": "SORGHUM",
        "MAIZE": "MAIZE",
        "GRAM": "CHICKPEA",
        "ARHAR": "PIGEON_PEA",
        "MOONG": "GREEN_GRAM",
        "URAD": "BLACK_GRAM",
        "MASUR": "LENTIL",
        "GROUNDNUT": "GROUNDNUT",
        "MUSTARD": "MUSTARD",
        "SUNFLOWER": "SUNFLOWER",
        "SUGARCANE": "SUGARCANE",
        "POTATO": "POTATO",
        "ONION": "ONION",
        "TOMATO": "TOMATO",
        "CHILLI": "CHILLI",
    }
    
    crop_norm = norm(crop_name)
    return crop_mapping.get(crop_norm, crop_norm)
