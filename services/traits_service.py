#!/usr/bin/env python3
"""
Traits Service - Handles loading and validation of variety traits data
"""

import os
import pandas as pd
from typing import Dict, List, Optional
from functools import lru_cache

class TraitsService:
    """Service for managing variety traits data"""
    
    def __init__(self, traits_path: Optional[str] = None):
        """
        Initialize traits service
        
        Args:
            traits_path: Path to traits CSV file. If None, uses environment variable or default.
        """
        self.traits_path = traits_path or os.getenv("TRAITS_PATH", "data/variety_traits.csv")
        
        # Expected schema for traits CSV
        self.expected_columns = [
            'crop', 'variety', 'pH_min', 'pH_max', 'textures_allowed',
            'maturity_days', 'zone_codes', 'heat_tol', 'flood_tol', 'drought_tol', 'notes'
        ]
        
        # Expected data types
        self.expected_dtypes = {
            'crop': 'object',
            'variety': 'object',
            'pH_min': 'float64',
            'pH_max': 'float64',
            'textures_allowed': 'object',
            'maturity_days': 'int64',
            'zone_codes': 'object',
            'heat_tol': 'int64',
            'flood_tol': 'int64',
            'drought_tol': 'int64',
            'notes': 'object'
        }
    
    @lru_cache(maxsize=1)
    def load_traits(self) -> Optional[pd.DataFrame]:
        """
        Load traits data from CSV file with caching
        
        Returns:
            DataFrame with traits data or None if loading fails
        """
        try:
            if not os.path.exists(self.traits_path):
                print(f"Warning: Traits file not found at {self.traits_path}")
                return None
            
            df = pd.read_csv(self.traits_path)
            
            # Basic validation
            if len(df) == 0:
                print("Warning: Traits file is empty")
                return None
            
            # Validate required columns
            missing_cols = set(self.expected_columns) - set(df.columns)
            if missing_cols:
                print(f"Warning: Missing columns in traits file: {missing_cols}")
                return None
            
            return df
            
        except Exception as e:
            print(f"Error loading traits file: {e}")
            return None
    
    def validate_traits(self, df: pd.DataFrame) -> Dict:
        """
        Validate traits DataFrame schema and data quality
        
        Args:
            df: DataFrame to validate
            
        Returns:
            Dictionary with validation results
        """
        errors = []
        warnings = []
        
        try:
            # Check required columns
            missing_cols = set(self.expected_columns) - set(df.columns)
            if missing_cols:
                errors.append(f"Missing required columns: {missing_cols}")
            
            # Check data types for numeric columns
            numeric_cols = ['pH_min', 'pH_max', 'maturity_days', 'heat_tol', 'flood_tol', 'drought_tol']
            for col in numeric_cols:
                if col in df.columns:
                    if not pd.api.types.is_numeric_dtype(df[col]):
                        errors.append(f"Column '{col}' should be numeric, got {df[col].dtype}")
            
            # Check for missing values in critical columns
            critical_cols = ['crop', 'variety', 'pH_min', 'pH_max', 'maturity_days']
            for col in critical_cols:
                if col in df.columns:
                    missing_count = df[col].isna().sum()
                    if missing_count > 0:
                        warnings.append(f"Column '{col}' has {missing_count} missing values")
            
            # Check pH range validity
            if 'pH_min' in df.columns and 'pH_max' in df.columns:
                invalid_ph = df[df['pH_min'] >= df['pH_max']]
                if len(invalid_ph) > 0:
                    errors.append(f"Found {len(invalid_ph)} rows where pH_min >= pH_max")
                
                out_of_range = df[(df['pH_min'] < 0) | (df['pH_max'] > 14)]
                if len(out_of_range) > 0:
                    warnings.append(f"Found {len(out_of_range)} rows with pH values outside 0-14 range")
            
            # Check tolerance values
            tolerance_cols = ['heat_tol', 'flood_tol', 'drought_tol']
            for col in tolerance_cols:
                if col in df.columns:
                    invalid_vals = df[~df[col].isin([0, 1])]
                    if len(invalid_vals) > 0:
                        errors.append(f"Column '{col}' should contain only 0 or 1, found {len(invalid_vals)} invalid values")
            
            # Check maturity days range
            if 'maturity_days' in df.columns:
                out_of_range = df[(df['maturity_days'] < 30) | (df['maturity_days'] > 365)]
                if len(out_of_range) > 0:
                    warnings.append(f"Found {len(out_of_range)} rows with maturity_days outside 30-365 range")
            
            # Check for duplicate crop-variety combinations
            if 'crop' in df.columns and 'variety' in df.columns:
                duplicates = df.duplicated(subset=['crop', 'variety'])
                if duplicates.any():
                    warnings.append(f"Found {duplicates.sum()} duplicate crop-variety combinations")
            
            # Determine overall validity
            valid = len(errors) == 0
            
            # Create message
            if valid:
                message = f"Traits file is valid with {len(df)} varieties"
            else:
                message = f"Traits file has {len(errors)} errors and {len(warnings)} warnings"
            
            return {
                'valid': valid,
                'errors': errors,
                'warnings': warnings,
                'message': message
            }
            
        except Exception as e:
            return {
                'valid': False,
                'errors': [f"Validation failed: {str(e)}"],
                'warnings': [],
                'message': "Validation failed due to unexpected error"
            }
    
    def get_crops(self) -> List[str]:
        """
        Get list of available crops
        
        Returns:
            List of crop names
        """
        df = self.load_traits()
        if df is None or 'crop' not in df.columns:
            return []
        
        return sorted(df['crop'].unique())
    
    def get_varieties_for_crop(self, crop: str) -> List[str]:
        """
        Get list of varieties for a specific crop
        
        Args:
            crop: Crop name
            
        Returns:
            List of variety names
        """
        df = self.load_traits()
        if df is None or 'crop' not in df.columns:
            return []
        
        crop_df = df[df['crop'].str.upper() == crop.upper()]
        return sorted(crop_df['variety'].unique())
