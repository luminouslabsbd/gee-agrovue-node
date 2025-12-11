# 📊 API Response Examples - Complete Reference

**Version:** 1.0.0  
**Date:** October 23, 2025  

---

## 📋 Table of Contents

1. [Health Check Response](#health-check-response)
2. [Time Series Response](#time-series-response)
3. [Time Series Map Response](#time-series-map-response)
4. [Field Analysis Response](#field-analysis-response)
5. [Error Responses](#error-responses)

---

## ✅ Health Check Response

### Request
```bash
curl -X GET http://localhost:3000/api/health
```

### Response (200 OK)
```json
{
  "status": "ok",
  "message": "Server is running",
  "earthEngineInitialized": true
}
```

---

## 📈 Time Series Response

### Request
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "NGR-KD-12345",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "intervalDays": 10
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "interval_days": 10,
    "data_points": 14,
    "time_series": [
      {
        "date": "2025-01-10",
        "ndvi_mean": 0.25,
        "ndvi_std": 0.04,
        "ndvi_min": 0.13,
        "ndvi_max": 0.34,
        "cloud_cover": 0.005577,
        "data_quality": "Good"
      },
      {
        "date": "2025-01-20",
        "ndvi_mean": 0.23,
        "ndvi_std": 0.03,
        "ndvi_min": 0.13,
        "ndvi_max": 0.31,
        "cloud_cover": 0.008285,
        "data_quality": "Good"
      }
    ],
    "statistics": {
      "mean_ndvi": 0.25,
      "std_ndvi": 0.06,
      "min_ndvi": 0.1,
      "max_ndvi": 0.35,
      "data_points": 14,
      "date_range_days": 285
    },
    "trends": {
      "trend": "stable",
      "slope": 0.0031,
      "r_squared": 0.039,
      "interpretation": "Vegetation health is stable with minimal change"
    },
    "metadata": {
      "data_source": "Sentinel-2",
      "spatial_resolution": "10m",
      "cloud_filter": "< 30%",
      "generated_at": "2025-10-23T09:15:38.668Z"
    }
  },
  "message": "Time series generated successfully"
}
```

---

## 🗺️ Time Series Map Response

### Request
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series-map \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "NGR-KD-12345",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "intervalDays": 10
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "interval_days": 10,
    "total_maps": 14,
    "maps": [
      {
        "field_id": "NGR-KD-12345",
        "date": "2025-01-10",
        "map_id": "abc123def456xyz",
        "map_token": "xyz789uvw012abc",
        "map_url": "https://earthengine.googleapis.com/map/abc123def456xyz/{z}/{x}/{y}?token=xyz789uvw012abc",
        "statistics": {
          "mean_ndvi": 0.25,
          "std_ndvi": 0.04,
          "min_ndvi": 0.13,
          "max_ndvi": 0.34
        },
        "visualization": {
          "palette": [
            "#d73027",
            "#fc8d59",
            "#fee090",
            "#e0f3f8",
            "#91bfdb",
            "#4575b4"
          ],
          "min": -1,
          "max": 1
        }
      },
      {
        "field_id": "NGR-KD-12345",
        "date": "2025-01-20",
        "map_id": "def456xyz789abc",
        "map_token": "abc012xyz789uvw",
        "map_url": "https://earthengine.googleapis.com/map/def456xyz789abc/{z}/{x}/{y}?token=abc012xyz789uvw",
        "statistics": {
          "mean_ndvi": 0.23,
          "std_ndvi": 0.03,
          "min_ndvi": 0.13,
          "max_ndvi": 0.31
        },
        "visualization": {
          "palette": [
            "#d73027",
            "#fc8d59",
            "#fee090",
            "#e0f3f8",
            "#91bfdb",
            "#4575b4"
          ],
          "min": -1,
          "max": 1
        }
      }
    ],
    "metadata": {
      "data_source": "Sentinel-2",
      "spatial_resolution": "10m",
      "cloud_filter": "< 30%",
      "generated_at": "2025-10-23T09:15:38.668Z"
    }
  },
  "message": "Time series maps generated successfully"
}
```

---

## 🌾 Field Analysis Response

### Request
```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "NGR-KD-12345"
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "date": "2025-10-23",
    "ndvi": {
      "mean": 0.45,
      "std": 0.08,
      "min": 0.25,
      "max": 0.65,
      "median": 0.48,
      "p25": 0.40,
      "p75": 0.52
    },
    "quality": {
      "cloud_cover": 12.5,
      "pixel_count": 1250,
      "data_source": "Sentinel-2",
      "acquisition_date": "2025-10-23",
      "confidence": 0.95
    },
    "interpretation": {
      "health_status": "Good",
      "ndvi_category": "Moderate to Dense Vegetation",
      "score": 7.5,
      "recommendations": [
        "Vegetation is healthy",
        "Continue regular monitoring",
        "No immediate stress detected"
      ]
    },
    "hectares": 0.85
  },
  "message": "Field analysis completed successfully"
}
```

---

## ❌ Error Responses

### Error 1: Missing Required Field (400)
```json
{
  "success": false,
  "error": "Missing required fields: fieldBoundary and fieldId"
}
```

### Error 2: Invalid Geometry Type (400)
```json
{
  "success": false,
  "error": "Only Polygon geometries are supported"
}
```

### Error 3: No Data Available (500)
```json
{
  "success": false,
  "error": "No Sentinel-2 imagery available for the specified date range"
}
```

### Error 4: Date Range Exceeds Limit (500)
```json
{
  "success": false,
  "error": "Date range exceeds maximum of 730 days"
}
```

### Error 5: Invalid Interval (500)
```json
{
  "success": false,
  "error": "Invalid interval. Must be one of: 5, 10, 15, 30"
}
```

### Error 6: Earth Engine Not Initialized (503)
```json
{
  "success": false,
  "error": "Earth Engine not initialized yet. Please try again in a moment."
}
```

---

## 📊 Response Field Descriptions

### Time Series Map Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `field_id` | String | Unique field identifier |
| `date` | String | Date of the map (YYYY-MM-DD) |
| `map_id` | String | Google Earth Engine map ID |
| `map_token` | String | Authentication token for map |
| `map_url` | String | Full URL to map tiles |
| `statistics.mean_ndvi` | Number | Average NDVI value |
| `statistics.std_ndvi` | Number | Standard deviation of NDVI |
| `statistics.min_ndvi` | Number | Minimum NDVI value |
| `statistics.max_ndvi` | Number | Maximum NDVI value |
| `visualization.palette` | Array | Color palette for visualization |
| `visualization.min` | Number | Minimum value for color scale |
| `visualization.max` | Number | Maximum value for color scale |

---

## 🎨 NDVI Color Palette

The default palette represents NDVI values from -1 to 1:

- **#d73027** (Red) - Poor vegetation (-1 to -0.5)
- **#fc8d59** (Orange) - Sparse vegetation (-0.5 to 0)
- **#fee090** (Yellow) - Bare soil (0 to 0.2)
- **#e0f3f8** (Light Blue) - Sparse vegetation (0.2 to 0.4)
- **#91bfdb** (Blue) - Moderate vegetation (0.4 to 0.6)
- **#4575b4** (Dark Blue) - Dense vegetation (0.6 to 1)

---

**Status:** ✅ Complete  
**Last Updated:** October 23, 2025

