"""Unit tests for seed variety recommender system."""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import tempfile
import json

# Add src to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from seedrec.traits import (
    load_traits, validate_traits, get_crop_varieties, 
    parse_textures, parse_zone_codes
)
from seedrec.scoring import (
    score_ph_suitability, score_texture_suitability, score_maturity_suitability,
    score_zone_suitability, apply_risk_adjustments, combine_scores,
    score_variety, normalize_yield_prediction, calculate_hybrid_score
)
from seedrec.recommend import (
    create_explanation, recommend_varieties, save_recommendations, load_recommendations
)


class TestTraits:
    """Test traits loading and validation."""
    
    def test_parse_textures(self):
        """Test texture parsing."""
        assert parse_textures("clay,loam,sandy_loam") == ["clay", "loam", "sandy_loam"]
        assert parse_textures("clay, loam , sandy_loam") == ["clay", "loam", "sandy_loam"]
        assert parse_textures("") == []
        assert parse_textures(None) == []
    
    def test_parse_zone_codes(self):
        """Test zone code parsing."""
        assert parse_zone_codes("E1|E2|E3") == ["E1", "E2", "E3"]
        assert parse_zone_codes("E1| E2 |E3") == ["E1", "E2", "E3"]
        assert parse_zone_codes("") == []
        assert parse_zone_codes(None) == []
    
    def test_validate_traits_schema(self):
        """Test traits validation against schema."""
        # Valid data
        valid_data = {
            'crop': ['RICE', 'WHEAT'],
            'variety': ['IR64', 'HD2967'],
            'pH_min': [5.5, 6.0],
            'pH_max': [7.5, 8.5],
            'textures_allowed': ['clay,loam', 'loam,clay_loam'],
            'maturity_days': [120, 150],
            'zone_codes': ['E1|E2', 'N1|N2'],
            'heat_tol': [1, 1],
            'flood_tol': [1, 0],
            'drought_tol': [0, 1],
            'notes': ['High yielding', 'Heat tolerant']
        }
        
        df = pd.DataFrame(valid_data)
        is_valid, errors = validate_traits(df)
        assert is_valid
        assert len(errors) == 0
    
    def test_validate_traits_errors(self):
        """Test traits validation error detection."""
        # Invalid pH range
        invalid_data = {
            'crop': ['RICE'],
            'variety': ['IR64'],
            'pH_min': [8.0],  # min > max
            'pH_max': [7.0],
            'textures_allowed': ['clay,loam'],
            'maturity_days': [120],
            'zone_codes': ['E1'],
            'heat_tol': [1],
            'flood_tol': [1],
            'drought_tol': [0],
            'notes': ['High yielding']
        }
        
        df = pd.DataFrame(invalid_data)
        is_valid, errors = validate_traits(df)
        assert not is_valid
        assert len(errors) > 0
        assert any("pH_min" in error for error in errors)


