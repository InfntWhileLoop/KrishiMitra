#!/usr/bin/env python3
"""Command-line interface for seed variety recommender."""

import click
import logging
import json
import pandas as pd
from pathlib import Path
from typing import Optional, Dict, Any

# Add src to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

try:
    from seedrec.traits import load_traits, validate_traits
    from seedrec.recommend import recommend_varieties, save_recommendations
except ImportError:
    # Fallback for direct execution
    sys.path.insert(0, str(Path(__file__).parent.parent))
<<<<<<< HEAD
    from src.seedrec.traits import load_traits, validate_traits
    from src.seedrec.recommend import recommend_varieties, save_recommendations
=======
    from app.src.seedrec.traits import load_traits, validate_traits
    from app.src.seedrec.recommend import recommend_varieties, save_recommendations
>>>>>>> a4a1021 (Initial commit with changes)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@click.group()
def cli():
    """Seed Variety Recommender - Intelligent variety selection based on local conditions."""
    pass


@cli.command()
@click.option('--traits-file', required=True, help='Path to variety traits CSV file')
def validate(traits_file):
    """Validate variety traits file against schema."""
    try:
        logger.info(f"Validating traits file: {traits_file}")
        
        # Load traits
        traits_df = load_traits(traits_file)
        
        # Validate
        is_valid, errors = validate_traits(traits_df)
        
        if is_valid:
            click.echo("✅ Traits validation passed!")
            click.echo(f"📊 Found {len(traits_df)} variety records")
            
            # Show crop summary
            crop_counts = traits_df['crop'].value_counts()
            click.echo("\nCrop distribution:")
            for crop, count in crop_counts.items():
                click.echo(f"  {crop}: {count} varieties")
                
        else:
            click.echo("❌ Traits validation failed!")
            click.echo(f"Found {len(errors)} errors:")
            for error in errors:
                click.echo(f"  {error}")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Validation failed: {str(e)}")
        raise click.ClickException(str(e))


@cli.command()
@click.option('--traits-file', required=True, help='Path to variety traits CSV file')
@click.option('--crop', required=True, help='Crop name (e.g., RICE, WHEAT)')
@click.option('--soil-ph', required=True, type=float, help='Soil pH value')
@click.option('--texture', required=True, help='Soil texture (e.g., clay, loam)')
@click.option('--season-len', required=True, type=int, help='Growing season length in days')
@click.option('--zone', required=True, help='Zone code (e.g., E1, N2)')
@click.option('--top-k', default=5, type=int, help='Number of top recommendations')
@click.option('--heat-risk', is_flag=True, help='Flag for heat risk conditions')
@click.option('--flood-risk', is_flag=True, help='Flag for flood risk conditions')
@click.option('--drought-risk', is_flag=True, help='Flag for drought risk conditions')
@click.option('--weights', help='JSON string for custom scoring weights')
@click.option('--tolerances', help='JSON string for custom tolerance parameters')
@click.option('--out', help='Output JSON file path')
def recommend(traits_file, crop, soil_ph, texture, season_len, zone, top_k,
             heat_risk, flood_risk, drought_risk, weights, tolerances, out):
    """Recommend varieties based on suitability scoring only."""
    try:
        logger.info(f"Generating recommendations for {crop}")
        
        # Prepare risk flags
        risk_flags = {
            'heat_risk': heat_risk,
            'flood_risk': flood_risk,
            'drought_risk': drought_risk
        }
        
        # Parse custom weights and tolerances
        custom_weights = None
        if weights:
            try:
                custom_weights = json.loads(weights)
            except json.JSONDecodeError:
                raise click.ClickException("Invalid JSON for weights")
        
        custom_tolerances = None
        if tolerances:
            try:
                custom_tolerances = json.loads(tolerances)
            except json.JSONDecodeError:
                raise click.ClickException("Invalid JSON for tolerances")
        
        # Generate recommendations
        recommendations_df, metadata = recommend_varieties(
            traits_file=traits_file,
            crop=crop,
            soil_pH=soil_ph,
            soil_texture=texture,
            season_len_days=season_len,
            zone_code=zone,
            top_k=top_k,
            risk_flags=risk_flags,
            weights=custom_weights,
            tolerances=custom_tolerances
        )
        
        # Display results
        click.echo(f"\n🌾 Top {top_k} variety recommendations for {crop}:")
        click.echo("=" * 80)
        
        for idx, row in recommendations_df.iterrows():
            rank = idx + 1
            click.echo(f"\n{rank}. {row['variety']} (Score: {row['final_score']:.3f})")
            click.echo(f"   Suitability: {row['suitability']:.3f}")
            click.echo(f"   pH: {row['pH_score']:.3f}, Texture: {row['texture_score']:.3f}")
            click.echo(f"   Maturity: {row['maturity_score']:.3f}, Zone: {row['zone_score']:.3f}")
            click.echo(f"   Risk adjustments: H:{row['heat_adj']:.2f}, F:{row['flood_adj']:.2f}, D:{row['drought_adj']:.2f}")
            click.echo(f"   Reasons: {row['reasons']}")
        
        # Show metadata
        click.echo(f"\n📊 Summary:")
        click.echo(f"  Total varieties evaluated: {metadata['total_varieties']}")
        click.echo(f"  Used yield model: {metadata['used_yield_model']}")
        click.echo(f"  Scoring weights: {metadata['scoring_weights']}")
        
        # Save to file if specified
        if out:
            save_recommendations(recommendations_df, metadata, out)
            click.echo(f"\n💾 Recommendations saved to: {out}")
        
    except Exception as e:
        logger.error(f"Recommendation failed: {str(e)}")
        raise click.ClickException(str(e))


