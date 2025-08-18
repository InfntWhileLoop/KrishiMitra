# Seed Variety Recommender - FastAPI Backend

This FastAPI backend provides a RESTful API for the Seed Variety Recommender system, allowing you to get seed variety recommendations based on local conditions and optionally incorporate yield predictions.

## Features

- **Variety Recommendations**: Get top-k seed variety recommendations based on soil conditions, climate, and risk factors
- **Hybrid Scoring**: Optionally combine suitability scores with ML yield predictions
- **Traits Validation**: Validate variety traits CSV files for schema compliance
- **Model Management**: Check which yield models are available for hybrid scoring
- **Configurable Scoring**: Adjust scoring weights and parameters via environment variables
- **CORS Support**: Cross-origin resource sharing enabled for frontend integration

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements_fastapi.txt
```

### 2. Configure Environment

Copy `config.env` to `.env` and adjust settings:

```bash
cp config.env .env
```

Key configuration options:
- `TRAITS_PATH`: Path to variety traits CSV file
- `ARTIFACTS_DIR`: Directory containing yield model artifacts
- `ALLOW_ORIGINS`: CORS origins (comma-separated)
- Scoring weights and parameters

### 3. Run the Server

```bash
python app.py
```

Or with uvicorn directly:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### 1. Get Variety Recommendations

**POST** `/api/seed/recommend`

Get seed variety recommendations based on local conditions.

**Request Body:**
```json
{
  "crop": "WHEAT",
  "soil_ph": 7.0,
  "soil_texture": "loam",
  "season_len_days": 150,
  "zone_code": "N1",
  "risk_flags": {
    "heat_risk": true,
    "flood_risk": false,
    "drought_risk": true
  },
  "top_k": 5,
  "use_hybrid": false
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "crop": "WHEAT",
      "variety": "WHEAT_001",
      "final_score": 0.85,
      "suitability": 0.85,
      "yhat": null,
      "y_std": null,
      "ph_score": 0.9,
      "texture_score": 1.0,
      "maturity_score": 0.8,
      "zone_score": 1.0,
      "heat_adj": 1.05,
      "flood_adj": 0.95,
      "drought_adj": 1.05,
      "reasons": "Good pH match, suitable texture, appropriate maturity"
    }
  ],
  "used_yield": false,
  "total_varieties": 3,
  "message": "Found 1 recommendations for WHEAT"
}
```

### 2. Validate Traits File

**POST** `/api/seed/traits/validate`

Validate a variety traits CSV file for schema compliance.

**Request Body (Form Data):**
- `file`: Uploaded CSV file (optional)
- `file_path`: Path to CSV file (optional)

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Some warnings"],
  "total_varieties": 3,
  "message": "Traits file is valid with 3 varieties"
}
```

### 3. Get Available Models

**GET** `/api/seed/models/available`

Get list of crops with available yield models for hybrid scoring.

**Response:**
```json
{
  "available_crops": ["WHEAT", "RICE", "MAIZE"],
  "total_models": 3,
  "message": "Found 3 yield models"
}
```

### 4. Health Check

**GET** `/health`

Check API health status.

**Response:**
```json
{
  "status": "healthy"
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TRAITS_PATH` | `data/variety_traits.csv` | Path to variety traits CSV file |
| `ARTIFACTS_DIR` | `artifacts` | Directory containing yield model artifacts |
| `ALLOW_ORIGINS` | `*` | CORS origins (comma-separated) |

### Scoring Weights

| Variable | Default | Description |
|----------|---------|-------------|
| `SCORE_WEIGHT_PH` | `0.35` | Weight for pH scoring (0-1) |
| `SCORE_WEIGHT_TEXTURE` | `0.25` | Weight for texture scoring (0-1) |
| `SCORE_WEIGHT_MATURITY` | `0.25` | Weight for maturity scoring (0-1) |
| `SCORE_WEIGHT_ZONE` | `0.15` | Weight for zone scoring (0-1) |

**Note**: Weights must sum to 1.0

### Scoring Parameters

| Variable | Default | Description |
|----------|---------|-------------|
| `PH_TOLERANCE` | `0.5` | pH tolerance for scoring falloff |
| `MATURITY_TOLERANCE` | `60` | Maturity tolerance in days |
| `ZONE_PENALTY` | `0.5` | Penalty for zone mismatch |

### Hybrid Scoring Weights

| Variable | Default | Description |
|----------|---------|-------------|
| `HYBRID_YIELD_WEIGHT` | `0.6` | Weight for yield prediction (0-1) |
| `HYBRID_SUITABILITY_WEIGHT` | `0.4` | Weight for suitability score (0-1) |

