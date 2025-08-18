"""Scoring functions for seed variety recommender."""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
import logging

logger = logging.getLogger(__name__)

# Default scoring weights
DEFAULT_WEIGHTS = {
    'pH': 0.35,
    'texture': 0.25,
    'maturity': 0.25,
    'zone': 0.15
}

# Default tolerance windows
DEFAULT_TOLERANCES = {
    'pH_falloff': 0.5,  # pH units outside range for linear falloff
    'maturity_window': 60,  # days tolerance for maturity
    'zone_penalty': 0.5  # penalty for zone mismatch
}

# Risk adjustment multipliers
RISK_MULTIPLIERS = {
    'heat': {'match': 1.05, 'mismatch': 0.95},
    'flood': {'match': 1.05, 'mismatch': 0.95},
    'drought': {'match': 1.05, 'mismatch': 0.95}
}


def score_ph_suitability(soil_ph: float, ph_min: float, ph_max: float, 
                        falloff_range: float = None) -> float:
    """
    Score pH suitability (1.0 inside range, linear falloff outside).
    
    Args:
        soil_ph: Soil pH value
        ph_min: Minimum acceptable pH
        ph_max: Maximum acceptable pH
        falloff_range: pH units outside range for linear falloff (default: 0.5)
        
    Returns:
        pH suitability score (0.0 to 1.0)
    """
    if falloff_range is None:
        falloff_range = DEFAULT_TOLERANCES['pH_falloff']
    
    # Perfect match inside range
    if ph_min <= soil_ph <= ph_max:
        return 1.0
    
    # Linear falloff outside range
    if soil_ph < ph_min:
        distance = ph_min - soil_ph
        if distance <= falloff_range:
            return 1.0 - (distance / falloff_range)
        else:
            return 0.0
    else:  # soil_ph > ph_max
        distance = soil_ph - ph_max
        if distance <= falloff_range:
            return 1.0 - (distance / falloff_range)
        else:
            return 0.0


def score_texture_suitability(soil_texture: str, allowed_textures: str) -> float:
    """
    Score texture suitability (1.0 if match, 0.0 if no match).
    
    Args:
        soil_texture: Soil texture to match
        allowed_textures: Comma-separated allowed textures
        
    Returns:
        Texture suitability score (0.0 or 1.0)
    """
    if pd.isna(allowed_textures) or not str(allowed_textures).strip():
        return 0.5  # Neutral score if no texture preference specified
    
    allowed_list = [t.strip().lower() for t in str(allowed_textures).split(',')]
    soil_texture_lower = soil_texture.lower().strip()
    
    # Check for exact match
    if soil_texture_lower in allowed_list:
        return 1.0
    
    # Check for partial matches (e.g., "clay" matches "clay_loam")
    for allowed in allowed_list:
        if allowed in soil_texture_lower or soil_texture_lower in allowed:
            return 0.8  # Partial match score
    
    return 0.0


def score_maturity_suitability(season_length: int, maturity_days: int, 
                              tolerance_window: int = None) -> float:
    """
    Score maturity suitability based on season length.
    
    Args:
        season_length: Available growing season in days
        maturity_days: Variety maturity in days
        tolerance_window: Tolerance window in days (default: 60)
        
    Returns:
        Maturity suitability score (0.0 to 1.0)
    """
    if tolerance_window is None:
        tolerance_window = DEFAULT_TOLERANCES['maturity_window']
    
    # Perfect match
    if abs(maturity_days - season_length) <= tolerance_window:
        return 1.0
    
    # Linear falloff beyond tolerance
    distance = abs(maturity_days - season_length) - tolerance_window
    max_distance = 120  # Maximum reasonable distance
    
    if distance >= max_distance:
        return 0.0
    else:
        return 1.0 - (distance / max_distance)


def score_zone_suitability(zone_code: str, allowed_zones: str, 
                          penalty: float = None) -> float:
    """
    Score zone suitability.
    
    Args:
        zone_code: Target zone code
        allowed_zones: Pipe-separated allowed zone codes
        penalty: Penalty for zone mismatch (default: 0.5)
        
    Returns:
        Zone suitability score (0.5 to 1.0)
    """
    if penalty is None:
        penalty = DEFAULT_TOLERANCES['zone_penalty']
    
    # If no zones specified, neutral score
    if pd.isna(allowed_zones) or not str(allowed_zones).strip():
        return 1.0
    
    allowed_list = [z.strip() for z in str(allowed_zones).split('|')]
    
    # Perfect match
    if zone_code in allowed_list:
        return 1.0
    
    # Zone mismatch penalty
    return penalty


