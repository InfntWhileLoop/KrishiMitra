"""Command-line interface for crop yield prediction."""

import click
import logging
import pandas as pd
from pathlib import Path
from typing import Optional

from .data_loader import load_icrisat, load_climate, create_variety_traits_template
from .features import build_training_table, add_seasonal_features, create_feature_summary
from .models import train_yield_model, predict_yield, load_trained_model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@click.group()
def cli():
    """Crop Yield Predictor - ML system for agricultural yield prediction."""
    pass


@cli.command()
@click.option('--icrisat-file', required=True, help='Path to ICRISAT CSV file')
@click.option('--climate-file', required=True, help='Path to climate CSV file')
@click.option('--crop', help='Specific crop to train (e.g., RICE, WHEAT)')
@click.option('--output-dir', default='artifacts', help='Output directory for artifacts')
@click.option('--add-seasonal', is_flag=True, help='Add seasonal climate features')
@click.option('--test-size', default=0.2, help='Fraction of data for testing')
def train_model(icrisat_file, climate_file, crop, output_dir, add_seasonal, test_size):
    """Train a crop yield prediction model."""
    try:
        logger.info("Starting model training pipeline...")
        
        # Load data
        logger.info("Loading ICRISAT data...")
        yield_df = load_icrisat(icrisat_file)
        
        logger.info("Loading climate data...")
        climate_df = load_climate(climate_file)
        
        # Build training table
        logger.info("Building training table...")
        training_data = build_training_table(yield_df, climate_df, crop)
        
        # Add seasonal features if requested
        if add_seasonal:
            logger.info("Adding seasonal features...")
            training_data = add_seasonal_features(training_data)
        
        # Create feature summary
        feature_summary = create_feature_summary(training_data)
        logger.info(f"Feature summary: {feature_summary['total_features']} features, {feature_summary['total_records']} records")
        
        # Train model for each crop if not specified
        if crop:
            crops_to_train = [crop]
        else:
            crops_to_train = training_data['crop'].unique().tolist()
        
        for crop_name in crops_to_train:
            logger.info(f"Training model for {crop_name}...")
            
            # Filter data for this crop
            crop_data = training_data[training_data['crop'] == crop_name].copy()
            
            if len(crop_data) < 100:
                logger.warning(f"Insufficient data for {crop_name}: {len(crop_data)} samples. Skipping.")
                continue
            
            # Train model
            pipeline, metrics = train_yield_model(
                crop_data, 
                crop_name, 
                output_dir, 
                test_size=test_size
            )
            
            logger.info(f"✅ Training completed for {crop_name}")
            logger.info(f"   Test MAE: {metrics['test_metrics']['mae']:.2f}")
            logger.info(f"   Test R²: {metrics['test_metrics']['r2']:.3f}")
        
        logger.info("🎉 All training completed successfully!")
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        raise click.ClickException(str(e))


@cli.command()
@click.option('--model-dir', default='artifacts', help='Directory containing trained models')
@click.option('--crop', required=True, help='Crop name (e.g., RICE, WHEAT)')
@click.option('--climate-data', required=True, help='Path to climate data CSV for prediction')
@click.option('--output', help='Output file for predictions')
def predict_yield_cli(model_dir, crop, climate_data, output):
    """Make yield predictions using a trained model."""
    try:
        logger.info(f"Loading trained model for {crop}...")
        
        # Load model
        pipeline, feature_cols, metrics = load_trained_model(crop, model_dir)
        
        # Load climate data for prediction
        logger.info(f"Loading climate data from {climate_data}...")
        climate_df = pd.read_csv(climate_data)
        
        # Make predictions
        predictions = []
        uncertainties = []
        
        for idx, row in climate_df.iterrows():
            try:
                pred, uncertainty = predict_yield(pipeline, feature_cols, row)
                predictions.append(pred)
                uncertainties.append(uncertainty)
                
                logger.info(f"Row {idx+1}: Predicted yield = {pred:.2f} kg/ha ± {uncertainty:.2f}")
                
            except Exception as e:
                logger.warning(f"Failed to predict for row {idx+1}: {str(e)}")
                predictions.append(None)
                uncertainties.append(None)
        
        # Create results DataFrame
        results_df = pd.DataFrame({
            'row_index': range(len(climate_df)),
            'predicted_yield_kg_ha': predictions,
            'uncertainty': uncertainties
        })
        
        # Add original climate data
        for col in climate_df.columns:
            if col not in results_df.columns:
                results_df[col] = climate_df[col]
        
        # Save results
        if output:
            results_df.to_csv(output, index=False)
            logger.info(f"Predictions saved to {output}")
        else:
            # Display results
            click.echo("\nPrediction Results:")
            click.echo(results_df.to_string(index=False))
        
        # Summary statistics
        valid_predictions = [p for p in predictions if p is not None]
        if valid_predictions:
            click.echo(f"\nSummary:")
            click.echo(f"  Total predictions: {len(predictions)}")
            click.echo(f"  Valid predictions: {len(valid_predictions)}")
            click.echo(f"  Mean predicted yield: {pd.Series(valid_predictions).mean():.2f} kg/ha")
            click.echo(f"  Mean uncertainty: {pd.Series(uncertainties).mean():.2f}")
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise click.ClickException(str(e))


