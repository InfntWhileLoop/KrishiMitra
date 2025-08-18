"""Feature engineering and training table construction."""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


def build_training_table(
    yield_df: pd.DataFrame, 
    climate_df: pd.DataFrame,
    crop: Optional[str] = None
) -> pd.DataFrame:
    """
    Build training table by joining yield and climate data on standardized keys.
    
    Args:
        yield_df: DataFrame from load_icrisat()
        climate_df: DataFrame from load_climate()
        crop: Optional crop filter (e.g., 'RICE', 'WHEAT')
        
    Returns:
        Training DataFrame with target=yield_kg_ha and climate features
        
    Notes:
        - Inner join on ["state_norm", "district_norm", "year"]
        - De-duplicates and filters yield outliers
        - Outputs per-crop training table ready for ML
    """
    logger.info("Building training table...")
    
    # Filter by crop if specified
    if crop:
        yield_df = yield_df[yield_df['crop'] == crop].copy()
        logger.info(f"Filtered to crop: {crop}, {len(yield_df)} yield records")
    
    # Identify climate feature columns (exclude metadata columns)
    metadata_cols = ['state', 'district', 'year', 'state_norm', 'district_norm', 'join_key']
    climate_features = [col for col in climate_df.columns if col not in metadata_cols]
    
    logger.info(f"Climate features: {len(climate_features)} columns")
    logger.info(f"Climate features: {climate_features[:10]}...")  # Show first 10
    
    # Perform inner join on join_key
    logger.info(f"Joining {len(yield_df)} yield records with {len(climate_df)} climate records")
    
    merged = yield_df.merge(
        climate_df[['join_key'] + climate_features],
        on='join_key',
        how='inner'
    )
    
    logger.info(f"After join: {len(merged)} records")
    
    # Remove duplicate rows
    initial_count = len(merged)
    merged = merged.drop_duplicates()
    deduped_count = len(merged)
    logger.info(f"After deduplication: {initial_count} -> {deduped_count} records")
    
    # Additional yield outlier filtering
    if 'yield_kg_ha' in merged.columns:
        # Calculate yield statistics per crop
        yield_stats = merged.groupby('crop')['yield_kg_ha'].agg(['mean', 'std']).reset_index()
        
        # Filter outliers (beyond 3 standard deviations)
        merged = merged.merge(yield_stats, on='crop')
        merged['z_score'] = np.abs((merged['yield_kg_ha'] - merged['mean']) / merged['std'])
        merged = merged[merged['z_score'] <= 3]
        
        # Clean up temporary columns
        merged = merged.drop(['mean', 'std', 'z_score'], axis=1)
        
        logger.info(f"After outlier filtering: {len(merged)} records")
    
    # Ensure all climate features are numeric
    for col in climate_features:
        if col in merged.columns:
            merged[col] = pd.to_numeric(merged[col], errors='coerce')
    
    # Drop rows with missing values in key columns
    merged = merged.dropna(subset=['yield_kg_ha'] + climate_features)
    logger.info(f"After dropping NA: {len(merged)} records")
    
    # Create feature summary
    feature_summary = {
        'total_records': len(merged),
        'crops': merged['crop'].nunique(),
        'states': merged['state_norm'].nunique(),
        'districts': merged['district_norm'].nunique(),
        'years': merged['year'].nunique(),
        'climate_features': len(climate_features),
        'target_range': (merged['yield_kg_ha'].min(), merged['yield_kg_ha'].max()),
        'target_mean': merged['yield_kg_ha'].mean(),
        'target_std': merged['yield_kg_ha'].std()
    }
    
    logger.info("Training table summary:")
    for key, value in feature_summary.items():
        logger.info(f"  {key}: {value}")
    
    return merged


