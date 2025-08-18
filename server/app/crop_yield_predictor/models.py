"""Machine learning models for crop yield prediction."""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
import logging
import json
from pathlib import Path
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


def train_yield_model(
    training_data: pd.DataFrame,
    crop: str,
    output_dir: str = "artifacts",
    test_size: float = 0.2,
    random_state: int = 42
) -> Tuple[Pipeline, Dict[str, Any]]:
    """
    Train a RandomForest model for crop yield prediction.
    
    Args:
        training_data: DataFrame with features and target
        crop: Crop name for model identification
        output_dir: Directory to save model artifacts
        test_size: Fraction of data for testing
        random_state: Random seed for reproducibility
        
    Returns:
        Trained pipeline and training metrics
        
    Notes:
        - Uses RandomForestRegressor with median imputation
        - Provides uncertainty proxy via std across trees
        - Saves model, features, and metrics to artifacts
        - Reference performance on RICE: MAE ≈ 388, R² ≈ 0.699
    """
    logger.info(f"Training yield model for {crop}")
    
    # Prepare features and target
    metadata_cols = ['state', 'district', 'year', 'state_norm', 'district_norm', 'join_key', 'crop']
    target_col = 'yield_kg_ha'
    
    feature_cols = [col for col in training_data.columns if col not in metadata_cols + [target_col]]
    X = training_data[feature_cols]
    y = training_data[target_col]
    
    logger.info(f"Features: {len(feature_cols)} columns")
    logger.info(f"Training samples: {len(X)}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=None
    )
    
    logger.info(f"Train set: {len(X_train)}, Test set: {len(X_test)}")
    
    # Create pipeline
    pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('regressor', RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1
        ))
    ])
    
    # Train model
    logger.info("Training RandomForest model...")
    pipeline.fit(X_train, y_train)
    
    # Make predictions
    y_train_pred = pipeline.predict(X_train)
    y_test_pred = pipeline.predict(X_test)
    
    # Calculate metrics
    train_mae = mean_absolute_error(y_train, y_train_pred)
    train_r2 = r2_score(y_train, y_train_pred)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
    
    test_mae = mean_absolute_error(y_test, y_test_pred)
    test_r2 = r2_score(y_test, y_test_pred)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
    
    # Feature importance
    feature_importance = pipeline.named_steps['regressor'].feature_importances_
    feature_importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': feature_importance
    }).sort_values('importance', ascending=False)
    
    # Training metrics
    metrics = {
        'crop': crop,
        'model_type': 'RandomForest',
        'n_features': len(feature_cols),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'train_metrics': {
            'mae': float(train_mae),
            'r2': float(train_r2),
            'rmse': float(train_rmse)
        },
        'test_metrics': {
            'mae': float(test_mae),
            'r2': float(test_r2),
            'rmse': float(test_rmse)
        },
        'feature_importance': feature_importance_df.to_dict('records'),
        'training_date': pd.Timestamp.now().isoformat(),
        'random_state': random_state
    }
    
    # Save artifacts
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save model
    model_path = output_path / f"rf_model_{crop.lower()}.joblib"
    joblib.dump(pipeline, model_path)
    logger.info(f"Saved model to {model_path}")
    
    # Save features
    features_path = output_path / f"{crop.lower()}_features.json"
    with open(features_path, 'w') as f:
        json.dump({
            'feature_columns': feature_cols,
            'metadata_columns': metadata_cols,
            'target_column': target_col
        }, f, indent=2)
    logger.info(f"Saved features to {features_path}")
    
    # Save metrics
    metrics_path = output_path / f"{crop.lower()}_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved metrics to {metrics_path}")
    
    # Log performance
    logger.info(f"Training completed for {crop}")
    logger.info(f"Test MAE: {test_mae:.2f}")
    logger.info(f"Test R²: {test_r2:.3f}")
    logger.info(f"Test RMSE: {test_rmse:.2f}")
    
    # Check against reference performance
    if crop.upper() == 'RICE':
        if test_mae < 400 and test_r2 > 0.65:
            logger.info("✅ Performance meets reference targets (MAE < 400, R² > 0.65)")
        else:
            logger.warning("⚠️ Performance below reference targets. Consider feature engineering.")
    
    return pipeline, metrics