def apply_risk_adjustments(scores: Dict[str, float], traits: pd.Series, 
                          risk_flags: Dict[str, bool]) -> Tuple[Dict[str, float], Dict[str, float]]:
    """
    Apply risk-based adjustments to component scores.
    
    Args:
        scores: Component scores dictionary
        traits: Variety traits row
        risk_flags: Risk flags dictionary
        
    Returns:
        Tuple of (adjusted_scores, risk_adjustments)
    """
    risk_adjustments = {}
    
    # Heat risk adjustment
    if risk_flags.get('heat_risk', False):
        if traits['heat_tol'] == 1:
            risk_adjustments['heat_adj'] = RISK_MULTIPLIERS['heat']['match']
        else:
            risk_adjustments['heat_adj'] = RISK_MULTIPLIERS['heat']['mismatch']
    else:
        risk_adjustments['heat_adj'] = 1.0
    
    # Flood risk adjustment
    if risk_flags.get('flood_risk', False):
        if traits['flood_tol'] == 1:
            risk_adjustments['flood_adj'] = RISK_MULTIPLIERS['flood']['match']
        else:
            risk_adjustments['flood_adj'] = RISK_MULTIPLIERS['flood']['mismatch']
    else:
        risk_adjustments['flood_adj'] = 1.0
    
    # Drought risk adjustment
    if risk_flags.get('drought_risk', False):
        if traits['drought_tol'] == 1:
            risk_adjustments['drought_adj'] = RISK_MULTIPLIERS['drought']['match']
        else:
            risk_adjustments['drought_adj'] = RISK_MULTIPLIERS['drought']['mismatch']
    else:
        risk_adjustments['drought_adj'] = 1.0
    
    # Apply adjustments to scores
    adjusted_scores = scores.copy()
    for component in scores:
        if component in ['pH_score', 'texture_score', 'maturity_score', 'zone_score']:
            # Apply all risk adjustments as multipliers
            adjustment = 1.0
            for adj_value in risk_adjustments.values():
                adjustment *= adj_value
            adjusted_scores[component] *= adjustment
    
    return adjusted_scores, risk_adjustments


def combine_scores(scores: Dict[str, float], weights: Dict[str, float] = None) -> float:
    """
    Combine component scores using weighted average.
    
    Args:
        scores: Component scores dictionary
        weights: Scoring weights (default: DEFAULT_WEIGHTS)
        
    Returns:
        Combined suitability score (0.0 to 1.0)
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS
    
    # Validate weights
    total_weight = sum(weights.values())
    if abs(total_weight - 1.0) > 1e-6:
        logger.warning(f"Weights sum to {total_weight}, normalizing to 1.0")
        weights = {k: v/total_weight for k, v in weights.items()}
    
    # Calculate weighted sum
    combined_score = 0.0
    for component, weight in weights.items():
        score_key = f"{component}_score"
        if score_key in scores:
            combined_score += scores[score_key] * weight
        else:
            logger.warning(f"Missing score for component: {component}")
    
    # Ensure score is in [0, 1] range
    return max(0.0, min(1.0, combined_score))


def score_variety(traits: pd.Series, context: Dict[str, Any], 
                  weights: Dict[str, float] = None, 
                  tolerances: Dict[str, float] = None) -> Dict[str, Any]:
    """
    Score a single variety against given context.
    
    Args:
        traits: Variety traits row
        context: Context dictionary with soil_pH, soil_texture, season_len_days, zone_code, risk_flags
        weights: Scoring weights (default: DEFAULT_WEIGHTS)
        tolerances: Tolerance parameters (default: DEFAULT_TOLERANCES)
        
    Returns:
        Dictionary with component scores and final suitability score
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS
    
    if tolerances is None:
        tolerances = DEFAULT_TOLERANCES
    
    # Extract context variables
    soil_ph = context['soil_pH']
    soil_texture = context['soil_texture']
    season_length = context['season_len_days']
    zone_code = context['zone_code']
    risk_flags = context.get('risk_flags', {})
    
    # Calculate component scores
    scores = {
        'pH_score': score_ph_suitability(
            soil_ph, traits['pH_min'], traits['pH_max'], 
            tolerances.get('pH_falloff', DEFAULT_TOLERANCES['pH_falloff'])
        ),
        'texture_score': score_texture_suitability(
            soil_texture, traits['textures_allowed']
        ),
        'maturity_score': score_maturity_suitability(
            season_length, traits['maturity_days'],
            tolerances.get('maturity_window', DEFAULT_TOLERANCES['maturity_window'])
        ),
        'zone_score': score_zone_suitability(
            zone_code, traits['zone_codes'],
            tolerances.get('zone_penalty', DEFAULT_TOLERANCES['zone_penalty'])
        )
    }
    
    # Apply risk adjustments
    adjusted_scores, risk_adjustments = apply_risk_adjustments(scores, traits, risk_flags)
    
    # Calculate final suitability score
    suitability_score = combine_scores(adjusted_scores, weights)
    
    # Prepare result
    result = {
        'crop': traits['crop'],
        'variety': traits['variety'],
        'suitability': suitability_score,
        'pH_score': adjusted_scores['pH_score'],
        'texture_score': adjusted_scores['texture_score'],
        'maturity_score': adjusted_scores['maturity_score'],
        'zone_score': adjusted_scores['zone_score'],
        'heat_adj': risk_adjustments['heat_adj'],
        'flood_adj': risk_adjustments['flood_adj'],
        'drought_adj': risk_adjustments['drought_adj'],
        'component_scores': scores,
        'risk_adjustments': risk_adjustments
    }
    
    return result