## Data Requirements

### Variety Traits CSV Schema

The traits file must contain these columns:

| Column | Type | Description |
|--------|------|-------------|
| `crop` | string | Crop name (e.g., WHEAT, RICE) |
| `variety` | string | Variety name |
| `pH_min` | float | Minimum soil pH |
| `pH_max` | float | Maximum soil pH |
| `textures_allowed` | string | Comma-separated allowed textures |
| `maturity_days` | int | Days to maturity |
| `zone_codes` | string | Pipe-separated zone codes |
| `heat_tol` | int | Heat tolerance (0/1) |
| `flood_tol` | int | Flood tolerance (0/1) |
| `drought_tol` | int | Drought tolerance (0/1) |
| `notes` | string | Additional notes |

### Yield Model Artifacts

For hybrid scoring, place these files in the artifacts directory:

- `rf_model_<CROP>.joblib` - Trained RandomForest model
- `<CROP>_features.json` - Feature column definitions
- `<CROP>_metrics.json` - Model performance metrics

## Development

### Project Structure

```
├── app.py                 # Main FastAPI application
├── routers/               # API route definitions
│   └── seedrec.py        # Seed recommendation endpoints
├── services/              # Business logic services
│   ├── traits_service.py  # Traits data management
│   ├── seedrec_service.py # Recommendation logic
│   └── yield_infer.py     # Yield model inference
├── tests/                 # Test files
│   └── test_fastapi.py    # FastAPI endpoint tests
├── config.env             # Configuration template
└── requirements_fastapi.txt # FastAPI dependencies
```

### Running Tests

```bash
# Install test dependencies
pip install pytest fastapi[testing]

# Run tests
pytest tests/test_fastapi.py -v
```

### Code Quality

- **Type Hints**: Full type annotations throughout
- **Docstrings**: Comprehensive documentation
- **Error Handling**: Proper HTTP status codes and error messages
- **Validation**: Pydantic models for request/response validation
- **Testing**: Unit tests with mocking for external dependencies

## Integration Examples

### Frontend Integration

```javascript
// Get recommendations
const response = await fetch('/api/seed/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    crop: 'WHEAT',
    soil_ph: 7.0,
    soil_texture: 'loam',
    season_len_days: 150,
    zone_code: 'N1',
    risk_flags: { heat_risk: true },
    top_k: 5,
    use_hybrid: false
  })
});

const data = await response.json();
console.log(data.recommendations);
```

### Python Client

```python
import requests

# Get recommendations
response = requests.post('http://localhost:8000/api/seed/recommend', json={
    'crop': 'WHEAT',
    'soil_ph': 7.0,
    'soil_texture': 'loam',
    'season_len_days': 150,
    'zone_code': 'N1',
    'risk_flags': {'heat_risk': True},
    'top_k': 5,
    'use_hybrid': False
})

recommendations = response.json()['recommendations']
```

## Troubleshooting

### Common Issues

1. **Traits file not found**: Check `TRAITS_PATH` environment variable
2. **Model loading failed**: Verify artifacts directory and file permissions
3. **CORS errors**: Configure `ALLOW_ORIGINS` for your frontend domain
4. **Validation errors**: Check CSV schema and data types

### Debug Mode

Enable debug logging by setting the log level:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Health Checks

Use the `/health` endpoint to verify API status:

```bash
curl http://localhost:8000/health
```

## Performance Considerations

- **Caching**: Traits data is cached with LRU cache
- **Lazy Loading**: Yield models are loaded only when needed
- **Async Endpoints**: Non-blocking I/O for better concurrency
- **Validation**: Request validation happens before processing

## Security

- **Input Validation**: All inputs are validated via Pydantic
- **CORS Configuration**: Configurable cross-origin access
- **Error Handling**: No sensitive information in error messages
- **Rate Limiting**: Consider adding rate limiting for production

## Production Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements_fastapi.txt .
RUN pip install -r requirements_fastapi.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

Set production environment variables:

```bash
export TRAITS_PATH=/data/variety_traits.csv
export ARTIFACTS_DIR=/data/artifacts
export ALLOW_ORIGINS=https://yourdomain.com
```

### Reverse Proxy

Use nginx or similar for production:

```nginx
location /api/ {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Support

For issues and questions:
1. Check the test files for usage examples
2. Review the API documentation at `/docs`
3. Check environment variable configuration
4. Verify data file formats and paths