class TestScoring:
    """Test scoring functions."""
    
    def test_ph_scoring(self):
        """Test pH suitability scoring."""
        # Perfect match
        assert score_ph_suitability(6.0, 5.5, 7.5) == 1.0
        
        # Inside range
        assert score_ph_suitability(6.5, 6.0, 7.0) == 1.0
        
        # Linear falloff outside range
        score = score_ph_suitability(5.0, 5.5, 7.5, falloff_range=0.5)
        assert 0.0 <= score < 1.0  # Allow 0.0 for edge case
        
        # Too far outside
        assert score_ph_suitability(4.0, 5.5, 7.5, falloff_range=0.5) == 0.0
    
    def test_texture_scoring(self):
        """Test texture suitability scoring."""
        # Exact match
        assert score_texture_suitability("clay", "clay,loam") == 1.0
        
        # Partial match
        assert score_texture_suitability("clay_loam", "clay,loam") == 0.8
        
        # No match
        assert score_texture_suitability("sandy", "clay,loam") == 0.0
        
        # No texture preference
        assert score_texture_suitability("clay", "") == 0.5
    
    def test_maturity_scoring(self):
        """Test maturity suitability scoring."""
        # Perfect match
        assert score_maturity_suitability(120, 120) == 1.0
        
        # Within tolerance
        assert score_maturity_suitability(130, 120, tolerance_window=60) == 1.0
        
        # Outside tolerance with falloff
        score = score_maturity_suitability(200, 120, tolerance_window=60)
        assert 0.0 < score < 1.0
    
    def test_zone_scoring(self):
        """Test zone suitability scoring."""
        # Perfect match
        assert score_zone_suitability("E1", "E1|E2") == 1.0
        
        # Zone mismatch
        assert score_zone_suitability("E3", "E1|E2") == 0.5
        
        # No zones specified
        assert score_zone_suitability("E1", "") == 1.0
    
    def test_risk_adjustments(self):
        """Test risk-based score adjustments."""
        scores = {
            'pH_score': 0.8,
            'texture_score': 0.9,
            'maturity_score': 0.7,
            'zone_score': 0.6
        }
        
        traits = pd.Series({
            'heat_tol': 1,
            'flood_tol': 0,
            'drought_tol': 1
        })
        
        risk_flags = {
            'heat_risk': True,
            'flood_risk': True,
            'drought_risk': False
        }
        
        adjusted_scores, risk_adjustments = apply_risk_adjustments(scores, traits, risk_flags)
        
        assert 'heat_adj' in risk_adjustments
        assert 'flood_adj' in risk_adjustments
        assert 'drought_adj' in risk_adjustments
        
        # Heat risk with tolerance should boost scores
        assert risk_adjustments['heat_adj'] > 1.0
        
        # Flood risk without tolerance should reduce scores
        assert risk_adjustments['flood_adj'] < 1.0
    
    def test_combine_scores(self):
        """Test score combination."""
        scores = {
            'pH_score': 0.8,
            'texture_score': 0.9,
            'maturity_score': 0.7,
            'zone_score': 0.6
        }
        
        weights = {'pH': 0.4, 'texture': 0.3, 'maturity': 0.2, 'zone': 0.1}
        
        combined = combine_scores(scores, weights)
        assert 0.0 <= combined <= 1.0
        
        # Should be weighted average
        expected = 0.8*0.4 + 0.9*0.3 + 0.7*0.2 + 0.6*0.1
        assert abs(combined - expected) < 1e-6
    
    def test_score_variety(self):
        """Test complete variety scoring."""
        traits = pd.Series({
            'crop': 'RICE',
            'variety': 'IR64',
            'pH_min': 5.5,
            'pH_max': 7.5,
            'textures_allowed': 'clay,loam',
            'maturity_days': 120,
            'zone_codes': 'E1|E2',
            'heat_tol': 1,
            'flood_tol': 1,
            'drought_tol': 0
        })
        
        context = {
            'soil_pH': 6.0,
            'soil_texture': 'clay',
            'season_len_days': 120,
            'zone_code': 'E1',
            'risk_flags': {'heat_risk': True}
        }
        
        result = score_variety(traits, context)
        
        assert 'suitability' in result
        assert 'pH_score' in result
        assert 'texture_score' in result
        assert 'maturity_score' in result
        assert 'zone_score' in result
        assert 0.0 <= result['suitability'] <= 1.0
    
    def test_yield_normalization(self):
        """Test yield prediction normalization."""
        # Normal yield
        normalized = normalize_yield_prediction(5000.0)
        assert 0.0 <= normalized <= 1.0
        
        # With uncertainty
        normalized_with_std = normalize_yield_prediction(5000.0, 500.0)
        assert normalized_with_std <= normalized  # Uncertainty should reduce score
    
    def test_hybrid_scoring(self):
        """Test hybrid score calculation."""
        # With yield prediction
        hybrid_score, used_yield = calculate_hybrid_score(0.8, 5000.0, 500.0)
        assert 0.0 <= hybrid_score <= 1.0
        assert used_yield
        
        # Without yield prediction
        hybrid_score, used_yield = calculate_hybrid_score(0.8, None, None)
        assert hybrid_score == 0.8
        assert not used_yield


