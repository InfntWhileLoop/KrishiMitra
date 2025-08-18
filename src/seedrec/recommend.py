"""Variety recommendation engine for seed variety recommender."""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
import logging
import json
from pathlib import Path
import joblib

from .traits import load_traits, validate_traits, get_crop_varieties
from .scoring import score_variety, calculate_hybrid_score

logger = logging.getLogger(__name__)


def create_explanation(score_result: Dict[str, Any]) -> str:
    """
    Create human-readable explanation for variety ranking.
    
    Args:
        score_result: Result from score_variety function
        
    Returns:
        Compact explanation string
    """
    reasons = []
    
    # pH explanation
    ph_score = score_result['pH_score']
    if ph_score >= 0.9:
        reasons.append("pH match ✓")
    elif ph_score >= 0.7:
        reasons.append(f"pH +{ph_score:.2f}")
    elif ph_score >= 0.5:
        reasons.append(f"pH ~{ph_score:.2f}")
    else:
        reasons.append(f"pH -{ph_score:.2f}")
    
    # Texture explanation
    texture_score = score_result['texture_score']
    if texture_score >= 0.9:
        reasons.append("texture match ✓")
    elif texture_score >= 0.8:
        reasons.append("texture partial ✓")
    else:
        reasons.append("texture mismatch ✗")
    
    # Maturity explanation
    maturity_score = score_result['maturity_score']
    if maturity_score >= 0.9:
        reasons.append("maturity match ✓")
    else:
        reasons.append(f"maturity +{maturity_score:.2f}")
    
    # Zone explanation
    zone_score = score_result['zone_score']
    if zone_score >= 0.9:
        reasons.append("zone match ✓")
    elif zone_score >= 0.5:
        reasons.append("zone OK")
    else:
        reasons.append("zone penalty")
    
    # Risk tolerance explanations
    if score_result['heat_adj'] > 1.0:
        reasons.append("heat-tolerant")
    elif score_result['heat_adj'] < 1.0:
        reasons.append("heat-sensitive")
    
    if score_result['flood_adj'] > 1.0:
        reasons.append("flood-tolerant")
    elif score_result['flood_adj'] < 1.0:
        reasons.append("flood-sensitive")
    
    if score_result['drought_adj'] > 1.0:
        reasons.append("drought-tolerant")
    elif score_result['drought_adj'] < 1.0:
        reasons.append("drought-sensitive")
    
    return "; ".join(reasons)


def load_yield_model(crop: str, model_dir: str = "artifacts") -> Tuple[Optional[Any], Optional[List[str]], bool]:
    """
    Load yield prediction model if available.
    
    Args:
        crop: Crop name
        model_dir: Directory containing model artifacts
        
    Returns:
        Tuple of (model, feature_columns, model_loaded)
    """
    model_path = Path(model_dir) / f"rf_model_{crop.lower()}.joblib"
    features_path = Path(model_dir) / f"{crop.lower()}_features.json"
    
    if not model_path.exists() or not features_path.exists():
        logger.info(f"No yield model found for {crop} in {model_dir}")
        return None, None, False
    
    try:
        # Load model
        model = joblib.load(model_path)
        
        # Load features
        with open(features_path, 'r') as f:
            features_data = json.load(f)
        feature_cols = features_data['feature_columns']
        
        logger.info(f"Loaded yield model for {crop} with {len(feature_cols)} features")
        return model, feature_cols, True
        
    except Exception as e:
        logger.warning(f"Failed to load yield model for {crop}: {e}")
        return None, None, False


def predict_yield_for_variety(model: Any, feature_cols: List[str], 
                             climate_row: Dict[str, Any]) -> Tuple[Optional[float], Optional[float]]:
    """
    Predict yield for a variety using loaded model.
    
    Args:
        model: Trained yield prediction model
        feature_cols: Feature column names
        climate_row: Climate data for prediction
        
    Returns:
        Tuple of (predicted_yield, yield_uncertainty)
    """
    try:
        # Prepare features
        X = []
        for col in feature_cols:
            if col in climate_row:
                X.append(climate_row[col])
            else:
                # Use median value if feature missing
                X.append(0.0)  # Default fallback
        
        X = np.array(X).reshape(1, -1)
        
        # Make prediction
        y_pred = model.predict(X)[0]
        
        # Get uncertainty if available (RandomForest)
        if hasattr(model, 'estimators_'):
            predictions = []
            for estimator in model.estimators_:
                pred = estimator.predict(X)[0]
                predictions.append(pred)
            y_std = np.std(predictions)
        else:
            y_std = None
        
        return y_pred, y_std
        
    except Exception as e:
        logger.warning(f"Failed to predict yield: {e}")
        return None, None