@cli.command()
@click.option('--traits-file', required=True, help='Path to variety traits CSV file')
@click.option('--crop', required=True, help='Crop name (e.g., RICE, WHEAT)')
@click.option('--soil-ph', required=True, type=float, help='Soil pH value')
@click.option('--texture', required=True, help='Soil texture (e.g., clay, loam)')
@click.option('--season-len', required=True, type=int, help='Growing season length in days')
@click.option('--zone', required=True, help='Zone code (e.g., E1, N2)')
@click.option('--top-k', default=5, type=int, help='Number of top recommendations')
@click.option('--heat-risk', is_flag=True, help='Flag for heat risk conditions')
@click.option('--flood-risk', is_flag=True, help='Flag for flood risk conditions')
@click.option('--drought-risk', is_flag=True, help='Flag for drought risk conditions')
@click.option('--yield-model-dir', default='artifacts', help='Directory containing yield models')
@click.option('--climate-row', help='Path to JSON file with climate data for yield prediction')
@click.option('--yield-weight', default=0.6, type=float, help='Weight for yield component in hybrid scoring')
@click.option('--weights', help='JSON string for custom scoring weights')
@click.option('--tolerances', help='JSON string for custom tolerance parameters')
@click.option('--out', help='Output JSON file path')
def recommend_hybrid(traits_file, crop, soil_ph, texture, season_len, zone, top_k,
                     heat_risk, flood_risk, drought_risk, yield_model_dir, climate_row,
                     yield_weight, weights, tolerances, out):
    """Recommend varieties using hybrid scoring (suitability + yield prediction)."""
    try:
        logger.info(f"Generating hybrid recommendations for {crop}")
        
        # Prepare risk flags
        risk_flags = {
            'heat_risk': heat_risk,
            'flood_risk': flood_risk,
            'drought_risk': drought_risk
        }
        
        # Parse custom weights and tolerances
        custom_weights = None
        if weights:
            try:
                custom_weights = json.loads(weights)
            except json.JSONDecodeError:
                raise click.ClickException("Invalid JSON for weights")
        
        custom_tolerances = None
        if tolerances:
            try:
                custom_tolerances = json.loads(tolerances)
            except json.JSONDecodeError:
                raise click.ClickException("Invalid JSON for tolerances")
        
        # Load climate data if provided
        climate_data = None
        if climate_row:
            climate_path = Path(climate_row)
            if not climate_path.exists():
                raise click.ClickException(f"Climate data file not found: {climate_row}")
            
            try:
                with open(climate_path, 'r') as f:
                    climate_data = json.load(f)
                logger.info(f"Loaded climate data from {climate_row}")
            except Exception as e:
                raise click.ClickException(f"Failed to load climate data: {e}")
        
        # Generate recommendations
        recommendations_df, metadata = recommend_varieties(
            traits_file=traits_file,
            crop=crop,
            soil_pH=soil_ph,
            soil_texture=texture,
            season_len_days=season_len,
            zone_code=zone,
            top_k=top_k,
            risk_flags=risk_flags,
            weights=custom_weights,
            tolerances=custom_tolerances,
            yield_model_dir=yield_model_dir,
            climate_row=climate_data,
            yield_weight=yield_weight
        )
        
        # Display results
        click.echo(f"\n🌾 Top {top_k} hybrid variety recommendations for {crop}:")
        click.echo("=" * 80)
        
        for idx, row in recommendations_df.iterrows():
            rank = idx + 1
            click.echo(f"\n{rank}. {row['variety']} (Score: {row['final_score']:.3f})")
            click.echo(f"   Suitability: {row['suitability']:.3f}")
            
            if row['yhat'] is not None:
                click.echo(f"   Predicted yield: {row['yhat']:.1f} kg/ha")
                if row['y_std'] is not None:
                    click.echo(f"   Yield uncertainty: ±{row['y_std']:.1f} kg/ha")
            else:
                click.echo("   Yield prediction: Not available")
            
            click.echo(f"   pH: {row['pH_score']:.3f}, Texture: {row['texture_score']:.3f}")
            click.echo(f"   Maturity: {row['maturity_score']:.3f}, Zone: {row['zone_score']:.3f}")
            click.echo(f"   Risk adjustments: H:{row['heat_adj']:.2f}, F:{row['flood_adj']:.2f}, D:{row['drought_adj']:.2f}")
            click.echo(f"   Reasons: {row['reasons']}")
        
        # Show metadata
        click.echo(f"\n📊 Summary:")
        click.echo(f"  Total varieties evaluated: {metadata['total_varieties']}")
        click.echo(f"  Used yield model: {metadata['used_yield_model']}")
        click.echo(f"  Yield weight: {yield_weight}")
        click.echo(f"  Scoring weights: {metadata['scoring_weights']}")
        
        # Save to file if specified
        if out:
            save_recommendations(recommendations_df, metadata, out)
            click.echo(f"\n💾 Recommendations saved to: {out}")
        
    except Exception as e:
        logger.error(f"Hybrid recommendation failed: {str(e)}")
        raise click.ClickException(str(e))