class TestRecommendations:
    """Test recommendation functions."""
    
    def test_create_explanation(self):
        """Test explanation generation."""
        score_result = {
            'pH_score': 0.9,
            'texture_score': 1.0,
            'maturity_score': 0.8,
            'zone_score': 1.0,
            'heat_adj': 1.05,
            'flood_adj': 0.95,
            'drought_adj': 1.0
        }
        
        explanation = create_explanation(score_result)
        assert "pH match ✓" in explanation
        assert "texture match ✓" in explanation
        assert "heat-tolerant" in explanation
    
    def test_recommend_varieties_basic(self):
        """Test basic variety recommendations."""
        # Create temporary traits file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            traits_data = {
                'crop': ['RICE', 'RICE', 'WHEAT'],
                'variety': ['IR64', 'Swarna', 'HD2967'],
                'pH_min': [5.5, 5.0, 6.0],
                'pH_max': [7.5, 8.0, 8.5],
                'textures_allowed': ['clay,loam', 'clay,loam,loam', 'loam,clay_loam'],
                'maturity_days': [120, 135, 150],
                'zone_codes': ['E1|E2', 'E1|E2', 'N1|N2'],
                'heat_tol': [1, 0, 1],
                'flood_tol': [1, 1, 0],
                'drought_tol': [0, 1, 1],
                'notes': ['High yielding', 'Drought tolerant', 'Heat tolerant']
            }
            df = pd.DataFrame(traits_data)
            df.to_csv(f.name, index=False)
            traits_file = f.name
        
        try:
            # Test recommendations
            recommendations_df, metadata = recommend_varieties(
                traits_file=traits_file,
                crop='RICE',
                soil_pH=6.0,
                soil_texture='clay',
                season_len_days=120,
                zone_code='E1',
                top_k=2
            )
            
            assert len(recommendations_df) == 2
            assert 'final_score' in recommendations_df.columns
            assert 'reasons' in recommendations_df.columns
            assert metadata['crop'] == 'RICE'
            assert metadata['total_varieties'] == 2
            
        finally:
            # Cleanup
            Path(traits_file).unlink()
    
    def test_save_load_recommendations(self):
        """Test saving and loading recommendations."""
        # Create sample recommendations
        recommendations_df = pd.DataFrame({
            'crop': ['RICE'],
            'variety': ['IR64'],
            'final_score': [0.85],
            'suitability': [0.80]
        })
        
        metadata = {
            'crop': 'RICE',
            'total_varieties': 1,
            'top_k': 1
        }
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            output_file = f.name
        
        try:
            save_recommendations(recommendations_df, metadata, output_file)
            
            # Load back
            loaded_df, loaded_metadata = load_recommendations(output_file)
            
            assert len(loaded_df) == len(recommendations_df)
            assert loaded_metadata['crop'] == metadata['crop']
            
        finally:
            # Cleanup
            Path(output_file).unlink()


class TestIntegration:
    """Test integration scenarios."""
    
    def test_end_to_end_recommendation(self):
        """Test complete recommendation pipeline."""
        # Create comprehensive traits file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            traits_data = {
                'crop': ['RICE', 'RICE', 'RICE'],
                'variety': ['IR64', 'Swarna', 'Basmati370'],
                'pH_min': [5.5, 5.0, 6.0],
                'pH_max': [7.5, 8.0, 7.5],
                'textures_allowed': ['clay,loam', 'clay,loam,sandy_loam', 'clay_loam,loam'],
                'maturity_days': [120, 135, 140],
                'zone_codes': ['E1|E2|E3', 'E1|E2', 'E1'],
                'heat_tol': [1, 0, 0],
                'flood_tol': [1, 1, 0],
                'drought_tol': [0, 1, 0],
                'notes': ['High yielding, flood tolerant', 'Drought tolerant', 'Premium quality']
            }
            df = pd.DataFrame(traits_data)
            df.to_csv(f.name, index=False)
            traits_file = f.name
        
        try:
            # Test with different conditions
            recommendations_df, metadata = recommend_varieties(
                traits_file=traits_file,
                crop='RICE',
                soil_pH=6.5,
                soil_texture='clay_loam',
                season_len_days=130,
                zone_code='E2',
                top_k=3,
                risk_flags={'heat_risk': True, 'flood_risk': False}
            )
            
            # Should return all 3 varieties
            assert len(recommendations_df) == 3
            
            # Check that scores are sorted
            scores = recommendations_df['final_score'].values
            assert all(scores[i] >= scores[i+1] for i in range(len(scores)-1))
            
            # Check that explanations are generated
            assert all(pd.notna(reason) for reason in recommendations_df['reasons'])
            
        finally:
            # Cleanup
            Path(traits_file).unlink()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
