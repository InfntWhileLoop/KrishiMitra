#!/usr/bin/env python3
"""
Seed Recommendation Service - Implements scoring rules and recommendation logic
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from functools import lru_cache

from src.seedrec.scoring import score_variety, create_explanation
from services.yield_infer import YieldInferenceService

class SeedRecService:
    """Service for seed variety recommendations"""
    
    def __init__(self, yield_service: Optional[YieldInferenceService] = None):
        """
        Initialize seed recommendation service
        
        Args:
            yield_service: Optional yield inference service for hybrid scoring
        """
        self.yield_service = yield_service or YieldInferenceService()
        
        # Default scoring weights (configurable via environment)
        self.weights = {
            'pH': float(os.getenv('SCORE_WEIGHT_PH', '0.35')),
            'texture': float(os.getenv('SCORE_WEIGHT_TEXTURE', '0.25')),
            'maturity': float(os.getenv('SCORE_WEIGHT_MATURITY', '0.25')),
            'zone': float(os.getenv('SCORE_WEIGHT_ZONE', '0.15'))
        }
        
        # Configurable parameters
        self.ph_tolerance = float(os.getenv('PH_TOLERANCE', '0.5'))
        self.maturity_tolerance = int(os.getenv('MATURITY_TOLERANCE', '60'))
        self.zone_penalty = float(os.getenv('ZONE_PENALTY', '0.5'))
        self.hybrid_weights = {
            'yield': float(os.getenv('HYBRID_YIELD_WEIGHT', '0.6')),
            'suitability': float(os.getenv('HYBRID_SUITABILITY_WEIGHT', '0.4'))
        }
    
    def recommend_varieties(
        self,
        traits_df: pd.DataFrame,
        crop: str,
        soil_ph: float,
        soil_texture: str,
        season_len_days: int,
        zone_code: str,
        risk_flags: Dict[str, bool],
        top_k: int = 5,
        use_hybrid: bool = False
    ) -> pd.DataFrame:
        """
        Get top-k variety recommendations for given conditions
        
        Args:
            traits_df: DataFrame with variety traits
            crop: Crop name
            soil_ph: Soil pH value
            soil_texture: Soil texture
            season_len_days: Growing season length in days
            zone_code: Zone code
            risk_flags: Dictionary with risk flags
            top_k: Number of top recommendations
            use_hybrid: Whether to use yield model for hybrid scoring
            
        Returns:
            DataFrame with ranked recommendations
        """
        if traits_df.empty:
            return pd.DataFrame()
        
        # Score each variety
        scored_varieties = []
        
        for _, trait_row in traits_df.iterrows():
            # Get base suitability score
            score_result = score_variety(
                traits=trait_row,
                context={
                    'soil_pH': soil_ph,
                    'soil_texture': soil_texture,
                    'season_len_days': season_len_days,
                    'zone_code': zone_code,
                    'risk_flags': risk_flags
                },
                weights=self.weights,
                tolerances={
                    'pH_falloff': self.ph_tolerance,
                    'maturity_window': self.maturity_tolerance,
                    'zone_penalty': self.zone_penalty
                }
            )
            

            
            # Get yield prediction if hybrid mode is enabled
            yhat = None
            y_std = None
            used_yield = False
            
            if use_hybrid and self.yield_service.has_yield_model(crop):
                try:
                    # Create climate row for yield prediction
                    climate_row = self._create_climate_row_for_crop(crop)
                    if climate_row:
                        yhat, y_std = self.yield_service.predict_row(climate_row)
                        used_yield = True
                except Exception as e:
                    print(f"Warning: Failed to get yield prediction for {crop}: {e}")
            
            # Calculate final score
            if used_yield and yhat is not None:
                # Normalize yield to 0-1 range (assuming reasonable yield range)
                yield_normalized = self._normalize_yield(yhat, crop)
                final_score = (
                    self.hybrid_weights['yield'] * yield_normalized +
                    self.hybrid_weights['suitability'] * score_result['suitability']
                )
            else:
                final_score = score_result['suitability']
            
            # Create explanation
            reasons = create_explanation(score_result, used_yield, yhat, y_std)
            
            # Store results
            scored_varieties.append({
                'crop': crop,
                'variety': trait_row['variety'],
                'final_score': final_score,
                'suitability': score_result['suitability'],
                'yhat': yhat,
                'y_std': y_std,
                'ph_score': score_result['pH_score'],
                'texture_score': score_result['texture_score'],
                'maturity_score': score_result['maturity_score'],
                'zone_score': score_result['zone_score'],
                'heat_adj': score_result['heat_adj'],
                'flood_adj': score_result['flood_adj'],
                'drought_adj': score_result['drought_adj'],
                'reasons': reasons
            })
        
        # Convert to DataFrame and sort by final score
        results_df = pd.DataFrame(scored_varieties)
        if not results_df.empty:
            results_df = results_df.sort_values('final_score', ascending=False).head(top_k)
        
        return results_df
    
    def _create_climate_row_for_crop(self, crop: str) -> Optional[Dict]:
        """
        Create a sample climate row for yield prediction
        
        Args:
            crop: Crop name
            
        Returns:
            Dictionary with climate features or None if not available
        """
        try:
            # Get feature columns for the crop
            feature_cols = self.yield_service.get_feature_columns(crop)
            if not feature_cols:
                return None
            
            # Create a default climate row (you might want to make this more sophisticated)
            climate_row = {}
            for col in feature_cols:
                if 'TEMP' in col.upper():
                    climate_row[col] = 25.0  # Default temperature
                elif 'RAIN' in col.upper() or 'PRECIP' in col.upper():
                    climate_row[col] = 100.0  # Default rainfall
                elif 'HUMID' in col.upper():
                    climate_row[col] = 70.0  # Default humidity
                else:
                    climate_row[col] = 0.0  # Default for other features
            
            return climate_row
            
        except Exception as e:
            print(f"Warning: Failed to create climate row: {e}")
            return None
    
    def _normalize_yield(self, yhat: float, crop: str) -> float:
        """
        Normalize yield prediction to 0-1 range
        
        Args:
            yhat: Raw yield prediction
            crop: Crop name
            
        Returns:
            Normalized yield score (0-1)
        """
        # Define reasonable yield ranges for different crops (kg/ha)
        yield_ranges = {
            'WHEAT': (2000, 6000),
            'RICE': (3000, 8000),
            'MAIZE': (4000, 10000),
            'COTTON': (1000, 3000),
            'SUGARCANE': (50000, 120000)
        }
        
        # Get range for crop, or use default
        min_yield, max_yield = yield_ranges.get(crop.upper(), (1000, 10000))
        
        # Normalize to 0-1 range
        normalized = (yhat - min_yield) / (max_yield - min_yield)
        return np.clip(normalized, 0.0, 1.0)
    
    def get_scoring_weights(self) -> Dict[str, float]:
        """Get current scoring weights"""
        return self.weights.copy()
    
    def update_scoring_weights(self, new_weights: Dict[str, float]) -> None:
        """
        Update scoring weights
        
        Args:
            new_weights: Dictionary with new weight values
        """
        for key, value in new_weights.items():
            if key in self.weights and 0 <= value <= 1:
                self.weights[key] = value
        
        # Normalize weights to sum to 1
        total_weight = sum(self.weights.values())
        if total_weight > 0:
            for key in self.weights:
                self.weights[key] /= total_weight
