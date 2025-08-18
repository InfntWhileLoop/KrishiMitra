"""Data loading and preprocessing for ICRISAT and climate datasets."""

import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging

from .utils import norm, normalize_crop_name, validate_yield_value

logger = logging.getLogger(__name__)


def load_icrisat(file_path: str) -> pd.DataFrame:
    """
    Load and preprocess ICRISAT district-level crop yield data.
    
    Args:
        file_path: Path to ICRISAT CSV file
        
    Returns:
        DataFrame with columns: state_norm, district_norm, year, crop, yield_kg_ha
        
    Notes:
        - Detects columns ending with "YIELD (Kg per ha)"
        - Melts wide format to long format
        - Normalizes crop names and applies sanity filters
        - Creates standardized join keys
    """
    logger.info(f"Loading ICRISAT data from {file_path}")
    
    # Load the CSV file
    df = pd.read_csv(file_path)
    logger.info(f"Loaded {len(df)} rows, {len(df.columns)} columns")
    
    # Detect yield columns
    yield_cols = [col for col in df.columns if col.endswith("YIELD (Kg per ha)")]
    logger.info(f"Found {len(yield_cols)} yield columns: {yield_cols}")
    
    if not yield_cols:
        raise ValueError("No yield columns found in ICRISAT data")
    
    # Identify state and district columns (heuristic approach)
    state_col = None
    district_col = None
    year_col = None
    
    # Look for common column patterns
    for col in df.columns:
        col_lower = col.lower()
        if 'state' in col_lower and not state_col:
            state_col = col
        elif 'district' in col_lower and not district_col:
            district_col = col
        elif 'year' in col_lower and not year_col:
            year_col = col
    
    # If not found, try to infer from first few rows
    if not state_col:
        # Look for column with state-like values
        for col in df.columns:
            if df[col].dtype == 'object' and len(df[col].dropna().unique()) < 50:
                sample_values = df[col].dropna().head(10).astype(str)
                if any('PRADESH' in val.upper() or 'RAJASTHAN' in val.upper() for val in sample_values):
                    state_col = col
                    break
    
    if not district_col:
        # Look for column with district-like values
        for col in df.columns:
            if df[col].dtype == 'object' and len(df[col].dropna().unique()) < 1000:
                sample_values = df[col].dropna().head(10).astype(str)
                if any('JAIPUR' in val.upper() or 'DELHI' in val.upper() for val in sample_values):
                    district_col = col
                    break
    
    if not year_col:
        # Look for numeric column that could be year
        for col in df.columns:
            if df[col].dtype in ['int64', 'float64']:
                sample_values = df[col].dropna().head(10)
                if all(1990 <= val <= 2020 for val in sample_values):
                    year_col = col
                    break
    
    if not all([state_col, district_col, year_col]):
        raise ValueError(f"Could not identify required columns. Found: state={state_col}, district={district_col}, year={year_col}")
    
    logger.info(f"Identified columns: state={state_col}, district={district_col}, year={year_col}")
    
    # Prepare base columns for melting
    base_cols = [state_col, district_col, year_col]
    
    # Create yield mapping for melting
    yield_mapping = {}
    for col in yield_cols:
        # Extract crop name from column name
        crop_name = col.replace("YIELD (Kg per ha)", "").strip()
        crop_name = normalize_crop_name(crop_name)
        yield_mapping[col] = crop_name
    
    # Melt the dataframe
    melted = df[base_cols + yield_cols].melt(
        id_vars=base_cols,
        value_vars=yield_cols,
        var_name='yield_col',
        value_name='yield_kg_ha'
    )
    
    # Map crop names
    melted['crop'] = melted['yield_col'].map(yield_mapping)
    
    # Clean up
    melted = melted.drop('yield_col', axis=1)
    
    # Rename columns
    melted = melted.rename(columns={
        state_col: 'state',
        district_col: 'district', 
        year_col: 'year'
    })
    
    # Apply normalization
    melted['state_norm'] = melted['state'].apply(norm)
    melted['district_norm'] = melted['district'].apply(norm)
    
    # Filter out invalid yields
    initial_count = len(melted)
    melted = melted[melted['yield_kg_ha'].apply(validate_yield_value)]
    filtered_count = len(melted)
    logger.info(f"Filtered yields: {initial_count} -> {filtered_count} (removed {initial_count - filtered_count})")
    
    # Drop rows with missing values
    melted = melted.dropna()
    logger.info(f"After dropping NA: {len(melted)} rows")
    
    # Create join key
    melted['join_key'] = melted.apply(
        lambda row: f"{row['state_norm']}_{row['district_norm']}_{row['year']}", 
        axis=1
    )
    
    # Select final columns
    result = melted[['state_norm', 'district_norm', 'year', 'crop', 'yield_kg_ha', 'join_key']]
    
    logger.info(f"Final ICRISAT data: {len(result)} rows, {len(result.columns)} columns")
    return result


