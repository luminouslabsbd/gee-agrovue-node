# Crop Analysis API Documentation

## Overview

The Crop Analysis API provides comprehensive crop growth tracking, analytics, prediction, and visualization capabilities using Google Earth Engine and Sentinel-2 satellite imagery. This API enables precision agriculture applications with advanced crop monitoring and yield forecasting.

## Table of Contents

1. [API Endpoints](#api-endpoints)
2. [Crop Growth Tracking](#crop-growth-tracking)
3. [Crop Analytics](#crop-analytics)
4. [Crop Predictions](#crop-predictions)
5. [Crop Charts](#crop-charts)
6. [Supported Crop Types](#supported-crop-types)
7. [cURL Examples](#curl-examples)
8. [Response Examples](#response-examples)

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/crop-analysis
```

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/track-growth` | POST | Track crop growth stages and phenology |
| `/classify-crop` | POST | Classify crop type based on NDVI patterns |
| `/performance` | POST | Analyze crop performance with yield estimation |
| `/estimate-yield` | POST | Estimate crop yield based on NDVI |
| `/detect-stress` | POST | Detect crop stress events |
| `/predict-yield` | POST | Predict final crop yield with forecasting |
| `/forecast-growth` | POST | Forecast future crop growth trajectory |
| `/crop-chart` | POST | Generate comprehensive crop chart |

---

## Crop Growth Tracking

### 1. Track Crop Growth

**Endpoint:** `POST /api/crop-analysis/track-growth`

**Description:** Track crop growth stages, phenology, and development for a specific crop type.

**Request Body:**
```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [[[lon1, lat1], [lon2, lat2], ...]]
  },
  "fieldId": "string",
  "cropType": "rice|wheat|maize|cotton|soybean",
  "plantingDate": "YYYY-MM-DD",
  "currentDate": "YYYY-MM-DD"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/crop-analysis/track-growth \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[
        [12.633435130119326, 42.6498850799555],
        [12.633585333824158, 42.64952208649428],
        [12.633628249168396, 42.64908806979262],
        [12.633499503135681, 42.64897759233047],
        [12.63356387615204, 42.64877241938018],
        [12.63375699520111, 42.648488332639424],
        [12.633907198905947, 42.64795961219534],
        [12.634164690971376, 42.64786491552187],
        [12.634711861610413, 42.64787280691682],
        [12.635602355003359, 42.64807009146552],
        [12.63606369495392, 42.64803063460584],
        [12.636653780937197, 42.64803063460584],
        [12.63683617115021, 42.64825159269771],
        [12.636954188346865, 42.64829894075813],
        [12.636353373527529, 42.64893024478662],
        [12.63555943965912, 42.64979038621333],
        [12.635216116905214, 42.65020072472159],
        [12.634583115577698, 42.65020072472159],
        [12.63383209705353, 42.65014548700316],
        [12.633435130119326, 42.6498850799555]
      ]]
    },
    "fieldId": "ITALY-RICE-FIELD-01",
    "cropType": "rice",
    "plantingDate": "2024-05-01",
    "currentDate": "2024-10-26"
  }'
```

**Response Structure:**
```json
{
  "success": true,
  "field_id": "ITALY-RICE-FIELD-01",
  "crop_type": "Rice",
  "planting_date": "2024-05-01",
  "current_date": "2024-10-26",
  "days_since_planting": 178,
  "current_stage": {
    "stage": "Maturity",
    "description": "Crop has reached maturity",
    "ndvi_range": { "min": 0.3, "max": 0.9 },
    "days_in_stage": 30,
    "progress_percentage": 85
  },
  "growth_metrics": {
    "peak_ndvi": 0.82,
    "current_ndvi": 0.65,
    "average_ndvi": 0.71,
    "growth_rate": 0.003,
    "health_score": 85,
    "vigor_percentage": 78
  },
  "phenology": {
    "crop_calendar": [...],
    "phenological_events": [...],
    "critical_stages": [...]
  },
  "anomalies": [...],
  "harvest_estimate": {
    "estimated_date": "2024-11-15",
    "days_until_harvest": 20,
    "confidence": "High"
  },
  "ndvi_time_series": [...],
  "metadata": {
    "data_source": "Sentinel-2",
    "temporal_resolution": "10 days",
    "generated_at": "2024-10-26T..."
  }
}
```

### 2. Classify Crop Type

**Endpoint:** `POST /api/crop-analysis/classify-crop`

**Description:** Automatically classify crop type based on NDVI pattern matching.

**Request Body:**
```json
{
  "fieldBoundary": { "type": "Polygon", "coordinates": [...] },
  "fieldId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/crop-analysis/classify-crop \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[...]]
    },
    "fieldId": "ITALY-UNKNOWN-CROP",
    "startDate": "2024-05-01",
    "endDate": "2024-10-26"
  }'
```

---

## Crop Analytics

### 3. Analyze Crop Performance

**Endpoint:** `POST /api/crop-analysis/performance`

**Description:** Comprehensive crop performance analysis with yield estimation and stress detection.

**Request Body:**
```json
{
  "fieldBoundary": { "type": "Polygon", "coordinates": [...] },
  "fieldId": "string",
  "cropType": "rice|wheat|maize|cotton|soybean",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "fieldArea": 5.08
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/crop-analysis/performance \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { "type": "Polygon", "coordinates": [[...]] },
    "fieldId": "ITALY-RICE-FIELD-01",
    "cropType": "rice",
    "startDate": "2024-05-01",
    "endDate": "2024-10-26",
    "fieldArea": 5.08
  }'
```

**Response Structure:**
```json
{
  "success": true,
  "field_id": "ITALY-RICE-FIELD-01",
  "crop_type": "Rice",
  "performance_metrics": {
    "peak_ndvi": 0.82,
    "average_ndvi": 0.71,
    "integrated_ndvi": 125.5,
    "variability": 0.12,
    "vigor_index": 85
  },
  "yield_estimate": {
    "estimated_yield_per_hectare": 6.2,
    "total_yield": 31.5,
    "unit": "tons/hectare",
    "confidence": "High"
  },
  "stress_analysis": {
    "stress_level": "Low",
    "events": [...],
    "total_stress_days": 5
  },
  "productivity_score": {
    "score": 85,
    "rating": "Excellent",
    "breakdown": {
      "performance": 40,
      "yield": 35,
      "stress_resilience": 10
    }
  },
  "recommendations": [...]
}
```

### 4. Estimate Crop Yield

**Endpoint:** `POST /api/crop-analysis/estimate-yield`

**Description:** Estimate crop yield based on NDVI patterns and crop-specific models.

**Request Body:** Same as performance endpoint

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/crop-analysis/estimate-yield \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { "type": "Polygon", "coordinates": [[...]] },
    "fieldId": "ITALY-RICE-FIELD-01",
    "cropType": "rice",
    "startDate": "2024-05-01",
    "endDate": "2024-10-26",
    "fieldArea": 5.08
  }'
```

### 5. Detect Crop Stress

**Endpoint:** `POST /api/crop-analysis/detect-stress`

**Description:** Detect and classify crop stress events (drought, nutrient deficiency, pests, waterlogging).

**Request Body:**
```json
{
  "fieldBoundary": { "type": "Polygon", "coordinates": [...] },
  "fieldId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/crop-analysis/detect-stress \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { "type": "Polygon", "coordinates": [[...]] },
    "fieldId": "ITALY-RICE-FIELD-01",
    "startDate": "2024-05-01",
    "endDate": "2024-10-26"
  }'
```

---

## Crop Predictions

### 6. Predict Crop Yield

**Endpoint:** `POST /api/crop-analysis/predict-yield`

**Description:** Predict final crop yield with growth forecasting and risk assessment.

**Request Body:**
```json
{
  "fieldBoundary": { "type": "Polygon", "coordinates": [...] },
  "fieldId": "string",
  "cropType": "rice|wheat|maize|cotton|soybean",
  "plantingDate": "YYYY-MM-DD",
  "currentDate": "YYYY-MM-DD",
  "fieldArea": 5.08,
  "historicalYield": 5.5
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/crop-analysis/predict-yield \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { "type": "Polygon", "coordinates": [[...]] },
    "fieldId": "ITALY-RICE-FIELD-01",
    "cropType": "rice",
    "plantingDate": "2024-05-01",
    "currentDate": "2024-10-26",
    "fieldArea": 5.08,
    "historicalYield": 5.5
  }'
```

### 7. Forecast Crop Growth

**Endpoint:** `POST /api/crop-analysis/forecast-growth`

**Description:** Forecast future crop growth trajectory using growth models.

**Request Body:**
```json
{
  "fieldBoundary": { "type": "Polygon", "coordinates": [...] },
  "fieldId": "string",
  "cropType": "rice|wheat|maize|cotton|soybean",
  "plantingDate": "YYYY-MM-DD",
  "currentDate": "YYYY-MM-DD",
  "forecastDays": 30
}
```

---

## Crop Charts

### 8. Generate Comprehensive Crop Chart

**Endpoint:** `POST /api/crop-analysis/crop-chart`

**Description:** Generate comprehensive crop chart combining growth data, NDVI, analytics, and predictions.

**Request Body:**
```json
{
  "fieldBoundary": { "type": "Polygon", "coordinates": [...] },
  "fieldId": "string",
  "cropType": "rice|wheat|maize|cotton|soybean",
  "plantingDate": "YYYY-MM-DD",
  "currentDate": "YYYY-MM-DD",
  "fieldArea": 5.08
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/crop-analysis/crop-chart \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { "type": "Polygon", "coordinates": [[...]] },
    "fieldId": "ITALY-RICE-FIELD-01",
    "cropType": "rice",
    "plantingDate": "2024-05-01",
    "currentDate": "2024-10-26",
    "fieldArea": 5.08
  }'
```

---

## Supported Crop Types

| Crop Type | NDVI Range | Growth Duration | Peak NDVI | Growth Model |
|-----------|------------|-----------------|-----------|--------------|
| Rice | 0.3 - 0.9 | 90-150 days | 0.75 | Sigmoid |
| Wheat | 0.3 - 0.85 | 120-180 days | 0.70 | Sigmoid |
| Maize | 0.3 - 0.9 | 90-140 days | 0.85 | Exponential |
| Cotton | 0.3 - 0.85 | 150-180 days | 0.75 | Linear |
| Soybean | 0.3 - 0.85 | 90-150 days | 0.75 | Sigmoid |

---

## Technical Details

### Data Source
- **Satellite:** Sentinel-2 Level 2A Surface Reflectance
- **Spatial Resolution:** 10 meters
- **Temporal Resolution:** 10-day intervals
- **NDVI Calculation:** (NIR - Red) / (NIR + Red) = (B8 - B4) / (B8 + B4)
- **Cloud Filtering:** < 30% cloud coverage

### Growth Stages
1. **Germination** - Initial emergence (NDVI < 0.3)
2. **Vegetative** - Active growth (NDVI 0.3 - 0.6)
3. **Reproductive** - Flowering/fruiting (NDVI 0.6 - peak)
4. **Maturity** - Grain filling (NDVI declining from peak)
5. **Senescence** - Harvest ready (NDVI < 0.4)

### Stress Detection Thresholds
- **Drought:** NDVI drop > 0.15 over 14 days
- **Nutrient Deficiency:** NDVI < 0.4 for 21+ days
- **Pest/Disease:** Sudden NDVI drop > 0.20
- **Waterlogging:** NDVI < 0.3 with high moisture

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `500` - Internal Server Error
- `503` - Service Unavailable (Earth Engine not initialized)

---

## Best Practices

1. **Planting Date Accuracy:** Provide accurate planting dates for better growth stage detection
2. **Field Area:** Ensure field area is in hectares for accurate yield calculations
3. **Historical Yield:** Provide historical yield data for improved predictions
4. **Date Range:** Use appropriate date ranges covering the full growing season
5. **Crop Type:** Select the correct crop type for accurate modeling

---

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const trackCropGrowth = async () => {
  const response = await axios.post('http://localhost:3000/api/crop-analysis/track-growth', {
    fieldBoundary: { type: 'Polygon', coordinates: [[...]] },
    fieldId: 'FIELD-001',
    cropType: 'rice',
    plantingDate: '2024-05-01',
    currentDate: '2024-10-26'
  });
  
  console.log(response.data);
};
```

### Python
```python
import requests

response = requests.post(
    'http://localhost:3000/api/crop-analysis/track-growth',
    json={
        'fieldBoundary': {'type': 'Polygon', 'coordinates': [[...]]},
        'fieldId': 'FIELD-001',
        'cropType': 'rice',
        'plantingDate': '2024-05-01',
        'currentDate': '2024-10-26'
    }
)

print(response.json())
```

---

## Support

For issues or questions, please refer to the main project documentation or contact the development team.