def normalize_yield_prediction(yhat: float, y_std: Optional[float] = None) -> float:
    """
    Normalize yield prediction to [0, 1] range.
    
    Args:
        yhat: Predicted yield
        y_std: Yield uncertainty (optional)
        
    Returns:
        Normalized yield score (0.0 to 1.0)
    """
    # Simple min-max normalization (could be improved with historical data)
    # For now, assume reasonable yield range
    min_yield = 0.0
    max_yield = 10000.0  # kg/ha
    
    normalized = (yhat - min_yield) / (max_yield - min_yield)
    
    # Apply uncertainty penalty if available
    if y_std is not None:
        # Higher uncertainty reduces confidence
        uncertainty_penalty = min(y_std / 1000.0, 0.3)  # Max 30% penalty
        normalized *= (1.0 - uncertainty_penalty)
    
    return max(0.0, min(1.0, normalized))


def calculate_hybrid_score(suitability: float, yhat: float, y_std: Optional[float] = None,
                          yield_weight: float = 0.6) -> Tuple[float, bool]:
    """
    Calculate hybrid score combining suitability and yield prediction.
    
    Args:
        suitability: Suitability score (0.0 to 1.0)
        yhat: Predicted yield
        y_std: Yield uncertainty (optional)
        yield_weight: Weight for yield component (default: 0.6)
        
    Returns:
        Tuple of (hybrid_score, used_yield_flag)
    """
    if yhat is None or pd.isna(yhat):
        return suitability, False
    
    # Normalize yield prediction
    normalized_yield = normalize_yield_prediction(yhat, y_std)
    
    # Calculate hybrid score
    suitability_weight = 1.0 - yield_weight
    hybrid_score = (yield_weight * normalized_yield) + (suitability_weight * suitability)
    
    return hybrid_score, True


def create_explanation(score_result: Dict[str, Any], used_yield: bool = False, 
                      yhat: Optional[float] = None, y_std: Optional[float] = None) -> str:
    """
    Create a human-readable explanation of the scoring results.
    
    Args:
        score_result: Dictionary containing scoring results
        used_yield: Whether yield prediction was used
        yhat: Predicted yield value
        y_std: Yield uncertainty
        
    Returns:
        String explanation of the scoring
    """
    explanations = []
    
    # pH explanation
    ph_score = score_result.get('pH_score', 0)
    if ph_score >= 0.9:
        explanations.append("excellent pH match")
    elif ph_score >= 0.7:
        explanations.append("good pH match")
    elif ph_score >= 0.5:
        explanations.append("moderate pH match")
    else:
        explanations.append("poor pH match")
    
    # Texture explanation
    texture_score = score_result.get('texture_score', 0)
    if texture_score >= 0.9:
        explanations.append("suitable texture")
    elif texture_score >= 0.5:
        explanations.append("moderate texture suitability")
    else:
        explanations.append("texture mismatch")
    
    # Maturity explanation
    maturity_score = score_result.get('maturity_score', 0)
    if maturity_score >= 0.9:
        explanations.append("optimal maturity")
    elif maturity_score >= 0.7:
        explanations.append("good maturity fit")
    elif maturity_score >= 0.5:
        explanations.append("moderate maturity fit")
    else:
        explanations.append("maturity mismatch")
    
    # Zone explanation
    zone_score = score_result.get('zone_score', 0)
    if zone_score >= 0.9:
        explanations.append("zone match")
    elif zone_score >= 0.5:
        explanations.append("partial zone match")
    else:
        explanations.append("zone mismatch")
    
    # Risk adjustments
    heat_adj = score_result.get('heat_adj', 1.0)
    flood_adj = score_result.get('flood_adj', 1.0)
    drought_adj = score_result.get('drought_adj', 1.0)
    
    if heat_adj > 1.0:
        explanations.append("heat tolerant")
    elif heat_adj < 1.0:
        explanations.append("heat sensitive")
    
    if flood_adj > 1.0:
        explanations.append("flood tolerant")
    elif flood_adj < 1.0:
        explanations.append("flood sensitive")
    
    if drought_adj > 1.0:
        explanations.append("drought tolerant")
    elif drought_adj < 1.0:
        explanations.append("drought sensitive")
    
    # Yield information if used
    if used_yield and yhat is not None:
        if yhat > 0:
            explanations.append(f"predicted yield: {yhat:.0f} kg/ha")
            if y_std is not None:
                explanations.append(f"±{y_std:.0f} kg/ha uncertainty")
    
    # Combine explanations
    if explanations:
        return ", ".join(explanations)
    else:
        return "No specific scoring details available"