@cli.command()
@click.option('--icrisat-file', required=True, help='Path to ICRISAT CSV file')
@click.option('--climate-file', required=True, help='Path to climate CSV file')
@click.option('--output-dir', default='processed_data', help='Output directory for processed data')
def process_data(icrisat_file, climate_file, output_dir):
    """Process and prepare data for training without training models."""
    try:
        logger.info("Processing data...")
        
        # Load data
        yield_df = load_icrisat(icrisat_file)
        climate_df = load_climate(climate_file)
        
        # Build training table
        training_data = build_training_table(yield_df, climate_df)
        
        # Add seasonal features
        training_data = add_seasonal_features(training_data)
        
        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Save processed data
        training_data.to_csv(output_path / 'training_data.csv', index=False)
        logger.info(f"Saved training data to {output_path / 'training_data.csv'}")
        
        # Save feature summary
        feature_summary = create_feature_summary(training_data)
        import json
        with open(output_path / 'feature_summary.json', 'w') as f:
            json.dump(feature_summary, f, indent=2)
        logger.info(f"Saved feature summary to {output_path / 'feature_summary.json'}")
        
        # Create variety traits template
        create_variety_traits_template()
        
        logger.info("✅ Data processing completed successfully!")
        
    except Exception as e:
        logger.error(f"Data processing failed: {str(e)}")
        raise click.ClickException(str(e))


@cli.command()
@click.option('--model-dir', default='artifacts', help='Directory containing trained models')
def list_models(model_dir):
    """List available trained models."""
    try:
        model_path = Path(model_dir)
        if not model_path.exists():
            click.echo(f"No models directory found at {model_dir}")
            return
        
        # Find model files
        model_files = list(model_path.glob("rf_model_*.joblib"))
        
        if not model_files:
            click.echo("No trained models found.")
            return
        
        click.echo(f"Available models in {model_dir}:")
        click.echo("-" * 50)
        
        for model_file in model_files:
            crop_name = model_file.stem.replace("rf_model_", "").upper()
            
            # Try to load metrics
            metrics_file = model_path / f"{crop_name.lower()}_metrics.json"
            if metrics_file.exists():
                import json
                with open(metrics_file, 'r') as f:
                    metrics = json.load(f)
                
                click.echo(f"🌾 {crop_name}")
                click.echo(f"   Model: {metrics['model_type']}")
                click.echo(f"   Features: {metrics['n_features']}")
                click.echo(f"   Test MAE: {metrics['test_metrics']['mae']:.2f}")
                click.echo(f"   Test R²: {metrics['test_metrics']['r2']:.3f}")
                click.echo(f"   Training date: {metrics['training_date'][:10]}")
                click.echo()
            else:
                click.echo(f"🌾 {crop_name} (metrics not available)")
                click.echo()
        
    except Exception as e:
        logger.error(f"Failed to list models: {str(e)}")
        raise click.ClickException(str(e))


@cli.command()
@click.option('--icrisat-file', required=True, help='Path to ICRISAT CSV file')
def explore_data(icrisat_file):
    """Explore the structure of ICRISAT data."""
    try:
        logger.info(f"Exploring ICRISAT data from {icrisat_file}")
        
        # Load data
        df = pd.read_csv(icrisat_file)
        
        click.echo(f"Data shape: {df.shape}")
        click.echo(f"Columns: {len(df.columns)}")
        click.echo()
        
        # Show column info
        click.echo("Column Information:")
        click.echo("-" * 80)
        for i, col in enumerate(df.columns):
            dtype = str(df[col].dtype)
            non_null = df[col].count()
            null_pct = (df[col].isna().sum() / len(df)) * 100
            
            # Show sample values for object columns
            sample_values = ""
            if df[col].dtype == 'object' and non_null > 0:
                unique_vals = df[col].dropna().unique()[:5]
                sample_values = f" | Sample: {', '.join(str(v) for v in unique_vals)}"
                if len(df[col].dropna().unique()) > 5:
                    sample_values += "..."
            
            click.echo(f"{i+1:2d}. {col:<30} | {dtype:<10} | {non_null:>6} | {null_pct:>5.1f}%{sample_values}")
        
        # Show yield columns
        yield_cols = [col for col in df.columns if col.endswith("YIELD (Kg per ha)")]
        if yield_cols:
            click.echo(f"\nYield columns found: {len(yield_cols)}")
            for col in yield_cols:
                crop_name = col.replace("YIELD (Kg per ha)", "").strip()
                non_null = df[col].count()
                if non_null > 0:
                    mean_yield = df[col].mean()
                    click.echo(f"  {crop_name}: {non_null} records, mean: {mean_yield:.2f} kg/ha")
        
        # Show data preview
        click.echo(f"\nData preview (first 5 rows):")
        click.echo("-" * 80)
        click.echo(df.head().to_string())
        
    except Exception as e:
        logger.error(f"Data exploration failed: {str(e)}")
        raise click.ClickException(str(e))


if __name__ == '__main__':
    cli()