def add_seasonal_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add seasonal climate aggregations to the training table.
    
    Args:
        df: Training DataFrame with climate features
        
    Returns:
        DataFrame with additional seasonal features
        
    Notes:
        - Creates Kharif (Jun-Sep) and Rabi (Oct-Mar) aggregations
        - Adds seasonal rainfall, temperature, and humidity features
        - Useful for capturing growing season patterns
    """
    logger.info("Adding seasonal features...")
    
    # Identify monthly climate columns
    monthly_cols = []
    for col in df.columns:
        if any(month in col.upper() for month in ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                                                 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']):
            monthly_cols.append(col)
    
    logger.info(f"Found {len(monthly_cols)} monthly climate columns")
    
    # Define seasons
    seasons = {
        'kharif': ['JUN', 'JUL', 'AUG', 'SEP'],  # Monsoon season
        'rabi': ['OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'],  # Winter season
        'zaid': ['APR', 'MAY']  # Summer season
    }
    
    # Create seasonal aggregations
    for season_name, months in seasons.items():
        season_cols = [col for col in monthly_cols if any(month in col.upper() for month in months)]
        
        if season_cols:
            # Group by feature type (RAIN, TEMP, etc.)
            feature_types = {}
            for col in season_cols:
                for feature_type in ['RAIN', 'TEMP', 'HUMID', 'ET', 'WIND']:
                    if feature_type in col.upper():
                        if feature_type not in feature_types:
                            feature_types[feature_type] = []
                        feature_types[feature_type].append(col)
                        break
            
            # Create seasonal features
            for feature_type, cols in feature_types.items():
                if cols:
                    # Sum for rainfall, mean for others
                    if 'RAIN' in feature_type or 'PRECIP' in feature_type:
                        df[f'{season_name}_{feature_type.lower()}_total'] = df[cols].sum(axis=1)
                        df[f'{season_name}_{feature_type.lower()}_avg'] = df[cols].mean(axis=1)
                    else:
                        df[f'{season_name}_{feature_type.lower()}_avg'] = df[cols].mean(axis=1)
                        df[f'{season_name}_{feature_type.lower()}_std'] = df[cols].std(axis=1)
    
    logger.info(f"Added seasonal features. Final columns: {len(df.columns)}")
    return df


def create_feature_summary(df: pd.DataFrame) -> Dict:
    """
    Create a comprehensive summary of features for model training.
    
    Args:
        df: Training DataFrame
        
    Returns:
        Dictionary with feature information
    """
    # Identify feature columns (exclude metadata and target)
    metadata_cols = ['state', 'district', 'year', 'state_norm', 'district_norm', 'join_key', 'crop']
    target_col = 'yield_kg_ha'
    
    feature_cols = [col for col in df.columns if col not in metadata_cols + [target_col]]
    
    # Categorize features
    feature_categories = {
        'climate_basic': [col for col in feature_cols if any(keyword in col.upper() for keyword in ['TEMP', 'RAIN', 'HUMID', 'ET', 'WIND'])],
        'seasonal': [col for col in feature_cols if any(season in col.lower() for season in ['kharif', 'rabi', 'zaid'])],
        'derived': [col for col in feature_cols if col not in feature_cols[:len(feature_cols)//2]]  # Rough heuristic
    }
    
    # Feature statistics
    feature_stats = {}
    for col in feature_cols:
        if col in df.columns:
            feature_stats[col] = {
                'dtype': str(df[col].dtype),
                'missing_pct': (df[col].isna().sum() / len(df)) * 100,
                'mean': df[col].mean() if df[col].dtype in ['float64', 'int64'] else None,
                'std': df[col].std() if df[col].dtype in ['float64', 'int64'] else None,
                'min': df[col].min() if df[col].dtype in ['float64', 'int64'] else None,
                'max': df[col].max() if df[col].dtype in ['float64', 'int64'] else None
            }
    
    summary = {
        'total_features': len(feature_cols),
        'feature_categories': {k: len(v) for k, v in feature_categories.items()},
        'feature_list': feature_cols,
        'feature_statistics': feature_stats,
        'target_statistics': {
            'mean': df[target_col].mean(),
            'std': df[target_col].std(),
            'min': df[target_col].min(),
            'max': df[target_col].max(),
            'missing_pct': (df[target_col].isna().sum() / len(df)) * 100
        },
        'data_shape': df.shape,
        'crops': df['crop'].unique().tolist(),
        'years_range': (df['year'].min(), df['year'].max())
    }
    
    return summary
