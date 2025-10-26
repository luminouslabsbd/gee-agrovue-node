# Crop Analysis API - cURL Request Examples

## Complete cURL Examples with Expected Responses

---

## 1. Track Crop Growth

### Request
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

### Expected Response
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
    "description": "Crop has reached maturity and is approaching harvest",
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
  "ndvi_time_series": [
    { "date": "2024-05-10", "ndvi_mean": 0.25, "ndvi_std": 0.05 },
    { "date": "2024-05-20", "ndvi_mean": 0.35, "ndvi_std": 0.06 },
    "..."
  ]
}
```

---

## 2. Classify Crop Type

### Request
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

### Expected Response
```json
{
  "success": true,
  "field_id": "ITALY-UNKNOWN-CROP",
  "classification_results": {
    "identified_crop": "Rice",
    "confidence": 0.85,
    "match_score": 85
  },
  "crop_scores": {
    "rice": 85,
    "wheat": 45,
    "maize": 38,
    "cotton": 25,
    "soybean": 42
  }
}
```

---

## 3. Analyze Crop Performance

### Request
```bash
curl -X POST http://localhost:3000/api/crop-analysis/performance \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[...]]
    },
    "fieldId": "ITALY-RICE-FIELD-01",
    "cropType": "rice",
    "startDate": "2024-05-01",
    "endDate": "2024-10-26",
    "fieldArea": 5.08
  }'
```

### Expected Response
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
    "confidence": "High",
    "yield_range": { "min": 5.8, "max": 6.6 }
  },
  "stress_analysis": {
    "stress_level": "Low",
    "total_stress_days": 5,
    "events": [
      {
        "type": "drought",
        "severity": "moderate",
        "start_date": "2024-07-15",
        "duration_days": 5
      }
    ]
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
  "recommendations": [
    "Maintain current irrigation schedule",
    "Monitor for early harvest indicators",
    "Excellent crop health - continue current practices"
  ]
}
```

---

## 4. Estimate Crop Yield

### Request
```bash
curl -X POST http://localhost:3000/api/crop-analysis/estimate-yield \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[...]]
    },
    "fieldId": "ITALY-RICE-FIELD-01",
    "cropType": "rice",
    "startDate": "2024-05-01",
    "endDate": "2024-10-26",
    "fieldArea": 5.08
  }'
```

### Expected Response
```json
{
  "success": true,
  "field_id": "ITALY-RICE-FIELD-01",
  "crop_type": "Rice",
  "yield_estimate": {
    "estimated_yield_per_hectare": 6.2,
    "total_yield": 31.5,
    "unit": "tons/hectare",
    "confidence": "High",
    "yield_range": { "min": 5.8, "max": 6.6 },
    "calculation_method": "NDVI-based regression",
    "model_parameters": {
      "baseline_yield": 3.5,
      "ndvi_coefficient": 8.5,
      "integrated_coefficient": 0.15,
      "peak_ndvi": 0.82,
      "integrated_ndvi": 125.5
    }
  }
}
```

---

## 5. Detect Crop Stress

### Request
```bash
curl -X POST http://localhost:3000/api/crop-analysis/detect-stress \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[...]]
    },
    "fieldId": "ITALY-RICE-FIELD-01",
    "startDate": "2024-05-01",
    "endDate": "2024-10-26"
  }'
```

### Expected Response
```json
{
  "success": true,
  "field_id": "ITALY-RICE-FIELD-01",
  "stress_analysis": {
    "stress_level": "Low",
    "total_stress_days": 5,
    "events": [
      {
        "type": "drought",
        "severity": "moderate",
        "start_date": "2024-07-15",
        "end_date": "2024-07-20",
        "duration_days": 5,
        "ndvi_drop": 0.18,
        "current_ndvi": 0.62,
        "impact": "Temporary growth slowdown"
      }
    ],
    "stress_summary": {
      "drought_events": 1,
      "nutrient_events": 0,
      "pest_disease_events": 0,
      "waterlogging_events": 0
    }
  }
}
```

---

## 6. Predict Crop Yield

### Request
```bash
curl -X POST http://localhost:3000/api/crop-analysis/predict-yield \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[...]]
    },
    "fieldId": "ITALY-RICE-FIELD-01",
    "cropType": "rice",
    "plantingDate": "2024-05-01",
    "currentDate": "2024-10-26",
    "fieldArea": 5.08,
    "historicalYield": 5.5
  }'
```

