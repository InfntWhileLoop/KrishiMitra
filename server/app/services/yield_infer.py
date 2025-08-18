#!/usr/bin/env python3
"""
Yield Inference Service - Safely loads yield model artifacts and provides predictions
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from functools import lru_cache

class YieldInferenceService:
    """Service for yield model inference"""
    
    def __init__(self, artifacts_dir: Optional[str] = None):
        """
        Initialize yield inference service
        
        Args:
            artifacts_dir: Directory containing model artifacts. If None, uses environment variable or default.
        """
        self.artifacts_dir = artifacts_dir or os.getenv("ARTIFACTS_DIR", "artifacts")
        self._loaded_models = {}
        self._feature_columns = {}
    
    def has_yield_model(self, crop: str) -> bool:
        """
        Check if yield model is available for a crop
        
        Args:
            crop: Crop name
            
        Returns:
            True if model is available, False otherwise
        """
        try:
            model_path = os.path.join(self.artifacts_dir, f"rf_model_{crop.upper()}.joblib")
            features_path = os.path.join(self.artifacts_dir, f"{crop.upper()}_features.json")
            
            return os.path.exists(model_path) and os.path.exists(features_path)
        except Exception:
            return False
    
    def get_available_crops(self) -> List[str]:
        """
        Get list of crops with available yield models
        
        Returns:
            List of crop names
        """
        try:
            if not os.path.exists(self.artifacts_dir):
                return []
            
            available_crops = []
            for filename in os.listdir(self.artifacts_dir):
                if filename.startswith("rf_model_") and filename.endswith(".joblib"):
                    crop = filename.replace("rf_model_", "").replace(".joblib", "")
                    if self.has_yield_model(crop):
                        available_crops.append(crop)
            
            return sorted(available_crops)
            
        except Exception as e:
            print(f"Warning: Failed to scan artifacts directory: {e}")
            return []
    
    def get_feature_columns(self, crop: str) -> List[str]:
        """
        Get feature columns for a crop's yield model
        
        Args:
            crop: Crop name
            
        Returns:
            List of feature column names
        """
        if crop in self._feature_columns:
            return self._feature_columns[crop]
        
        try:
            features_path = os.path.join(self.artifacts_dir, f"{crop.upper()}_features.json")
            if not os.path.exists(features_path):
                return []
            
            with open(features_path, 'r') as f:
                features_data = json.load(f)
            
            feature_cols = features_data.get('feature_columns', [])
            self._feature_columns[crop] = feature_cols
            return feature_cols
            
        except Exception as e:
            print(f"Warning: Failed to load feature columns for {crop}: {e}")
            return []
    
    def predict_row(self, climate_row: Dict) -> Tuple[float, float]:
        """
        Make yield prediction for a single climate row
        
        Args:
            climate_row: Dictionary with climate features
            
        Returns:
            Tuple of (predicted_yield, uncertainty_std)
        """
        # This is a placeholder - in a real implementation, you'd need to specify which crop
        # For now, we'll use the first available model
        available_crops = self.get_available_crops()
        if not available_crops:
            raise ValueError("No yield models available")
        
        # Use the first available crop (you might want to make this more sophisticated)
        crop = available_crops[0]
        return self.predict_row_for_crop(climate_row, crop)
    
    def predict_row_for_crop(self, climate_row: Dict, crop: str) -> Tuple[float, float]:
        """
        Make yield prediction for a specific crop
        
        Args:
            climate_row: Dictionary with climate features
            crop: Crop name
            
        Returns:
            Tuple of (predicted_yield, uncertainty_std)
        """
        try:
            # Load model if not already loaded
            if crop not in self._loaded_models:
                self._load_model(crop)
            
            if crop not in self._loaded_models:
                raise ValueError(f"Failed to load model for crop: {crop}")
            
            model = self._loaded_models[crop]
            feature_cols = self.get_feature_columns(crop)
            
            if not feature_cols:
                raise ValueError(f"No feature columns found for crop: {crop}")
            
            # Prepare input data
            input_data = []
            for col in feature_cols:
                if col in climate_row:
                    input_data.append(climate_row[col])
                else:
                    # Use default value for missing features
                    input_data.append(0.0)
            
            # Convert to numpy array and reshape
            X = np.array(input_data).reshape(1, -1)
            
            # Make prediction
            yhat = model.predict(X)[0]
            
            # Get uncertainty estimate (if available)
            if hasattr(model, 'estimators_'):
                # RandomForest - get std across trees
                predictions = []
                for estimator in model.estimators_:
                    pred = estimator.predict(X)[0]
                    predictions.append(pred)
                y_std = np.std(predictions)
            else:
                # Default uncertainty
                y_std = yhat * 0.1  # 10% of prediction
            
            return float(yhat), float(y_std)
            
        except Exception as e:
            print(f"Error making prediction for {crop}: {e}")
            raise
    
    def _load_model(self, crop: str) -> None:
        """
        Load yield model for a crop
        
        Args:
            crop: Crop name
        """
        try:
            model_path = os.path.join(self.artifacts_dir, f"rf_model_{crop.upper()}.joblib")
            
            if not os.path.exists(model_path):
                print(f"Model file not found: {model_path}")
                return
            
            # Load the model
            model = joblib.load(model_path)
            self._loaded_models[crop] = model
            
            print(f"Successfully loaded yield model for {crop}")
            
        except Exception as e:
            print(f"Failed to load model for {crop}: {e}")
    
    def get_model_info(self, crop: str) -> Optional[Dict]:
        """
        Get information about a yield model
        
        Args:
            crop: Crop name
            
        Returns:
            Dictionary with model information or None
        """
        try:
            if not self.has_yield_model(crop):
                return None
            
            # Load model if not already loaded
            if crop not in self._loaded_models:
                self._load_model(crop)
            
            if crop not in self._loaded_models:
                return None
            
            model = self._loaded_models[crop]
            feature_cols = self.get_feature_columns(crop)
            
            # Get model metrics if available
            metrics_path = os.path.join(self.artifacts_dir, f"{crop.upper()}_metrics.json")
            metrics = {}
            if os.path.exists(metrics_path):
                try:
                    with open(metrics_path, 'r') as f:
                        metrics = json.load(f)
                except Exception:
                    pass
            
            return {
                'crop': crop,
                'model_type': type(model).__name__,
                'feature_count': len(feature_cols),
                'features': feature_cols,
                'metrics': metrics
            }
            
        except Exception as e:
            print(f"Failed to get model info for {crop}: {e}")
            return None
    
    def clear_cache(self) -> None:
        """Clear loaded models cache"""
        self._loaded_models.clear()
        self._feature_columns.clear()
