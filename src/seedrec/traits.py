"""Traits loading and validation for seed variety recommender."""

import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import logging

logger = logging.getLogger(__name__)

# Schema definition
REQUIRED_COLUMNS = [
    'crop', 'variety', 'pH_min', 'pH_max', 'textures_allowed',
    'maturity_days', 'zone_codes', 'heat_tol', 'flood_tol', 'drought_tol', 'notes'
]

COLUMN_TYPES = {
    'crop': str,
    'variety': str,
    'pH_min': float,
    'pH_max': float,
    'textures_allowed': str,
    'maturity_days': int,
    'zone_codes': str,
    'heat_tol': int,
    'flood_tol': int,
    'drought_tol': int,
    'notes': str
}

VALIDATION_RULES = {
    'pH_min': lambda x: 0 <= x <= 14,
    'pH_max': lambda x: 0 <= x <= 14,
    'maturity_days': lambda x: 30 <= x <= 365,
    'heat_tol': lambda x: x in [0, 1],
    'flood_tol': lambda x: x in [0, 1],
    'drought_tol': lambda x: x in [0, 1]
}


def load_traits(file_path: str) -> pd.DataFrame:
    """
    Load variety traits from CSV file.
    
    Args:
        file_path: Path to traits CSV file
        
    Returns:
        DataFrame with variety traits
        
    Raises:
        FileNotFoundError: If file doesn't exist
        ValueError: If file is empty or malformed
    """
    file_path = Path(file_path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"Traits file not found: {file_path}")
    
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise ValueError(f"Failed to read CSV file: {e}")
    
    if df.empty:
        raise ValueError("Traits file is empty")
    
    logger.info(f"Loaded {len(df)} variety records from {file_path}")
    return df


def validate_traits(df: pd.DataFrame) -> Tuple[bool, List[str]]:
    """
    Validate traits DataFrame against schema.
    
    Args:
        df: DataFrame to validate
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    # Check required columns
    missing_cols = set(REQUIRED_COLUMNS) - set(df.columns)
    if missing_cols:
        errors.append(f"Missing required columns: {missing_cols}")
    
    # Check data types
    for col, expected_type in COLUMN_TYPES.items():
        if col in df.columns:
            try:
                if expected_type == int:
                    df[col] = pd.to_numeric(df[col], errors='coerce').astype('Int64')
                elif expected_type == float:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                elif expected_type == str:
                    df[col] = df[col].astype(str)
            except Exception as e:
                errors.append(f"Column {col}: failed to convert to {expected_type.__name__}: {e}")
    
    # Check validation rules after type conversion
    for col, rule in VALIDATION_RULES.items():
        if col in df.columns:
            # Convert to numeric for validation
            numeric_col = pd.to_numeric(df[col], errors='coerce')
            invalid_mask = ~numeric_col.apply(lambda x: rule(x) if pd.notna(x) else True)
            invalid_rows = df[invalid_mask]
            if not invalid_rows.empty:
                for idx, row in invalid_rows.iterrows():
                    errors.append(f"Row {idx+2}: {col}={row[col]} violates validation rule")
    

    
    # Check pH logic
    if 'pH_min' in df.columns and 'pH_max' in df.columns:
        invalid_ph = df[df['pH_min'] > df['pH_max']]
        if not invalid_ph.empty:
            for idx, row in invalid_ph.iterrows():
                errors.append(f"Row {idx+2}: pH_min ({row['pH_min']}) > pH_max ({row['pH_max']})")
    
    # Check texture format
    if 'textures_allowed' in df.columns:
        for idx, row in df.iterrows():
            if pd.notna(row['textures_allowed']):
                textures = [t.strip() for t in str(row['textures_allowed']).split(',')]
                if not all(textures):  # Check for empty strings
                    errors.append(f"Row {idx+2}: textures_allowed contains empty values")
    
    # Check zone codes format
    if 'zone_codes' in df.columns:
        for idx, row in df.iterrows():
            if pd.notna(row['zone_codes']) and str(row['zone_codes']).strip():
                zones = [z.strip() for z in str(row['zone_codes']).split('|')]
                if not all(zones):  # Check for empty strings
                    errors.append(f"Row {idx+2}: zone_codes contains empty values")
    
    # Check for duplicates
    duplicates = df.duplicated(subset=['crop', 'variety'])
    if duplicates.any():
        dup_rows = df[duplicates]
        for idx, row in dup_rows.iterrows():
            errors.append(f"Row {idx+2}: Duplicate crop-variety combination: {row['crop']}-{row['variety']}")
    
    is_valid = len(errors) == 0
    
    if is_valid:
        logger.info("✅ Traits validation passed")
    else:
        logger.error(f"❌ Traits validation failed with {len(errors)} errors")
        for error in errors:
            logger.error(f"  {error}")
    
    return is_valid, errors


def get_crop_varieties(df: pd.DataFrame, crop: str) -> pd.DataFrame:
    """
    Get varieties for a specific crop.
    
    Args:
        df: Traits DataFrame
        crop: Crop name (case-insensitive)
        
    Returns:
        DataFrame filtered for the specified crop
    """
    crop_upper = crop.upper()
    logger.info(f"Looking for crop: '{crop_upper}' in available crops: {df['crop'].unique()}")
    
    crop_df = df[df['crop'].str.upper() == crop_upper].copy()
    
    if crop_df.empty:
        logger.warning(f"No varieties found for crop: {crop}")
        logger.warning(f"Available crops: {df['crop'].unique()}")
    
    return crop_df


def parse_textures(textures_str: str) -> List[str]:
    """
    Parse comma-separated textures string.
    
    Args:
        textures_str: Comma-separated textures
        
    Returns:
        List of texture strings
    """
    if pd.isna(textures_str) or not str(textures_str).strip():
        return []
    
    return [t.strip().lower() for t in str(textures_str).split(',') if t.strip()]


def parse_zone_codes(zone_str: str) -> List[str]:
    """
    Parse pipe-separated zone codes string.
    
    Args:
        zone_str: Pipe-separated zone codes
        
    Returns:
        List of zone codes
    """
    if pd.isna(zone_str) or not str(zone_str).strip():
        return []
    
    return [z.strip() for z in str(zone_str).split('|') if z.strip()]