def load_climate(file_path: str) -> pd.DataFrame:
    """
    Load and preprocess climate data from the "main merge" file.
    
    Args:
        file_path: Path to climate CSV file
        
    Returns:
        DataFrame with climate features and standardized join keys
        
    Notes:
        - Heuristically locates state/district/year columns
        - Keeps numeric columns with climate keywords
        - Creates standardized join keys for joining with yield data
    """
    logger.info(f"Loading climate data from {file_path}")
    
    # Load the CSV file
    df = pd.read_csv(file_path)
    logger.info(f"Loaded {len(df)} rows, {len(df.columns)} columns")
    
    # Identify key columns (heuristic approach)
    state_col = None
    district_col = None
    year_col = None
    
    # Look for common column patterns
    for col in df.columns:
        col_lower = col.lower()
        if 'state' in col_lower and not state_col:
            state_col = col
        elif 'district' in col_lower and not district_col:
            district_col = col
        elif 'year' in col_lower and not year_col:
            year_col = col
    
    # If not found, try to infer from data patterns
    if not state_col:
        for col in df.columns:
            if df[col].dtype == 'object' and len(df[col].dropna().unique()) < 50:
                sample_values = df[col].dropna().head(10).astype(str)
                if any('PRADESH' in val.upper() or 'RAJASTHAN' in val.upper() for val in sample_values):
                    state_col = col
                    break
    
    if not district_col:
        for col in df.columns:
            if df[col].dtype == 'object' and len(df[col].dropna().unique()) < 1000:
                sample_values = df[col].dropna().head(10).astype(str)
                if any('JAIPUR' in val.upper() or 'DELHI' in val.upper() for val in sample_values):
                    district_col = col
                    break
    
    if not year_col:
        for col in df.columns:
            if df[col].dtype in ['int64', 'float64']:
                sample_values = df[col].dropna().head(10)
                if all(1990 <= val <= 2020 for val in sample_values):
                    year_col = col
                    break
    
    if not all([state_col, district_col, year_col]):
        raise ValueError(f"Could not identify required columns. Found: state={state_col}, district={district_col}, year={year_col}")
    
    logger.info(f"Identified columns: state={state_col}, district={district_col}, year={year_col}")
    
    # Identify climate feature columns
    climate_keywords = ['TEMP', 'RAIN', 'PRECIP', 'ET', 'EVAP', 'HUMID', 'HUMIDITY', 'WIND', 'SUNSHINE']
    climate_cols = []
    
    for col in df.columns:
        col_upper = col.upper()
        if any(keyword in col_upper for keyword in climate_keywords):
            if df[col].dtype in ['int64', 'float64']:
                climate_cols.append(col)
    
    logger.info(f"Found {len(climate_cols)} climate feature columns")
    
    # Select relevant columns
    selected_cols = [state_col, district_col, year_col] + climate_cols
    climate_df = df[selected_cols].copy()
    
    # Rename columns
    climate_df = climate_df.rename(columns={
        state_col: 'state',
        district_col: 'district',
        year_col: 'year'
    })
    
    # Apply normalization
    climate_df['state_norm'] = climate_df['state'].apply(norm)
    climate_df['district_norm'] = climate_df['district'].apply(norm)
    
    # Create join key
    climate_df['join_key'] = climate_df.apply(
        lambda row: f"{row['state_norm']}_{row['district_norm']}_{row['year']}", 
        axis=1
    )
    
    # Drop rows with missing values in key columns
    climate_df = climate_df.dropna(subset=['state_norm', 'district_norm', 'year'])
    
    # Fill missing climate values with median
    climate_cols_renamed = [col for col in climate_df.columns if col not in ['state', 'district', 'year', 'state_norm', 'district_norm', 'join_key']]
    climate_df[climate_cols_renamed] = climate_df[climate_cols_renamed].fillna(climate_df[climate_cols_renamed].median())
    
    logger.info(f"Final climate data: {len(climate_df)} rows, {len(climate_df.columns)} columns")
    return climate_df


def create_variety_traits_template() -> pd.DataFrame:
    """
    Create a template CSV for variety-level traits that can be populated later.
    
    Returns:
        DataFrame template with columns for pH tolerance, texture preferences, etc.
    """
    template_data = {
        'variety_name': [],
        'crop': [],
        'ph_min': [],
        'ph_max': [],
        'texture_preferred': [],
        'texture_tolerated': [],
        'maturity_days': [],
        'drought_tolerance': [],
        'heat_tolerance': [],
        'cold_tolerance': [],
        'disease_resistance': [],
        'pest_resistance': [],
        'yield_potential': [],
        'quality_grade': [],
        'release_year': [],
        'notifying_authority': [],
        'source_contact': []
    }
    
    template_df = pd.DataFrame(template_data)
    
    # Save template
    template_path = Path("variety_traits_template.csv")
    template_df.to_csv(template_path, index=False)
    logger.info(f"Created variety traits template: {template_path}")
    
    return template_df
