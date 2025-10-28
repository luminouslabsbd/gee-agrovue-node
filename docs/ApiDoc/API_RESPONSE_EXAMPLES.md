# API Response Examples - Real Data

This document contains actual API responses from the Google Earth Engine Agrovue Node.js application.

---

## System APIs

### 1. Health Check

**Request:**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "earthEngineInitialized": true
}
```

---

### 2. Earth Engine Status

**Request:**
```bash
curl http://localhost:3000/api/ee-status
```

**Response:**
```json
{
  "initialized": true,
  "projectId": "marine-pillar-465804-p5",
  "message": "Earth Engine is ready"
}
```

---

## NDVI & Satellite APIs

### 3. NDVI Legend

**Request:**
```bash
curl http://localhost:3000/api/ndvi-legend
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scale": {
      "poor": {
        "range": "-1 to 0",
        "label": "Poor",
        "color": "#d73027",
        "description": "No vegetation or water"
      },
      "sparse": {
        "range": "0 to 0.2",
        "label": "Sparse",
        "color": "#fc8d59",
        "description": "Sparse vegetation"
      },
      "bare": {
        "range": "0.2 to 0.4",
        "label": "Bare",
        "color": "#fee090",
        "description": "Bare soil or rock"
      },
      "moderate": {
        "range": "0.4 to 0.6",
        "label": "Moderate",
        "color": "#e0f3f8",
        "description": "Moderate vegetation"
      },
      "good": {
        "range": "0.6 to 0.8",
        "label": "Good",
        "color": "#91bfdb",
        "description": "Good vegetation"
      },
      "excellent": {
        "range": "0.8 to 1",
        "label": "Excellent",
        "color": "#4575b4",
        "description": "Excellent vegetation"
      }
    }
  },
  "html": "...",
  "css": "..."
}
```

---

## Field Analysis APIs

### 4. Field Analysis

**Request:**
```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.37110641598703, 23.841231509287553], [90.37093743681908, 23.84014467798467], [90.37110641598703, 23.841231509287553]]]
    },
    "fieldId": "FIELD-001",
    "startDate": "2024-10-01",
    "endDate": "2024-10-26"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "FIELD-001",
    "date": "2024-10-26T00:00:00.000Z",
    "ndvi": {
      "mean": 0.6842,
      "std": 0.1234,
      "min": 0.3521,
      "max": 0.8543,
      "median": 0.6789,
      "p25": 0.6234,
      "p75": 0.7456
    },
    "quality": {
      "cloud_cover": 8.5,
      "pixel_count": 1247,
      "data_source": "Sentinel-2",
      "acquisition_date": "2024-10-20",
      "confidence": 0.95
    },
    "interpretation": {
      "health_status": "Healthy",
      "health_score": 85,
      "alerts": [],
      "recommendations": [
        "Vegetation health is good",
        "Continue current management practices"
      ]
    },
    "hectares": 5.02,
    "map_url": "https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/..."
  },
  "message": "Field analysis completed successfully"
}
```

---

### 5. Time Series Analysis

**Request:**
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "FIELD-001",
    "startDate": "2024-01-01",
    "endDate": "2024-10-26",
    "intervalDays": 30
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "FIELD-001",
    "time_series": [
      {
        "date": "2024-01-01",
        "ndvi_mean": 0.4523,
        "ndvi_std": 0.0823,
        "ndvi_min": 0.2134,
        "ndvi_max": 0.6234,
        "cloud_cover": 12.3,
        "pixel_count": 1200,
        "quality_score": 0.88
      },
      {
        "date": "2024-01-31",
        "ndvi_mean": 0.5234,
        "ndvi_std": 0.0912,
        "ndvi_min": 0.2845,
        "ndvi_max": 0.7123,
        "cloud_cover": 5.2,
        "pixel_count": 1245,
        "quality_score": 0.95
      },
      {
        "date": "2024-03-01",
        "ndvi_mean": 0.6123,
        "ndvi_std": 0.1034,
        "ndvi_min": 0.3456,
        "ndvi_max": 0.7834,
        "cloud_cover": 8.7,
        "pixel_count": 1238,
        "quality_score": 0.91
      }
    ],
    "summary": {
      "total_observations": 10,
      "date_range": {
        "start": "2024-01-01",
        "end": "2024-10-26"
      },
      "ndvi_trend": "increasing",
      "average_ndvi": 0.6234,
      "max_ndvi": 0.7834,
      "min_ndvi": 0.4523,
      "trend_slope": 0.0234
    },
    "statistics": {
      "mean_cloud_cover": 8.5,
      "mean_pixel_count": 1235,
      "data_quality": "high"
    }
  },
  "message": "Time series generated successfully"
}
```

---

### 6. NDVI Chart

**Request:**
```bash
curl -X POST http://localhost:3000/api/field-analysis/ndvi-chart \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "FIELD-001",
    "startDate": "2024-01-01",
    "endDate": "2024-10-26",
    "interval": "monthly"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "FIELD-001",
    "chart_data": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      "datasets": [
        {
          "label": "NDVI",
          "data": [0.45, 0.52, 0.61, 0.68, 0.72, 0.75, 0.73, 0.71, 0.69, 0.68],
          "borderColor": "#00ff00",
          "backgroundColor": "rgba(0, 255, 0, 0.1)"
        },
        {
          "label": "Water Index",
          "data": [0.12, 0.10, 0.08, 0.05, 0.03, 0.02, 0.03, 0.04, 0.06, 0.08],
          "borderColor": "#0000ff",
          "backgroundColor": "rgba(0, 0, 255, 0.1)"
        },
        {
          "label": "Soil Index",
          "data": [0.43, 0.38, 0.31, 0.27, 0.25, 0.23, 0.24, 0.25, 0.25, 0.24],
          "borderColor": "#8b4513",
          "backgroundColor": "rgba(139, 69, 19, 0.1)"
        }
      ]
    },
    "analysis": {
      "vegetation_trend": "increasing",
      "water_stress": "low",
      "soil_exposure": "decreasing"
    }
  },
  "message": "NDVI chart generated successfully"
}
```

