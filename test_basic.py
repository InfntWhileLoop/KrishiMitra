#!/usr/bin/env python3
"""Basic tests for the crop yield predictor package."""

import pandas as pd
import numpy as np
from pathlib import Path
import tempfile
import shutil

# Test the package imports
def test_imports():
    """Test that all modules can be imported."""
    try:
        from crop_yield_predictor import (
            load_icrisat, load_climate, build_training_table, 
            train_yield_model, predict_yield, norm
        )
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False


def test_utils():
    """Test utility functions."""
    try:
        from crop_yield_predictor.utils import norm, normalize_crop_name, validate_yield_value
        
        # Test norm function
        assert norm("  Uttar Pradesh  ") == "UTTAR PRADESH"
        assert norm("Madhya Pradesh!") == "MADHYA PRADESH"
        assert norm("  New   Delhi  ") == "NEW DELHI"
        
        # Test crop normalization
        assert normalize_crop_name("PADDY") == "RICE"
        assert normalize_crop_name("GEHU") == "WHEAT"
        
        # Test yield validation
        assert validate_yield_value(1000) == True
        assert validate_yield_value(0) == False
        assert validate_yield_value(25000) == False
        
        print("✅ Utility functions working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Utility test failed: {e}")
        return False


def test_data_loader():
    """Test data loading functionality."""
    try:
        from crop_yield_predictor.data_loader import create_variety_traits_template
        
        # Test variety traits template creation
        template_df = create_variety_traits_template()
        assert len(template_df.columns) > 0
        assert 'variety_name' in template_df.columns
        assert 'crop' in template_df.columns
        
        print("✅ Data loader functions working")
        return True
        
    except Exception as e:
        print(f"❌ Data loader test failed: {e}")
        return False


def test_features():
    """Test feature engineering functions."""
    try:
        from crop_yield_predictor.features import create_feature_summary
        
        # Create sample data
        sample_data = pd.DataFrame({
            'state': ['UP', 'MP', 'RJ'],
            'district': ['Delhi', 'Indore', 'Jaipur'],
            'year': [2020, 2020, 2020],
            'crop': ['RICE', 'WHEAT', 'COTTON'],
            'yield_kg_ha': [3000, 2500, 1800],
            'feature1': [1.0, 2.0, 3.0],
            'feature2': [10.0, 20.0, 30.0]
        })
        
        # Test feature summary
        summary = create_feature_summary(sample_data)
        assert summary['total_features'] == 2
        assert summary['data_shape'][0] == 3  # rows
        assert 'RICE' in summary['crops']
        
        print("✅ Feature functions working")
        return True
        
    except Exception as e:
        print(f"❌ Feature test failed: {e}")
        return False


def test_models():
    """Test model functions."""
    try:
        from crop_yield_predictor.models import create_prediction_report
        
        # Test prediction report
        predictions = [1000, 2000, 3000]
        uncertainties = [100, 200, 300]
        actual_values = [1100, 1900, 3100]
        
        report = create_prediction_report(predictions, uncertainties, actual_values)
        assert len(report) == 3
        assert 'predicted_yield' in report.columns
        assert 'uncertainty' in report.columns
        
        print("✅ Model functions working")
        return True
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False


def test_cli():
    """Test CLI functionality."""
    try:
        from crop_yield_predictor.cli import cli
        assert cli is not None
        print("✅ CLI module accessible")
        return True
        
    except Exception as e:
        print(f"❌ CLI test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("🧪 Running Crop Yield Predictor Tests")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_utils,
        test_data_loader,
        test_features,
        test_models,
        test_cli
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Package is working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Check the output above for details.")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
