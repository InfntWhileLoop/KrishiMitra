# =============================================================================
# Features Directory - ML-Ready Feature Tables
# =============================================================================
# This directory contains the processed, ML-ready feature tables that are
# used for training machine learning models. All features here have been
# engineered from raw data through the feature engineering pipeline.
#
# Feature Categories:
# 1. Weather Features: Temperature, humidity, rainfall, wind patterns
# 2. Climatology Features: Day-of-year normals and anomalies
# 3. Rolling Features: Moving averages and sums over time windows
# 4. Soil Features: pH, nutrients, texture, and sample age
# 5. Trial Fit Features: Variety suitability and performance indicators
# 6. Meta Features: Geographic and administrative information
#
# Data Quality:
# - All features have been validated and cleaned
# - Missing values are handled appropriately
# - Features are normalized and scaled where needed
# - Data types are optimized for ML algorithms
#
# Usage: These feature tables are loaded directly by ML training scripts
# and should not be modified manually. Re-run the feature engineering
# pipeline to update features.
# =============================================================================

## Feature Tables

### Main Feature Table (`field_daily.parquet`)
The primary feature table containing all engineered features for each field-date combination.

**Key Columns:**
- `field_id`: Unique identifier for each field
- `date`: Date of features (YYYY-MM-DD)

**Weather Features:**
- `tmax`, `tmin`: Daily temperature extremes (°C)
- `rh`: Relative humidity (%)
- `rain_mm`: Daily rainfall (mm)
- `wind`: Wind speed (m/s)

**Climatology Features:**
- `tmax_anom_3`, `tmax_anom_7`: 3-day and 7-day temperature anomalies
- `tmin_anom_3`, `tmin_anom_7`: 3-day and 7-day minimum temperature anomalies
- `rh_mean_3`: 3-day average relative humidity
- `rain_sum_3`, `rain_sum_7`: 3-day and 7-day rainfall totals
- `vpd_proxy_1`, `vpd_proxy_3`: Vapor pressure deficit proxies (1-day and 3-day)

**Soil Features:**
- `soil_ph`: Soil pH level (3.5-9.5)
- `soil_ec`: Electrical conductivity (dS/m)
- `soil_texture_bin`: Soil texture classification
- `soil_sample_age_days`: Days since last soil sample

**Trial Fit Features:**
- `district_trial_uplift_mean`: Average yield uplift for district-crop combination
- `maturity_match_days`: Days difference from expected maturity
- `ph_distance_to_range`: Distance of soil pH from optimal range

**Meta Features:**
- `district`: Administrative district
- `zone`: Agricultural zone/climate region

## Feature Engineering Pipeline

### Data Flow
```
Raw Data → Climatology → Rolling Features → Joins → Quality Checks → Features
```

### Processing Steps
1. **Climatology Computation**
   - Calculate day-of-year normals per district
   - Compute temperature, humidity, and rainfall anomalies
   - Handle missing data with fallback strategies

2. **Rolling Feature Computation**
   - 3-day and 7-day moving averages for temperature anomalies
   - Rolling sums for rainfall accumulation
   - VPD proxy calculation from temperature and humidity

3. **Data Joins**
   - Attach soil data (most recent sample per field)
   - Join trial performance data by district and crop
   - Add geographic and administrative metadata

4. **Quality Assurance**
   - Schema validation and type enforcement
   - Range checks for physical constraints
   - Missingness analysis and reporting
   - Freshness validation for time-sensitive data

## Feature Schema

### Data Types
- **String**: field_id, district, zone, soil_texture_bin
- **Integer**: soil_sample_age_days, maturity_match_days
- **Float**: All weather, soil, and derived features
- **Date**: date field

### Constraints
- **field_id**: Required, unique identifier
- **date**: Required, valid ISO date
- **Weather features**: May have missing values (sensor failures)
- **Soil features**: May be null for fields without recent samples
- **Trial features**: May be null for new district-crop combinations

### Validation Rules
- Temperature: tmax > tmin for each day
- pH: 3.5 ≤ soil_ph ≤ 9.5
- Anomalies: Within ±20°C of normal values
- Rainfall: Non-negative values
- Humidity: 0% ≤ rh ≤ 100%

## Usage Examples

### Loading Features
```python
import pandas as pd

# Load the main feature table
features_df = pd.read_parquet("data/features/field_daily.parquet")

# Filter by date range
recent_features = features_df[features_df['date'] >= '2024-01-01']

# Filter by field
field_features = features_df[features_df['field_id'] == 'FIELD7']

# Check feature availability
print(f"Total records: {len(features_df)}")
print(f"Fields: {features_df['field_id'].nunique()}")
print(f"Date range: {features_df['date'].min()} to {features_df['date'].max()}")
```

### Feature Selection
```python
# Weather features
weather_cols = ['tmax', 'tmin', 'rh', 'rain_mm', 'wind']

# Anomaly features
anomaly_cols = [col for col in features_df.columns if 'anom' in col]

# Soil features
soil_cols = [col for col in features_df.columns if col.startswith('soil_')]

# All numeric features for ML
numeric_cols = features_df.select_dtypes(include=['float64', 'int64']).columns
```

### Data Quality Checks
```python
# Check missing values
missing_summary = features_df.isnull().sum()
print("Missing values per column:")
print(missing_summary[missing_summary > 0])

# Check data ranges
print(f"Temperature range: {features_df['tmax'].min():.1f}°C to {features_df['tmax'].max():.1f}°C")
print(f"pH range: {features_df['soil_ph'].min():.1f} to {features_df['soil_ph'].max():.1f}")

# Check for outliers
anomaly_cols = [col for col in features_df.columns if 'anom' in col]
for col in anomaly_cols:
    q99 = features_df[col].quantile(0.99)
    q01 = features_df[col].quantile(0.01)
    print(f"{col}: {q01:.2f} to {q99:.2f}")
```

## Performance Considerations

### File Size
- Parquet format for efficient storage and fast loading
- Columnar compression for numerical features
- Partitioned by district for large datasets

### Loading Speed
- Use pandas with pyarrow backend for fastest loading
- Consider loading only required columns for large tables
- Use chunked loading for very large datasets

### Memory Usage
- Features table can be large (GB+ for full dataset)
- Consider downsampling for development and testing
- Use data types that minimize memory footprint

## Maintenance and Updates

### Feature Refresh
- Weather features: Daily updates
- Soil features: When new samples available
- Trial features: Per growing season
- Climatology: Annual recalculation

### Version Control
- Feature tables are versioned by processing date
- Changes tracked in feature lineage logs
- Backward compatibility maintained where possible

### Monitoring
- Data quality metrics tracked over time
- Feature drift detection for ML models
- Performance monitoring for feature computation

## Troubleshooting

### Common Issues
1. **Missing Features**: Check if raw data is available and up-to-date
2. **Data Type Errors**: Verify schema compliance in raw data
3. **Performance Issues**: Check file size and consider partitioning
4. **Quality Issues**: Review validation logs and raw data quality

### Debugging
- Check feature engineering logs for processing errors
- Validate raw data quality and completeness
- Review feature computation logic for edge cases
- Monitor memory usage during feature loading

