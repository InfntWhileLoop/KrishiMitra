Crop Yield Predictor 🌾
A production-ready machine learning system for agricultural yield prediction using ICRISAT district-level data and climate information.

🎯 What This System Does
This package provides a complete ML pipeline for predicting crop yields based on:

ICRISAT Data: District-level crop yields (wide format per crop)
Climate Data: Monthly rainfall, temperature, humidity, and other weather variables
Joint Analysis: Combines yield and climate data to predict agricultural outcomes
🚀 Quick Start
1. Install the Package
# Install in development mode
pip install -e .

# Or install with all dependencies
pip install -e .[dev]
2. Run the Complete Pipeline
# Run the main script (demonstrates full pipeline)
python main.py

# Or use the CLI commands
crop-yield-train --icrisat-file "ICRISAT-District Level Data.csv" --climate-file "climate_data.csv"
3. Use Individual Components
from crop_yield_predictor import load_icrisat, load_climate, build_training_table, train_yield_model

# Load data
yield_df = load_icrisat("ICRISAT-District Level Data.csv")
climate_df = load_climate("climate_data.csv")

# Build training table
training_data = build_training_table(yield_df, climate_df, crop="RICE")

# Train model
pipeline, metrics = train_yield_model(training_data, "RICE")
📊 Data Requirements
Input Files
ICRISAT CSV: District-level crop yields with columns ending in "YIELD (Kg per ha)"
Climate CSV: Monthly weather data with state/district/year columns
Optional: Variety traits data (template provided)
Expected Data Structure
State/District/Year: Geographic and temporal identifiers
Crop Yields: Columns like "RICE YIELD (Kg per ha)", "WHEAT YIELD (Kg per ha)"
Climate Variables: Monthly temperature, rainfall, humidity, etc.
🏗️ System Architecture
Core Modules
data_loader.py: Loads and preprocesses ICRISAT and climate data
features.py: Feature engineering and training table construction
models.py: ML model training and prediction
utils.py: Data standardization and utility functions
cli.py: Command-line interface
Key Features
Automatic Column Detection: Heuristically identifies state/district/year columns
Data Standardization: Normalizes geographic names and crop synonyms
Feature Engineering: Creates seasonal aggregations (Kharif, Rabi, Zaid)
Joint Modeling: Single model for both intent classification and slot filling
Uncertainty Estimation: Provides prediction confidence via RandomForest variance
🔧 Usage Examples
Command Line Interface
# Train models for all crops
crop-yield-train --icrisat-file "ICRISAT.csv" --climate-file "climate.csv"

# Train specific crop with seasonal features
crop-yield-train --icrisat-file "ICRISAT.csv" --climate-file "climate.csv" --crop RICE --add-seasonal

# Make predictions
crop-yield-predict --model-dir artifacts --crop RICE --climate-data "new_climate.csv"

# Process data without training
crop-yield process-data --icrisat-file "ICRISAT.csv" --climate-file "climate.csv"

# Explore data structure
crop-yield explore-data --icrisat-file "ICRISAT.csv"

# List trained models
crop-yield list-models
Python API
# Load and preprocess data
yield_df = load_icrisat("ICRISAT-District Level Data.csv")
climate_df = load_climate("climate_data.csv")

# Build training table
training_data = build_training_table(yield_df, climate_df, crop="RICE")

# Add seasonal features
training_data = add_seasonal_features(training_data)

# Train model
pipeline, metrics = train_yield_model(training_data, "RICE")

# Make predictions
pred, uncertainty = predict_yield(pipeline, feature_cols, climate_row)
📈 Model Performance
Reference Targets (RICE)
MAE: < 400 kg/ha
R²: > 0.65
Features: ~83 climate variables + seasonal aggregations
Model Architecture
Algorithm: RandomForest Regressor
Preprocessing: Median imputation for missing values
Validation: 80/20 train-test split
Output: Yield prediction + uncertainty estimate
🗂️ Output Structure
artifacts/
├── rf_model_rice.joblib          # Trained model
├── rice_features.json            # Feature configuration
├── rice_metrics.json             # Training metrics
└── ...

processed_data/
├── training_data.csv             # Processed training data
└── feature_summary.json          # Feature statistics

variety_traits_template.csv       # Template for variety data
🔍 Data Processing Pipeline
1. Data Standardization
Normalize state/district names (uppercase, remove punctuation)
Create canonical join keys: {state_norm}_{district_norm}_{year}
Map crop synonyms (PADDY → RICE, GEHU → WHEAT)
2. Feature Engineering
Melt wide yield format to long format
Join yield and climate data on standardized keys
Create seasonal aggregations (Kharif, Rabi, Zaid)
Filter outliers and handle missing values
3. Model Training
Split data by template to prevent leakage
Train RandomForest with cross-validation
Save model artifacts and performance metrics
🧪 Testing
# Run tests
pytest

# Run with coverage
pytest --cov=crop_yield_predictor

# Run specific test
pytest tests/test_data_loader.py
📋 Requirements
Python: 3.8+
Dependencies: pandas, numpy, scikit-learn, joblib, click
Optional: pytest, black, ruff (for development)
🚨 Important Notes
Missing Climate Data
If the "main merge" climate file is not available, the system will:

Create a sample climate dataset for demonstration
Show warnings about missing data
Continue with sample data for testing
Data Quality
Yield values are filtered (0 < yield < 20,000 kg/ha)
Outliers beyond 3 standard deviations are removed
Missing climate values are filled with median imputation
Performance Expectations
Training: 1-5 minutes per crop (depending on data size)
Inference: < 1 second per prediction
Memory: ~500MB for typical datasets
🔮 Future Enhancements
Deep Learning: LSTM/Transformer models for temporal patterns
Ensemble Methods: Combine multiple algorithms for better predictions
Feature Selection: Automated feature importance and selection
Hyperparameter Tuning: Optuna integration for model optimization
API Service: REST API for production deployment
🤝 Contributing
Fork the repository
Create a feature branch
Make your changes
Add tests
Submit a pull request
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
ICRISAT: For providing district-level agricultural data
Scikit-learn: For the robust ML framework
Pandas: For efficient data manipulation
Built with ❤️ for agricultural data science
