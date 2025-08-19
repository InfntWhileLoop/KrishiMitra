#!/usr/bin/env python3
"""
Main script for Crop Yield Predictor - demonstrates the complete pipeline.

This script shows how to:
1. Load and preprocess ICRISAT and climate data
2. Build training tables with feature engineering
3. Train RandomForest models for yield prediction
4. Make predictions with uncertainty estimates
"""

import logging
import pandas as pd
from pathlib import Path

<<<<<<< HEAD
from crop_yield_predictor.data_loader import load_icrisat, load_climate, create_variety_traits_template
from crop_yield_predictor.features import build_training_table, add_seasonal_features
from crop_yield_predictor.models import train_yield_model, predict_yield, load_trained_model
=======
from app.crop_yield_predictor.data_loader import load_icrisat, load_climate, create_variety_traits_template
from app.crop_yield_predictor.features import build_training_table, add_seasonal_features
from app.crop_yield_predictor.models import train_yield_model, predict_yield, load_trained_model
>>>>>>> a4a1021 (Initial commit with changes)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Run the complete crop yield prediction pipeline."""
    logger.info("🚀 Starting Crop Yield Prediction Pipeline")
    
    # Check if required files exist
    icrisat_file = "ICRISAT-District Level Data.csv"
    climate_file = "main merge (droped _merge==2) (560 dist 1990-2015).csv"
    
    if not Path(icrisat_file).exists():
        logger.error(f"ICRISAT file not found: {icrisat_file}")
        logger.info("Please ensure the ICRISAT CSV file is in the current directory")
        return
    
    if not Path(climate_file).exists():
        logger.warning(f"Climate file not found: {climate_file}")
        logger.info("Creating a sample climate dataset for demonstration...")
        climate_file = create_sample_climate_data()
    
    try:
        # Step 1: Load and preprocess data
        logger.info("📊 Step 1: Loading and preprocessing data...")
        
        # Load ICRISAT data
        yield_df = load_icrisat(icrisat_file)
        logger.info(f"✅ Loaded ICRISAT data: {len(yield_df)} yield records")
        
        # Load climate data
        climate_df = load_climate(climate_file)
        logger.info(f"✅ Loaded climate data: {len(climate_df)} climate records")
        
        # Step 2: Build training table
        logger.info("🔗 Step 2: Building training table...")
        training_data = build_training_table(yield_df, climate_df)
        logger.info(f"✅ Training table: {len(training_data)} records, {len(training_data.columns)} columns")
        
        # Step 3: Add seasonal features
        logger.info("🌦️ Step 3: Adding seasonal features...")
        training_data = add_seasonal_features(training_data)
        logger.info(f"✅ Enhanced features: {len(training_data.columns)} total columns")
        
        # Step 4: Train models for each crop
        logger.info("🤖 Step 4: Training yield prediction models...")
        
        crops = training_data['crop'].unique()
        logger.info(f"Found crops: {', '.join(crops)}")
        
        trained_models = {}
        
        for crop in crops:
            crop_data = training_data[training_data['crop'] == crop].copy()
            
            if len(crop_data) < 50:
                logger.warning(f"Insufficient data for {crop}: {len(crop_data)} samples. Skipping.")
                continue
            
            logger.info(f"Training model for {crop} ({len(crop_data)} samples)...")
            
            try:
                pipeline, metrics = train_yield_model(crop_data, crop, "artifacts")
                trained_models[crop] = {
                    'pipeline': pipeline,
                    'metrics': metrics,
                    'data': crop_data
                }
                
                logger.info(f"✅ {crop} model trained successfully!")
                logger.info(f"   Test MAE: {metrics['test_metrics']['mae']:.2f}")
                logger.info(f"   Test R²: {metrics['test_metrics']['r2']:.3f}")
                
            except Exception as e:
                logger.error(f"Failed to train {crop} model: {str(e)}")
        
        # Step 5: Demonstrate predictions
        if trained_models:
            logger.info("🔮 Step 5: Demonstrating predictions...")
            
            # Use the first available model for demonstration
            crop_name = list(trained_models.keys())[0]
            model_info = trained_models[crop_name]
            
            # Get a sample row for prediction
            sample_data = model_info['data'].iloc[0]
            
            # Make prediction
            pred, uncertainty = predict_yield(
                model_info['pipeline'],
                [col for col in model_info['data'].columns if col not in ['state', 'district', 'year', 'state_norm', 'district_norm', 'join_key', 'crop', 'yield_kg_ha']],
                sample_data
            )
            
            logger.info(f"Sample prediction for {crop_name}:")
            logger.info(f"  Location: {sample_data['state_norm']}, {sample_data['district_norm']}")
            logger.info(f"  Year: {sample_data['year']}")
            logger.info(f"  Actual yield: {sample_data['yield_kg_ha']:.2f} kg/ha")
            logger.info(f"  Predicted yield: {pred:.2f} kg/ha")
            logger.info(f"  Uncertainty: ±{uncertainty:.2f}")
        
        # Step 6: Create variety traits template
        logger.info("📋 Step 6: Creating variety traits template...")
        create_variety_traits_template()
        logger.info("✅ Variety traits template created")
        
        logger.info("🎉 Pipeline completed successfully!")
        logger.info("📁 Check the 'artifacts' directory for trained models")
        logger.info("📁 Check 'variety_traits_template.csv' for variety data template")
        
    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")
        raise


def create_sample_climate_data():
    """Create a sample climate dataset for demonstration when the real file is missing."""
    logger.info("Creating sample climate dataset...")
    
    # Create sample data
    states = ["UTTAR PRADESH", "RAJASTHAN", "MADHYA PRADESH", "GUJARAT", "MAHARASHTRA"]
    districts = ["JAIPUR", "DELHI", "MUMBAI", "AHMEDABAD", "INDORE"]
    years = list(range(1990, 2016))
    
    data = []
    for state in states:
        for district in districts:
            for year in years:
                data.append({
                    'state': state,
                    'district': district,
                    'year': year,
                    'JAN_TEMP': 20 + np.random.normal(0, 5),
                    'FEB_TEMP': 22 + np.random.normal(0, 5),
                    'MAR_TEMP': 25 + np.random.normal(0, 5),
                    'APR_TEMP': 28 + np.random.normal(0, 5),
                    'MAY_TEMP': 30 + np.random.normal(0, 5),
                    'JUN_TEMP': 32 + np.random.normal(0, 5),
                    'JUL_TEMP': 31 + np.random.normal(0, 5),
                    'AUG_TEMP': 30 + np.random.normal(0, 5),
                    'SEP_TEMP': 29 + np.random.normal(0, 5),
                    'OCT_TEMP': 27 + np.random.normal(0, 5),
                    'NOV_TEMP': 24 + np.random.normal(0, 5),
                    'DEC_TEMP': 21 + np.random.normal(0, 5),
                    'JAN_RAIN': 20 + np.random.exponential(10),
                    'FEB_RAIN': 15 + np.random.exponential(8),
                    'MAR_RAIN': 25 + np.random.exponential(12),
                    'APR_RAIN': 30 + np.random.exponential(15),
                    'MAY_RAIN': 40 + np.random.exponential(20),
                    'JUN_RAIN': 150 + np.random.exponential(50),
                    'JUL_RAIN': 200 + np.random.exponential(60),
                    'AUG_RAIN': 180 + np.random.exponential(55),
                    'SEP_RAIN': 120 + np.random.exponential(40),
                    'OCT_RAIN': 50 + np.random.exponential(25),
                    'NOV_RAIN': 20 + np.random.exponential(10),
                    'DEC_RAIN': 15 + np.random.exponential(8),
                    'JAN_HUMID': 60 + np.random.normal(0, 10),
                    'FEB_HUMID': 55 + np.random.normal(0, 10),
                    'MAR_HUMID': 50 + np.random.normal(0, 10),
                    'APR_HUMID': 45 + np.random.normal(0, 10),
                    'MAY_HUMID': 50 + np.random.normal(0, 10),
                    'JUN_HUMID': 75 + np.random.normal(0, 10),
                    'JUL_HUMID': 80 + np.random.normal(0, 10),
                    'AUG_HUMID': 80 + np.random.normal(0, 10),
                    'SEP_HUMID': 75 + np.random.normal(0, 10),
                    'OCT_HUMID': 65 + np.random.normal(0, 10),
                    'NOV_HUMID': 60 + np.random.normal(0, 10),
                    'DEC_HUMID': 65 + np.random.normal(0, 10)
                })
    
    sample_df = pd.DataFrame(data)
    sample_file = "sample_climate_data.csv"
    sample_df.to_csv(sample_file, index=False)
    
    logger.info(f"✅ Sample climate data created: {sample_file}")
    return sample_file


if __name__ == "__main__":
    import numpy as np
    main()
