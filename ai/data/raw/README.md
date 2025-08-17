# =============================================================================
# Raw Data Directory - Source Data for Feature Engineering
# =============================================================================
# This directory contains the raw, unprocessed data sources that feed into
# the feature engineering pipeline. All data here is in its original format
# and should not be modified directly.
#
# Data Sources:
# 1. Weather Data: Daily weather measurements from field sensors
# 2. Soil Data: Soil test results and field characteristics
# 3. Trial Data: Agricultural trial results and variety performance
# 4. Field Data: Field metadata and historical crop information
#
# File Formats:
# - Parquet: Efficient columnar storage for large datasets
# - CSV: Simple tabular data for smaller datasets
# - JSON: Structured metadata and configuration files
#
# Data Quality:
# - Raw data may contain missing values, outliers, and inconsistencies
# - All data cleaning and validation happens in the feature engineering pipeline
# - Original files are preserved for audit and reproducibility
#
# Usage: These files are processed by the feature engineering pipeline
# to create the final feature table used for ML model training.
# =============================================================================

## Data Files

### Weather Data (`weather.parquet`)
Daily weather measurements from field sensors and weather stations.

**Columns:**
- `field_id`: Unique identifier for each field
- `date`: Date of measurement (YYYY-MM-DD)
- `tmax`: Maximum temperature (°C)
- `tmin`: Minimum temperature (°C)
- `rh`: Relative humidity (%)
- `rain_mm`: Rainfall in millimeters
- `wind`: Wind speed (m/s)

**Data Source:** Field sensors, weather stations, meteorological services
**Update Frequency:** Daily
**Data Quality:** May contain sensor failures, missing readings

### Soil Data (`soil_cards.csv`)
Soil test results and field characteristics from laboratory analysis.

**Columns:**
- `field_id`: Unique identifier for each field
- `sample_date`: Date when soil sample was collected
- `ph`: Soil pH level (3.5-9.5)
- `ec`: Electrical conductivity (dS/m)
- `n`: Nitrogen content (kg/ha)
- `p`: Phosphorus content (kg/ha)
- `k`: Potassium content (kg/ha)
- `texture_bin`: Soil texture classification

**Data Source:** Soil testing laboratories, field surveys
**Update Frequency:** Annually or per crop cycle
**Data Quality:** Laboratory standards, may have detection limits

### Trial Data (`trials.csv`)
Agricultural trial results and variety performance data.

**Columns:**
- `variety_id`: Unique identifier for seed variety
- `crop`: Crop type (wheat, paddy, cotton, etc.)
- `zone`: Agricultural zone/climate region
- `district`: Administrative district
- `season`: Growing season (kharif, rabi, zaid)
- `yield_uplift_pct`: Yield improvement over control (%)
- `maturity_days`: Days to maturity
- `ph_min`: Minimum soil pH tolerance
- `ph_max`: Maximum soil pH tolerance

**Data Source:** Agricultural research stations, field trials
**Update Frequency:** Per growing season
**Data Quality:** Controlled experiments, statistical significance

### Field Data (`fields.csv`)
Field metadata and historical crop information.

**Columns:**
- `field_id`: Unique identifier for each field
- `farmer_id`: Farmer identifier (anonymized)
- `lat`: Latitude coordinate
- `lon`: Longitude coordinate
- `district`: Administrative district
- `zone`: Agricultural zone/climate region
- `crop_history_json`: JSON array of previous crops and dates

**Data Source:** Field surveys, farmer records, GPS mapping
**Update Frequency:** Annually or when field boundaries change
**Data Quality:** Survey data, may have GPS accuracy issues

## Data Dictionary

### Field ID Format
Field IDs follow the pattern: `FIELD{number}` (e.g., `FIELD7`, `FIELD23`)

### Date Format
All dates are in ISO format: `YYYY-MM-DD`

### Coordinate System
Latitude and longitude are in WGS84 decimal degrees

### Crop Codes
Standard crop names: wheat, paddy, cotton, rice, maize, sugarcane

### Zone Classification
- North Zone: Punjab, Haryana, Uttar Pradesh
- South Zone: Karnataka, Tamil Nadu, Andhra Pradesh
- East Zone: Bihar, West Bengal, Odisha
- West Zone: Gujarat, Maharashtra, Rajasthan

## Data Access

### Reading Data
```python
import pandas as pd

# Read weather data
weather_df = pd.read_parquet("data/raw/weather.parquet")

# Read soil data
soil_df = pd.read_csv("data/raw/soil_cards.csv")

# Read trial data
trials_df = pd.read_csv("data/raw/trials.csv")

# Read field data
fields_df = pd.read_csv("data/raw/fields.csv")
```

### Data Validation
Before processing, validate:
- Required columns are present
- Data types are correct
- Date ranges are reasonable
- Coordinate values are valid
- No duplicate field IDs

## Data Lineage

### Source Systems
- Weather stations and sensors
- Soil testing laboratories
- Agricultural research institutions
- Field surveys and farmer records

### Processing Pipeline
Raw Data → Feature Engineering → ML Features → Model Training

### Version Control
- Raw data files are versioned by date
- Changes are tracked in data lineage logs
- Data quality metrics are monitored over time

## Maintenance

### Regular Tasks
- Monitor data freshness and completeness
- Validate data quality metrics
- Update data dictionaries and schemas
- Archive old data versions
- Document data source changes

### Data Governance
- Access controls for sensitive farmer information
- Data retention policies
- Quality assurance procedures
- Change management processes