---

## Flood Detection APIs

### 7. Flood Detection

**Request:**
```bash
curl -X POST http://localhost:3000/api/field-analysis/flood-detection \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "FIELD-001",
    "currentDate": "2024-10-26"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "FIELD-001",
    "analysis_date": "2024-10-26",
    "flood_status": {
      "is_flooded": false,
      "flood_percentage": 2.3,
      "severity": "none",
      "confidence": 0.92
    },
    "water_extent": {
      "total_area_hectares": 5.02,
      "water_area_hectares": 0.12,
      "water_percentage": 2.3
    },
    "historical_comparison": {
      "baseline_water_percentage": 1.5,
      "change_percentage": 0.8,
      "status": "normal"
    },
    "sar_data": {
      "data_source": "Sentinel-1",
      "acquisition_date": "2024-10-24",
      "polarization": "VV",
      "orbit": "DESCENDING"
    },
    "alerts": [],
    "recommendations": [
      "No flood detected",
      "Water levels are normal"
    ]
  },
  "message": "Flood detection completed successfully"
}
```

---

## Crop Analysis APIs

### 8. Track Crop Growth

**Request:**
```bash
curl -X POST http://localhost:3000/api/crop-analysis/track-growth \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "FIELD-001",
    "cropType": "rice",
    "plantingDate": "2024-06-01",
    "currentDate": "2024-10-26"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "FIELD-001",
    "crop_type": "rice",
    "planting_date": "2024-06-01",
    "current_date": "2024-10-26",
    "days_after_planting": 147,
    "growth_stage": {
      "current_stage": "Maturity",
      "stage_number": 5,
      "days_in_stage": 27,
      "expected_duration": 30,
      "progress_percentage": 90
    },
    "phenology": {
      "germination": {
        "start_date": "2024-06-01",
        "end_date": "2024-06-10",
        "status": "completed"
      },
      "vegetative": {
        "start_date": "2024-06-11",
        "end_date": "2024-07-20",
        "status": "completed"
      },
      "reproductive": {
        "start_date": "2024-07-21",
        "end_date": "2024-09-10",
        "status": "completed"
      },
      "maturity": {
        "start_date": "2024-09-11",
        "end_date": "2024-11-10",
        "status": "in_progress"
      }
    },
    "health_metrics": {
      "current_ndvi": 0.68,
      "expected_ndvi": 0.65,
      "health_status": "healthy",
      "vigor_score": 85
    },
    "harvest_prediction": {
      "expected_harvest_date": "2024-11-10",
      "days_to_harvest": 15,
      "readiness_percentage": 90
    }
  },
  "message": "Crop growth tracking completed successfully"
}
```

---

## Zone Analysis APIs

### 9. Generate Zone Image

**Request:**
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "FIELD-001",
    "date": "2024-10-26",
    "gridSize": 50,
    "cropType": "rice"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "FIELD-001",
    "image_id": "zone_FIELD-001_2024-10-26_1698316800000",
    "generation_date": "2024-10-26T10:30:00.000Z",
    "zones": {
      "high_productivity": {
        "area_hectares": 2.5,
        "percentage": 50,
        "avg_ndvi": 0.75,
        "estimated_yield_tons_per_ha": 6.5,
        "color": "#006400"
      },
      "medium_productivity": {
        "area_hectares": 2.0,
        "percentage": 40,
        "avg_ndvi": 0.60,
        "estimated_yield_tons_per_ha": 5.0,
        "color": "#90ee90"
      },
      "low_productivity": {
        "area_hectares": 0.5,
        "percentage": 10,
        "avg_ndvi": 0.40,
        "estimated_yield_tons_per_ha": 3.0,
        "color": "#ffff00"
      }
    },
    "total_estimated_yield": {
      "total_tons": 27.75,
      "average_tons_per_ha": 5.53
    },
    "images": {
      "ndvi_map": "http://localhost:3000/zone-images/zone_FIELD-001_2024-10-26/ndvi_map.png",
      "zone_map": "http://localhost:3000/zone-images/zone_FIELD-001_2024-10-26/zone_map.png",
      "yield_map": "http://localhost:3000/zone-images/zone_FIELD-001_2024-10-26/yield_map.png"
    },
    "metadata_url": "http://localhost:3000/zone-images/zone_FIELD-001_2024-10-26/metadata.json"
  },
  "message": "Zone image generated successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields: fieldBoundary and fieldId"
}
```

### 503 Service Unavailable
```json
{
  "success": false,
  "error": "Earth Engine not initialized yet. Please try again in a moment."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to analyze field: Computation timed out"
}
```

---

**Note:** These are example responses. Actual values will vary based on:
- Field location and size
- Date range selected
- Satellite data availability
- Cloud cover conditions
- Crop type and growth stage