def predict_yield(
    pipeline: Pipeline,
    feature_cols: List[str],
    climate_row: pd.Series,
    return_uncertainty: bool = True
) -> Tuple[float, Optional[float]]:
    """
    Predict crop yield using trained model.
    
    Args:
        pipeline: Trained scikit-learn pipeline
        feature_cols: List of feature column names
        climate_row: Series with climate features
        return_uncertainty: Whether to return uncertainty estimate
        
    Returns:
        Predicted yield and uncertainty (std across trees)
        
    Notes:
        - Uses RandomForest for uncertainty proxy
        - Returns (yield_prediction, uncertainty_estimate)
        - Uncertainty is std across all trees in forest
    """
    # Prepare features
    X = climate_row[feature_cols].values.reshape(1, -1)
    
    # Make prediction
    y_pred = pipeline.predict(X)[0]
    
    if return_uncertainty and hasattr(pipeline.named_steps['regressor'], 'estimators_'):
        # Calculate uncertainty as std across trees
        predictions = []
        for estimator in pipeline.named_steps['regressor'].estimators_:
            # Create temporary pipeline with single estimator
            temp_pipeline = Pipeline([
                ('imputer', pipeline.named_steps['imputer']),
                ('regressor', estimator)
            ])
            pred = temp_pipeline.predict(X)[0]
            predictions.append(pred)
        
        uncertainty = np.std(predictions)
        return y_pred, uncertainty
    else:
        return y_pred, None


def load_trained_model(crop: str, model_dir: str = "artifacts") -> Tuple[Pipeline, List[str], Dict[str, Any]]:
    """
    Load a trained model and its metadata.
    
    Args:
        crop: Crop name (e.g., 'RICE', 'WHEAT')
        model_dir: Directory containing model artifacts
        
    Returns:
        Trained pipeline, feature columns, and metadata
    """
    model_path = Path(model_dir) / f"rf_model_{crop.lower()}.joblib"
    features_path = Path(model_dir) / f"{crop.lower()}_features.json"
    metrics_path = Path(model_dir) / f"{crop.lower()}_metrics.json"
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    
    # Load model
    pipeline = joblib.load(model_path)
    
    # Load features
    with open(features_path, 'r') as f:
        features_data = json.load(f)
    feature_cols = features_data['feature_columns']
    
    # Load metrics
    with open(metrics_path, 'r') as f:
        metrics = json.load(f)
    
    logger.info(f"Loaded model for {crop} with {len(feature_cols)} features")
    logger.info(f"Model performance: MAE={metrics['test_metrics']['mae']:.2f}, R²={metrics['test_metrics']['r2']:.3f}")
    
    return pipeline, feature_cols, metrics


def evaluate_model_performance(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    feature_cols: List[str]
) -> Dict[str, float]:
    """
    Evaluate model performance on test data.
    
    Args:
        pipeline: Trained pipeline
        X_test: Test features
        y_test: Test targets
        feature_cols: Feature column names
        
    Returns:
        Dictionary of performance metrics
    """
    # Prepare test data
    X_test_features = X_test[feature_cols]
    
    # Make predictions
    y_pred = pipeline.predict(X_test_features)
    
    # Calculate metrics
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    
    # Calculate additional metrics
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
    
    metrics = {
        'mae': float(mae),
        'r2': float(r2),
        'rmse': float(rmse),
        'mape': float(mape),
        'n_samples': len(y_test)
    }
    
    logger.info("Model Performance:")
    for metric, value in metrics.items():
        if metric != 'n_samples':
            logger.info(f"  {metric.upper()}: {value:.4f}")
        else:
            logger.info(f"  {metric}: {value}")
    
    return metrics


def create_prediction_report(
    predictions: List[float],
    uncertainties: List[float],
    actual_values: Optional[List[float]] = None
) -> pd.DataFrame:
    """
    Create a comprehensive prediction report.
    
    Args:
        predictions: List of predicted yields
        uncertainties: List of uncertainty estimates
        actual_values: Optional list of actual values for comparison
        
    Returns:
        DataFrame with prediction report
    """
    report_data = {
        'predicted_yield': predictions,
        'uncertainty': uncertainties
    }
    
    if actual_values:
        report_data['actual_yield'] = actual_values
        report_data['error'] = [pred - actual for pred, actual in zip(predictions, actual_values)]
        report_data['error_pct'] = [abs(err) / actual * 100 for err, actual in zip(report_data['error'], actual_values)]
    
    report_df = pd.DataFrame(report_data)
    
    # Add summary statistics
    summary_stats = {
        'mean_prediction': report_df['predicted_yield'].mean(),
        'mean_uncertainty': report_df['uncertainty'].mean(),
        'prediction_range': (report_df['predicted_yield'].min(), report_df['predicted_yield'].max()),
        'uncertainty_range': (report_df['uncertainty'].min(), report_df['uncertainty'].max())
    }
    
    if actual_values:
        summary_stats.update({
            'mean_error': report_df['error'].mean(),
            'mean_error_pct': report_df['error_pct'].mean(),
            'mae': report_df['error'].abs().mean()
        })
    
    logger.info("Prediction Summary:")
    for stat, value in summary_stats.items():
        logger.info(f"  {stat}: {value}")
    
    return report_df