### Expected Response
```json
{
  "success": true,
  "field_id": "ITALY-RICE-FIELD-01",
  "crop_type": "Rice",
  "yield_prediction": {
    "predicted_yield_per_hectare": 6.3,
    "total_predicted_yield": 32.0,
    "unit": "tons/hectare",
    "confidence": 0.85,
    "prediction_range": { "min": 5.9, "max": 6.7 },
    "comparison_to_historical": {
      "historical_yield": 5.5,
      "predicted_yield": 6.3,
      "difference": 0.8,
      "percentage_change": 14.5
    }
  },
  "growth_forecast": {
    "forecast_days": 30,
    "forecast": [
      { "date": "2024-10-27", "predicted_ndvi": 0.64, "days_ahead": 1 },
      { "date": "2024-10-28", "predicted_ndvi": 0.63, "days_ahead": 2 },
      "..."
    ]
  },
  "harvest_prediction": {
    "estimated_harvest_date": "2024-11-15",
    "days_until_harvest": 20,
    "confidence": "High"
  },
  "risk_assessment": {
    "risk_level": "Low",
    "risk_score": 15,
    "risk_factors": []
  }
}
```

---

## 7. Forecast Crop Growth

### Request
```bash
curl -X POST http://localhost:3000/api/crop-analysis/forecast-growth \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[...]]
    },
    "fieldId": "ITALY-RICE-FIELD-01",
    "cropType": "rice",
    "plantingDate": "2024-05-01",
    "currentDate": "2024-10-26",
    "forecastDays": 30
  }'
```

### Expected Response
```json
{
  "success": true,
  "field_id": "ITALY-RICE-FIELD-01",
  "crop_type": "Rice",
  "forecast_period": {
    "start_date": "2024-10-26",
    "end_date": "2024-11-25",
    "forecast_days": 30
  },
  "growth_forecast": {
    "model_type": "sigmoid",
    "current_ndvi": 0.65,
    "forecast": [
      { "date": "2024-10-27", "predicted_ndvi": 0.64, "days_ahead": 1 },
      { "date": "2024-10-28", "predicted_ndvi": 0.63, "days_ahead": 2 },
      { "date": "2024-10-29", "predicted_ndvi": 0.62, "days_ahead": 3 },
      "..."
    ]
  },
  "confidence": 0.85
}
```

---

## 8. Generate Comprehensive Crop Chart

### Request
```bash
curl -X POST http://localhost:3000/api/crop-analysis/crop-chart \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[...]]
    },
    "fieldId": "ITALY-RICE-FIELD-01",
    "cropType": "rice",
    "plantingDate": "2024-05-01",
    "currentDate": "2024-10-26",
    "fieldArea": 5.08
  }'
```

### Expected Response
```json
{
  "success": true,
  "field_id": "ITALY-RICE-FIELD-01",
  "crop_type": "rice",
  "chart_data": {
    "labels": ["2024-05-10", "2024-05-20", "..."],
    "datasets": [
      {
        "label": "Historical NDVI",
        "data": [0.25, 0.35, 0.45, "..."],
        "borderColor": "#4CAF50",
        "backgroundColor": "rgba(76, 175, 80, 0.2)"
      },
      {
        "label": "Predicted NDVI",
        "data": [null, null, "...", 0.64, 0.63],
        "borderColor": "#2196F3",
        "borderDash": [5, 5]
      }
    ]
  },
  "chart_options": {
    "responsive": true,
    "plugins": {
      "title": { "text": "Crop Growth Analysis - Rice" }
    }
  },
  "annotations": [
    {
      "type": "line",
      "value": "2024-06-15",
      "label": { "content": "Peak Vegetation" }
    }
  ],
  "summary": {
    "crop_health": {
      "current_stage": "Maturity",
      "health_score": 85,
      "vigor_percentage": 78
    },
    "performance": {
      "productivity_score": 85,
      "productivity_rating": "Excellent"
    },
    "predictions": {
      "estimated_yield": 6.3,
      "harvest_date": "2024-11-15",
      "days_until_harvest": 20
    }
  }
}
```

---

## Testing Notes

1. **Processing Time:** Google Earth Engine operations can take 30-120 seconds depending on:
   - Date range (longer ranges = more processing)
   - Field size (larger fields = more processing)
   - Cloud coverage (more filtering = more processing)

2. **Field Boundary:** Use GeoJSON Polygon format with coordinates in [longitude, latitude] order

3. **Dates:** Use YYYY-MM-DD format for all dates

4. **Crop Types:** Supported values: `rice`, `wheat`, `maize`, `cotton`, `soybean`

5. **Field Area:** Provide in hectares for accurate yield calculations

---

## Quick Test Commands

### Test Server Health
```bash
curl http://localhost:3000/api/health
```

### Test Earth Engine Status
```bash
curl http://localhost:3000/api/ee-status
```

---

## Error Responses

### Missing Parameters
```json
{
  "success": false,
  "error": "Missing required fields: fieldBoundary, fieldId, cropType"
}
```

### Service Not Initialized
```json
{
  "success": false,
  "error": "Crop Growth Tracking Service not initialized"
}
```

### Processing Error
```json
{
  "success": false,
  "error": "Failed to fetch NDVI time series: [error details]"
}
```

---

*All examples use the Italy test field (Lazio region) with rice crop planted on 2024-05-01*