def recommend_varieties(
    traits_file: str,
    crop: str,
    soil_pH: float,
    soil_texture: str,
    season_len_days: int,
    zone_code: str,
    top_k: int = 5,
    risk_flags: Optional[Dict[str, bool]] = None,
    weights: Optional[Dict[str, float]] = None,
    tolerances: Optional[Dict[str, float]] = None,
    yield_model_dir: Optional[str] = None,
    climate_row: Optional[Dict[str, Any]] = None,
    yield_weight: float = 0.6
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Recommend top-k varieties for given conditions.
    
    Args:
        traits_file: Path to variety traits CSV
        crop: Crop name
        soil_pH: Soil pH value
        soil_texture: Soil texture
        season_len_days: Available growing season length
        zone_code: Target zone code
        top_k: Number of top recommendations to return
        risk_flags: Risk flags dictionary
        weights: Scoring weights
        tolerances: Tolerance parameters
        yield_model_dir: Directory for yield models
        climate_row: Climate data for yield prediction
        yield_weight: Weight for yield component in hybrid scoring
        
    Returns:
        Tuple of (recommendations_dataframe, metadata)
    """
    # Load and validate traits
    logger.info(f"Loading traits from {traits_file}")
    traits_df = load_traits(traits_file)
    
    is_valid, errors = validate_traits(traits_df)
    if not is_valid:
        raise ValueError(f"Traits validation failed: {errors}")
    
    # Filter for crop
    crop_varieties = get_crop_varieties(traits_df, crop)
    if crop_varieties.empty:
        raise ValueError(f"No varieties found for crop: {crop}")
    
    logger.info(f"Found {len(crop_varieties)} varieties for {crop}")
    
    # Prepare context
    context = {
        'soil_pH': soil_pH,
        'soil_texture': soil_texture,
        'season_len_days': season_len_days,
        'zone_code': zone_code,
        'risk_flags': risk_flags or {}
    }
    
    # Score all varieties
    logger.info("Scoring varieties...")
    scored_varieties = []
    
    for idx, variety_traits in crop_varieties.iterrows():
        score_result = score_variety(variety_traits, context, weights, tolerances)
        scored_varieties.append(score_result)
    
    # Try to load yield model for hybrid scoring
    yield_model = None
    feature_cols = None
    model_loaded = False
    
    if yield_model_dir and climate_row:
        yield_model, feature_cols, model_loaded = load_yield_model(crop, yield_model_dir)
    
    # Calculate hybrid scores if yield model available
    for variety_score in scored_varieties:
        if model_loaded and yield_model and feature_cols:
            # Predict yield
            yhat, y_std = predict_yield_for_variety(yield_model, feature_cols, climate_row)
            
            # Calculate hybrid score
            hybrid_score, used_yield = calculate_hybrid_score(
                variety_score['suitability'], yhat, y_std, yield_weight
            )
            
            variety_score['yhat'] = yhat
            variety_score['y_std'] = y_std
            variety_score['final_score'] = hybrid_score
            variety_score['used_yield'] = used_yield
            
        else:
            # No yield model, use suitability only
            variety_score['yhat'] = None
            variety_score['y_std'] = None
            variety_score['final_score'] = variety_score['suitability']
            variety_score['used_yield'] = False
    
    # Sort by final score
    scored_varieties.sort(key=lambda x: x['final_score'], reverse=True)
    
    # Take top-k
    top_varieties = scored_varieties[:top_k]
    
    # Create explanations
    for variety_score in top_varieties:
        variety_score['reasons'] = create_explanation(variety_score)
    
    # Prepare output DataFrame
    output_columns = [
        'crop', 'variety', 'final_score', 'suitability', 'yhat', 'y_std',
        'pH_score', 'texture_score', 'maturity_score', 'zone_score',
        'heat_adj', 'flood_adj', 'drought_adj', 'reasons'
    ]
    
    # Filter to only include columns that exist
    available_columns = [col for col in output_columns if any(col in var for var in top_varieties)]
    
    # Create DataFrame
    output_data = []
    for variety_score in top_varieties:
        row = {}
        for col in available_columns:
            if col in variety_score:
                row[col] = variety_score[col]
            else:
                row[col] = None
        output_data.append(row)
    
    recommendations_df = pd.DataFrame(output_data)
    
    # Prepare metadata
    metadata = {
        'crop': crop,
        'total_varieties': len(crop_varieties),
        'top_k': top_k,
        'used_yield_model': model_loaded,
        'scoring_weights': weights or {},
        'tolerance_parameters': tolerances or {},
        'context': context,
        'recommendation_timestamp': pd.Timestamp.now().isoformat()
    }
    
    logger.info(f"Generated {len(recommendations_df)} recommendations for {crop}")
    
    return recommendations_df, metadata


def save_recommendations(recommendations_df: pd.DataFrame, metadata: Dict[str, Any], 
                        output_file: str) -> None:
    """
    Save recommendations to JSON file.
    
    Args:
        recommendations_df: Recommendations DataFrame
        metadata: Metadata dictionary
        output_file: Output file path
    """
    output_path = Path(output_file)
    
    # Prepare output data
    output_data = {
        'metadata': metadata,
        'recommendations': recommendations_df.to_dict('records')
    }
    
    # Save to JSON
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2, default=str)
    
    logger.info(f"Saved recommendations to {output_path}")


def load_recommendations(input_file: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Load recommendations from JSON file.
    
    Args:
        input_file: Input file path
        
    Returns:
        Tuple of (recommendations_dataframe, metadata)
    """
    input_path = Path(input_file)
    
    if not input_path.exists():
        raise FileNotFoundError(f"Recommendations file not found: {input_path}")
    
    with open(input_path, 'r') as f:
        data = json.load(f)
    
    metadata = data['metadata']
    recommendations_df = pd.DataFrame(data['recommendations'])
    
    logger.info(f"Loaded recommendations from {input_path}")
    
    return recommendations_df, metadata
