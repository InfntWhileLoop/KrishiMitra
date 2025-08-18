#!/usr/bin/env python3
"""
Tests for FastAPI backend
"""

import pytest
import pandas as pd
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from app import app

# Create test client
client = TestClient(app)

# Mock data for testing
mock_traits_data = pd.DataFrame({
    'crop': ['WHEAT', 'WHEAT', 'RICE'],
    'variety': ['WHEAT_001', 'WHEAT_002', 'RICE_001'],
    'pH_min': [6.0, 6.5, 5.5],
    'pH_max': [7.5, 8.0, 7.0],
    'textures_allowed': ['loam,clay', 'loam,sandy', 'clay,loam'],
    'maturity_days': [120, 130, 140],
    'zone_codes': ['N1|N2', 'N1', 'S1|S2'],
    'heat_tol': [1, 0, 1],
    'flood_tol': [0, 1, 1],
    'drought_tol': [1, 1, 0],
    'notes': ['Test variety 1', 'Test variety 2', 'Test rice variety']
})

class TestFastAPIEndpoints:
    """Test FastAPI endpoints"""
    
    @patch('services.traits_service.TraitsService.load_traits')
    @patch('services.seedrec_service.SeedRecService.recommend_varieties')
    def test_recommend_varieties_success(self, mock_recommend, mock_load_traits):
        """Test successful variety recommendation"""
        # Mock traits service
        mock_load_traits.return_value = mock_traits_data
        
        # Mock recommendation service
        mock_recommendations = pd.DataFrame({
            'crop': ['WHEAT'],
            'variety': ['WHEAT_001'],
            'final_score': [0.85],
            'suitability': [0.85],
            'yhat': [None],
            'y_std': [None],
            'ph_score': [0.9],
            'texture_score': [1.0],
            'maturity_score': [0.8],
            'zone_score': [1.0],
            'heat_adj': [1.05],
            'flood_adj': [0.95],
            'drought_adj': [1.05],
            'reasons': ['Good pH match, suitable texture, appropriate maturity']
        })
        mock_recommend.return_value = mock_recommendations
        
        # Test request
        request_data = {
            "crop": "WHEAT",
            "soil_ph": 7.0,
            "soil_texture": "loam",
            "season_len_days": 150,
            "zone_code": "N1",
            "risk_flags": {
                "heat_risk": True,
                "flood_risk": False,
                "drought_risk": True
            },
            "top_k": 3,
            "use_hybrid": False
        }
        
        response = client.post("/api/seed/recommend", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_varieties"] == 3
        assert len(data["recommendations"]) == 1
        assert data["recommendations"][0]["variety"] == "WHEAT_001"
        assert data["used_yield"] == False
    
    @patch('services.traits_service.TraitsService.load_traits')
    def test_recommend_varieties_no_crop_found(self, mock_load_traits):
        """Test recommendation when crop is not found"""
        # Mock traits service to return empty data
        mock_load_traits.return_value = pd.DataFrame()
        
        request_data = {
            "crop": "UNKNOWN_CROP",
            "soil_ph": 7.0,
            "soil_texture": "loam",
            "season_len_days": 150,
            "zone_code": "N1",
            "risk_flags": {},
            "top_k": 3,
            "use_hybrid": False
        }
        
        response = client.post("/api/seed/recommend", json=request_data)
        
        assert response.status_code == 404
        assert "No varieties found for crop" in response.json()["detail"]
    
    @patch('services.traits_service.TraitsService.load_traits')
    def test_recommend_varieties_traits_load_failure(self, mock_load_traits):
        """Test recommendation when traits loading fails"""
        # Mock traits service to return None
        mock_load_traits.return_value = None
        
        request_data = {
            "crop": "WHEAT",
            "soil_ph": 7.0,
            "soil_texture": "loam",
            "season_len_days": 150,
            "zone_code": "N1",
            "risk_flags": {},
            "top_k": 3,
            "use_hybrid": False
        }
        
        response = client.post("/api/seed/recommend", json=request_data)
        
        assert response.status_code == 500
        assert "Failed to load traits data" in response.json()["detail"]
    
    @patch('services.traits_service.TraitsService.validate_traits')
    def test_validate_traits_success(self, mock_validate):
        """Test successful traits validation"""
        # Mock validation service
        mock_validate.return_value = {
            'valid': True,
            'errors': [],
            'warnings': ['Some warnings'],
            'message': 'Traits file is valid with 3 varieties'
        }
        
        response = client.post("/api/seed/traits/validate")
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert len(data["errors"]) == 0
        assert len(data["warnings"]) == 1
    
    @patch('services.traits_service.TraitsService.validate_traits')
    def test_validate_traits_with_errors(self, mock_validate):
        """Test traits validation with errors"""
        # Mock validation service with errors
        mock_validate.return_value = {
            'valid': False,
            'errors': ['Missing required column: pH_min', 'Invalid pH range'],
            'warnings': [],
            'message': 'Traits file has 2 errors and 0 warnings'
        }
        
        response = client.post("/api/seed/traits/validate")
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert len(data["errors"]) == 2
        assert len(data["warnings"]) == 0
    
    @patch('services.yield_infer.YieldInferenceService.get_available_crops')
    def test_get_available_models_success(self, mock_get_crops):
        """Test getting available yield models"""
        # Mock yield service
        mock_get_crops.return_value = ['WHEAT', 'RICE', 'MAIZE']
        
        response = client.get("/api/seed/models/available")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_models"] == 3
        assert "WHEAT" in data["available_crops"]
        assert "RICE" in data["available_crops"]
        assert "MAIZE" in data["available_crops"]
    
    @patch('services.yield_infer.YieldInferenceService.get_available_crops')
    def test_get_available_models_empty(self, mock_get_crops):
        """Test getting available models when none exist"""
        # Mock yield service to return empty list
        mock_get_crops.return_value = []
        
        response = client.get("/api/seed/models/available")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_models"] == 0
        assert len(data["available_crops"]) == 0
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Seed Variety Recommender API"
        assert data["version"] == "1.0.0"
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

class TestFastAPIValidation:
    """Test FastAPI request validation"""
    
    def test_recommend_request_validation_ph_range(self):
        """Test pH validation in request"""
        # Test pH too low
        request_data = {
            "crop": "WHEAT",
            "soil_ph": -1.0,  # Invalid: below 0
            "soil_texture": "loam",
            "season_len_days": 150,
            "zone_code": "N1",
            "risk_flags": {},
            "top_k": 3,
            "use_hybrid": False
        }
        
        response = client.post("/api/seed/recommend", json=request_data)
        assert response.status_code == 422  # Validation error
        
        # Test pH too high
        request_data["soil_ph"] = 15.0  # Invalid: above 14
        response = client.post("/api/seed/recommend", json=request_data)
        assert response.status_code == 422
    
    def test_recommend_request_validation_season_length(self):
        """Test season length validation in request"""
        # Test season too short
        request_data = {
            "crop": "WHEAT",
            "soil_ph": 7.0,
            "soil_texture": "loam",
            "season_len_days": 30,  # Invalid: below 60
            "zone_code": "N1",
            "risk_flags": {},
            "top_k": 3,
            "use_hybrid": False
        }
        
        response = client.post("/api/seed/recommend", json=request_data)
        assert response.status_code == 422
        
        # Test season too long
        request_data["season_len_days"] = 400  # Invalid: above 365
        response = client.post("/api/seed/recommend", json=request_data)
        assert response.status_code == 422
    
    def test_recommend_request_validation_top_k_range(self):
        """Test top_k validation in request"""
        # Test top_k too low
        request_data = {
            "crop": "WHEAT",
            "soil_ph": 7.0,
            "soil_texture": "loam",
            "season_len_days": 150,
            "zone_code": "N1",
            "risk_flags": {},
            "top_k": 0,  # Invalid: below 1
            "use_hybrid": False
        }
        
        response = client.post("/api/seed/recommend", json=request_data)
        assert response.status_code == 422
        
        # Test top_k too high
        request_data["top_k"] = 25  # Invalid: above 20
        response = client.post("/api/seed/recommend", json=request_data)
        assert response.status_code == 422