@cli.command()
@click.option('--traits-file', required=True, help='Path to variety traits CSV file')
def explore(traits_file):
    """Explore variety traits data structure."""
    try:
        logger.info(f"Exploring traits file: {traits_file}")
        
        # Load traits
        traits_df = load_traits(traits_file)
        
        click.echo(f"📊 Traits file overview:")
        click.echo(f"  Total records: {len(traits_df)}")
        click.echo(f"  Columns: {len(traits_df.columns)}")
        click.echo(f"  Crops: {traits_df['crop'].nunique()}")
        click.echo(f"  Varieties per crop:")
        
        crop_counts = traits_df['crop'].value_counts()
        for crop, count in crop_counts.items():
            click.echo(f"    {crop}: {count}")
        
        click.echo(f"\n📋 Column information:")
        for col in traits_df.columns:
            dtype = str(traits_df[col].dtype)
            non_null = traits_df[col].count()
            null_pct = (traits_df[col].isna().sum() / len(traits_df)) * 100
            
            click.echo(f"  {col:<20} | {dtype:<10} | {non_null:>6} | {null_pct:>5.1f}%")
        
        # Show sample data
        click.echo(f"\n🔍 Sample data (first 3 rows):")
        click.echo("-" * 80)
        click.echo(traits_df.head(3).to_string())
        
    except Exception as e:
        logger.error(f"Exploration failed: {str(e)}")
        raise click.ClickException(str(e))


@cli.command()
@click.option('--traits-file', required=True, help='Path to variety traits CSV file')
@click.option('--crop', required=True, help='Crop name to analyze')
def analyze_crop(traits_file, crop):
    """Analyze traits for a specific crop."""
    try:
        logger.info(f"Analyzing traits for crop: {crop}")
        
        # Load traits
        traits_df = load_traits(traits_file)
        
        # Filter for crop
        crop_df = traits_df[traits_df['crop'].str.upper() == crop.upper()].copy()
        
        if crop_df.empty:
            click.echo(f"No varieties found for crop: {crop}")
            return
        
        click.echo(f"🌾 {crop} variety analysis:")
        click.echo(f"  Total varieties: {len(crop_df)}")
        
        # pH range analysis
        ph_min = crop_df['pH_min'].min()
        ph_max = crop_df['pH_max'].max()
        click.echo(f"  pH range: {ph_min:.1f} - {ph_max:.1f}")
        
        # Maturity analysis
        maturity_min = crop_df['maturity_days'].min()
        maturity_max = crop_df['maturity_days'].max()
        maturity_mean = crop_df['maturity_days'].mean()
        click.echo(f"  Maturity range: {maturity_min} - {maturity_max} days (avg: {maturity_mean:.1f})")
        
        # Tolerance analysis
        heat_tolerant = (crop_df['heat_tol'] == 1).sum()
        flood_tolerant = (crop_df['flood_tol'] == 1).sum()
        drought_tolerant = (crop_df['drought_tol'] == 1).sum()
        
        click.echo(f"  Heat tolerant: {heat_tolerant}/{len(crop_df)}")
        click.echo(f"  Flood tolerant: {flood_tolerant}/{len(crop_df)}")
        click.echo(f"  Drought tolerant: {drought_tolerant}/{len(crop_df)}")
        
        # Zone analysis
        zones = set()
        for zone_str in crop_df['zone_codes'].dropna():
            if str(zone_str).strip():
                zones.update(zone_str.split('|'))
        click.echo(f"  Zone codes: {', '.join(sorted(zones))}")
        
        # Show all varieties
        click.echo(f"\n📋 All {crop} varieties:")
        click.echo("-" * 80)
        for idx, row in crop_df.iterrows():
            click.echo(f"{idx+1:2d}. {row['variety']:<20} | pH: {row['pH_min']:.1f}-{row['pH_max']:.1f} | "
                      f"Maturity: {row['maturity_days']:3d} days | "
                      f"Tolerances: H:{row['heat_tol']} F:{row['flood_tol']} D:{row['drought_tol']}")
            if pd.notna(row['notes']):
                click.echo(f"     Notes: {row['notes']}")
        
    except Exception as e:
        logger.error(f"Crop analysis failed: {str(e)}")
        raise click.ClickException(str(e))


if __name__ == '__main__':
    cli()
