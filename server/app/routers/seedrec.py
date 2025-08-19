#!/usr/bin/env python3
"""
Seed Variety Recommender API Router
"""

import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
import pandas as pd

<<<<<<< HEAD
from services.traits_service import TraitsService
from services.seedrec_service import SeedRecService
from services.yield_infer import YieldInferenceService
=======
from app.services.traits_service import TraitsService
from app.services.seedrec_service import SeedRecService
from app.services.yield_infer import YieldInferenceService
>>>>>>> a4a1021 (Initial commit with changes)

# Create router
router = APIRouter()

# Initialize services
traits_service = TraitsService()
seedrec_service = SeedRecService()
yield_service = YieldInferenceService()

# Pydantic models
class RiskFlags(BaseModel):
    heat_risk: bool = False
    flood_risk: bool = False
    drought_risk: bool = False

class RecommendRequest(BaseModel):
    crop: str = Field(..., description="Crop name (e.g., WHEAT, RICE)")
    soil_ph: float = Field(..., ge=0, le=14, description="Soil pH value")
    soil_texture: str = Field(..., description="Soil texture (e.g., loam, clay, sandy)")
    season_len_days: int = Field(..., ge=60, le=365, description="Growing season length in days")
    zone_code: str = Field(..., description="Zone code (e.g., N1, S2)")
    risk_flags: RiskFlags = Field(default_factory=RiskFlags, description="Environmental risk flags")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of top recommendations")
    use_hybrid: bool = Field(default=False, description="Whether to use yield model for hybrid scoring")

class RecommendItem(BaseModel):
    crop: str
    variety: str
    final_score: float
    suitability: float
    yhat: Optional[float] = None
    y_std: Optional[float] = None
    ph_score: float
    texture_score: float
    maturity_score: float
    zone_score: float
    heat_adj: float
    flood_adj: float
    drought_adj: float
    reasons: str

class RecommendResponse(BaseModel):
    recommendations: List[RecommendItem]
    used_yield: bool
    total_varieties: int
    message: str

class ValidateTraitsRequest(BaseModel):
    file_path: Optional[str] = Field(None, description="Path to traits CSV file")
    # Note: file upload handled separately via Form

class ValidateTraitsResponse(BaseModel):
    valid: bool
    errors: List[str]
    warnings: List[str]
    total_varieties: int
    message: str

@router.post("/recommend", response_model=RecommendResponse)
async def recommend_varieties(request: RecommendRequest):
    """
    Get seed variety recommendations based on local conditions
    """
    try:
        # Load traits data
        traits_df = traits_service.load_traits()
        if traits_df is None:
            raise HTTPException(status_code=500, detail="Failed to load traits data")
        
        # Filter by crop
        crop_traits = traits_df[traits_df['crop'].str.upper() == request.crop.upper()]
        if len(crop_traits) == 0:
            raise HTTPException(
                status_code=404, 
                detail=f"No varieties found for crop: {request.crop}"
            )
        
        # Get recommendations
        recommendations_df = seedrec_service.recommend_varieties(
            traits_df=crop_traits,
            crop=request.crop,
            soil_ph=request.soil_ph,
            soil_texture=request.soil_texture,
            season_len_days=request.season_len_days,
            zone_code=request.zone_code,
            risk_flags=request.risk_flags.dict(),
            top_k=request.top_k,
            use_hybrid=request.use_hybrid
        )
        
        # Convert to response format
        recommendations = []
        for _, row in recommendations_df.iterrows():
            item = RecommendItem(
                crop=row['crop'],
                variety=row['variety'],
                final_score=float(row['final_score']),
                suitability=float(row['suitability']),
                yhat=float(row['yhat']) if pd.notna(row['yhat']) else None,
                y_std=float(row['y_std']) if pd.notna(row['y_std']) else None,
                ph_score=float(row['ph_score']),
                texture_score=float(row['texture_score']),
                maturity_score=float(row['maturity_score']),
                zone_score=float(row['zone_score']),
                heat_adj=float(row['heat_adj']),
                flood_adj=float(row['flood_adj']),
                drought_adj=float(row['drought_adj']),
                reasons=row['reasons']
            )
            recommendations.append(item)
        
        return RecommendResponse(
            recommendations=recommendations,
            used_yield=request.use_hybrid and yield_service.has_yield_model(request.crop),
            total_varieties=len(crop_traits),
            message=f"Found {len(recommendations)} recommendations for {request.crop}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/traits/validate", response_model=ValidateTraitsResponse)
async def validate_traits(
    file: Optional[UploadFile] = File(None),
    file_path: Optional[str] = Form(None)
):
    """
    Validate traits CSV file schema
    """
    try:
        if file:
            # Handle uploaded file
            contents = await file.read()
            df = pd.read_csv(pd.io.common.BytesIO(contents))
        elif file_path:
            # Handle file path
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
            df = pd.read_csv(file_path)
        else:
            # Use default traits file
            df = traits_service.load_traits()
            if df is None:
                raise HTTPException(status_code=500, detail="No traits file available")
        
        # Validate schema
        validation_result = traits_service.validate_traits(df)
        
        return ValidateTraitsResponse(
            valid=validation_result['valid'],
            errors=validation_result['errors'],
            warnings=validation_result['warnings'],
            total_varieties=len(df) if df is not None else 0,
            message=validation_result['message']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.get("/models/available")
async def get_available_models():
    """
    Get list of crops with available yield models
    """
    try:
        available_crops = yield_service.get_available_crops()
        return {
            "available_crops": available_crops,
            "total_models": len(available_crops),
            "message": f"Found {len(available_crops)} yield models"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get available models: {str(e)}")
