# Complete API Documentation - Google Earth Engine Agrovue Node

## 📋 Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [API Endpoints Summary](#api-endpoints-summary)
5. [Detailed API Documentation](#detailed-api-documentation)
6. [Error Handling](#error-handling)
7. [Rate Limits](#rate-limits)
8. [Testing](#testing)

---

## Overview

This is a comprehensive Google Earth Engine-based agricultural analysis API that provides:

- **NDVI Analysis** - Vegetation health monitoring
- **Field Analysis** - Farm field boundary analysis
- **Time Series** - Historical vegetation trends
- **Crop Analysis** - Growth tracking, yield prediction, stress detection
- **Flood Detection** - Water extent analysis using SAR imagery
- **Zone Analysis** - Spatial zone classification with yield estimation
- **Image Export** - NDVI map generation and storage

**Technology Stack:**

- Backend: Node.js + Express.js
- Satellite Data: Google Earth Engine (Sentinel-2, Sentinel-1, MODIS)
- Resolution: 10m (Sentinel-2), 10m (Sentinel-1 SAR)
- Data Format: GeoJSON, JSON

---

## Base URL

```
http://localhost:3000
```

**Production URL:** (To be configured)

---

## Authentication

Currently using **Google Earth Engine Service Account** authentication.

- Credentials stored in `credentials.json`
- Automatic initialization on server startup
- No API key required for local development

---

## API Endpoints Summary

### 📊 Core Endpoints

| #   | Endpoint                        | Method | Category  | Description              |
| --- | ------------------------------- | ------ | --------- | ------------------------ |
| 1   | `/api/health`                   | GET    | System    | Health check             |
| 2   | `/api/ee-status`                | GET    | System    | Earth Engine status      |
| 3   | `/api/ndvi`                     | GET    | NDVI      | Basic NDVI data          |
| 4   | `/api/satellite`                | GET    | Satellite | Satellite imagery        |
| 5   | `/api/ndvi-legend`              | GET    | NDVI      | NDVI color legend        |
| 6   | `/api/ndvi-color-visualization` | GET    | NDVI      | Color visualization info |

### 🌾 Field Analysis Endpoints

| #   | Endpoint                                      | Method | Description                    |
| --- | --------------------------------------------- | ------ | ------------------------------ |
| 7   | `/api/field-analysis`                         | POST   | Analyze field NDVI             |
| 8   | `/api/field-analysis/time-series`             | POST   | Generate time series           |
| 9   | `/api/field-analysis/time-series-map`         | POST   | Generate time series maps      |
| 10  | `/api/field-analysis/two-year-time-series`    | POST   | 2-year time series             |
| 11  | `/api/field-analysis/field-image`             | POST   | Generate field image           |
| 12  | `/api/field-analysis/ndvi-chart`              | POST   | NDVI chart with water/veg/soil |
| 13  | `/api/field-analysis/update-field`            | POST   | Update field boundary          |
| 14  | `/api/field-analysis/recalculate-ndvi`        | POST   | Recalculate NDVI               |
| 15  | `/api/field-analysis/field-data/:fieldId`     | GET    | Get field data                 |
| 16  | `/api/field-analysis/change-history/:fieldId` | GET    | Get change history             |

### 🖼️ Image Export & Storage

| #   | Endpoint                                     | Method | Description        |
| --- | -------------------------------------------- | ------ | ------------------ |
| 17  | `/api/field-analysis/export-ndvi-image`      | POST   | Export NDVI image  |
| 18  | `/api/field-analysis/stored-images`          | GET    | List stored images |
| 19  | `/api/field-analysis/stored-image/:filename` | GET    | Get image metadata |
| 20  | `/api/field-analysis/stored-image/:filename` | DELETE | Delete image       |
| 21  | `/api/field-analysis/storage-stats`          | GET    | Storage statistics |

### 📈 Time Series Management

| #   | Endpoint                                    | Method | Description         |
| --- | ------------------------------------------- | ------ | ------------------- |
| 22  | `/api/field-analysis/time-series/:seriesId` | GET    | Get series metadata |
| 23  | `/api/field-analysis/time-series-list`      | GET    | List all series     |
| 24  | `/api/field-analysis/time-series-stats`     | GET    | Series statistics   |
| 25  | `/api/field-analysis/time-series/:seriesId` | DELETE | Delete series       |

### 🌊 Flood Detection

| #   | Endpoint                                | Method | Description       |
| --- | --------------------------------------- | ------ | ----------------- |
| 26  | `/api/field-analysis/flood-detection`   | POST   | Detect floods     |
| 27  | `/api/field-analysis/flood-time-series` | POST   | Flood time series |

### 🗺️ Zone Analysis

| #   | Endpoint                                  | Method | Description         |
| --- | ----------------------------------------- | ------ | ------------------- |
| 28  | `/api/field-analysis/zone-image`          | POST   | Generate zone image |
| 29  | `/api/field-analysis/zone-image/:imageId` | GET    | Get zone metadata   |
| 30  | `/api/field-analysis/zone-images`         | GET    | List zone images    |

### 🌱 Crop Analysis

| #   | Endpoint                             | Method | Description              |
| --- | ------------------------------------ | ------ | ------------------------ |
| 31  | `/api/crop-analysis/track-growth`    | POST   | Track crop growth        |
| 32  | `/api/crop-analysis/classify-crop`   | POST   | Classify crop type       |
| 33  | `/api/crop-analysis/performance`     | POST   | Crop performance         |
| 34  | `/api/crop-analysis/estimate-yield`  | POST   | Estimate yield           |
| 35  | `/api/crop-analysis/detect-stress`   | POST   | Detect stress            |
| 36  | `/api/crop-analysis/predict-yield`   | POST   | Predict yield            |
| 37  | `/api/crop-analysis/forecast-growth` | POST   | Forecast growth          |
| 38  | `/api/crop-analysis/crop-chart`      | POST   | Comprehensive crop chart |

**Total Endpoints: 38**

---

## Detailed API Documentation

### 1. Health Check

**Endpoint:** `GET /api/health`

**Description:** Check if the server is running

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

**Endpoint:** `GET /api/ee-status`

**Description:** Check Earth Engine initialization status

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

### 3. Basic NDVI Data

**Endpoint:** `GET /api/ndvi`

**Description:** Get NDVI data for a predefined region (MODIS)

**Request:**

```bash
curl http://localhost:3000/api/ndvi
```

**Response:**

```json
{
  "success": true,
  "mapId": {
    "mapid": "...",
    "token": "..."
  },
  "message": "NDVI data retrieved successfully"
}
```

---

### 4. Satellite Imagery

**Endpoint:** `GET /api/satellite`

**Description:** Get Sentinel-2 satellite imagery

**Request:**

```bash
curl http://localhost:3000/api/satellite
```

**Response:**

```json
{
  "success": true,
  "mapId": {
    "mapid": "...",
    "token": "..."
  },
  "message": "Satellite imagery retrieved successfully"
}
```

---

### 5. NDVI Legend

**Endpoint:** `GET /api/ndvi-legend`

**Description:** Get NDVI color scale and legend

**Request:**

```bash
curl http://localhost:3000/api/ndvi-legend
```

**Response:**

```json
{
  "success": true,
  "data": {
    "scale": [
      { "value": -1, "color": "#0000ff", "label": "Water" },
      { "value": 0, "color": "#8b4513", "label": "Bare Soil" },
      { "value": 0.2, "color": "#ffff00", "label": "Sparse Vegetation" },
      { "value": 0.4, "color": "#90ee90", "label": "Moderate Vegetation" },
      { "value": 0.6, "color": "#00ff00", "label": "Dense Vegetation" },
      { "value": 1, "color": "#006400", "label": "Very Dense Vegetation" }
    ]
  },
  "html": "...",
  "css": "..."
}
```

---

### 6. NDVI Color Visualization

**Endpoint:** `GET /api/ndvi-color-visualization`

**Description:** Get NDVI visualization parameters

**Request:**

```bash
curl http://localhost:3000/api/ndvi-color-visualization
```

**Response:**

```json
{
  "success": true,
  "data": {
    "scale": [...],
    "legend": [...],
    "visualization_params": {
      "min": -1,
      "max": 1,
      "palette": [...]
    },
    "description": "NDVI Color Visualization with proper color mapping for each range"
  }
}
```

---

### 7. Field Analysis

**Endpoint:** `POST /api/field-analysis`

**Description:** Analyze NDVI for a farm field boundary

**Request Body:**

```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [
      [
        [90.37110641598703, 23.841231509287553],
        [90.37093743681908, 23.84014467798467],
        [90.37123516201974, 23.84014713133873],
        [90.3713531792164, 23.840186384997345],
        [90.37143632769585, 23.840105424313425],
        [90.37150606513023, 23.840120144441542],
        [90.37162408232689, 23.8403286794102],
        [90.37181988358499, 23.840316412656623],
        [90.37198618054391, 23.840529854003293],
        [90.37194058299067, 23.840890495480306],
        [90.37191644310953, 23.84110638921785],
        [90.37187889218332, 23.841135829245108],
        [90.3714242577553, 23.84087086875907],
        [90.37147387862206, 23.841177535938964],
        [90.37157043814659, 23.841177535938964],
        [90.37110641598703, 23.841231509287553]
      ]
    ]
  },
  "fieldId": "FIELD-001",
  "startDate": "2024-10-01",
  "endDate": "2024-10-26"
}
```

**cURL Request:**

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.37110641598703, 23.841231509287553], [90.37093743681908, 23.84014467798467], [90.37123516201974, 23.84014713133873], [90.3713531792164, 23.840186384997345], [90.37143632769585, 23.840105424313425], [90.37150606513023, 23.840120144441542], [90.37162408232689, 23.8403286794102], [90.37181988358499, 23.840316412656623], [90.37198618054391, 23.840529854003293], [90.37194058299067, 23.840890495480306], [90.37191644310953, 23.84110638921785], [90.37187889218332, 23.841135829245108], [90.3714242577553, 23.84087086875907], [90.37147387862206, 23.841177535938964], [90.37157043814659, 23.841177535938964], [90.37110641598703, 23.841231509287553]]]
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
    "date": "2024-10-26",
    "ndvi": {
      "mean": 0.68,
      "std": 0.12,
      "min": 0.35,
      "max": 0.85,
      "median": 0.68,
      "p25": 0.62,
      "p75": 0.74
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
      "alerts": []
    },
    "hectares": 5.0
  },
  "message": "Field analysis completed successfully"
}
```

---

### 8. Time Series Analysis

**Endpoint:** `POST /api/field-analysis/time-series`

**Description:** Generate historical NDVI time series

**Request Body:**

```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [[[...]]]
  },
  "fieldId": "FIELD-001",
  "startDate": "2024-01-01",
  "endDate": "2024-10-26",
  "intervalDays": 10
}
```

**cURL Request:**

```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {"type": "Polygon", "coordinates": [[[90.37110641598703, 23.841231509287553], [90.37093743681908, 23.84014467798467], [90.37123516201974, 23.84014713133873], [90.3713531792164, 23.840186384997345], [90.37143632769585, 23.840105424313425], [90.37150606513023, 23.840120144441542], [90.37162408232689, 23.8403286794102], [90.37181988358499, 23.840316412656623], [90.37198618054391, 23.840529854003293], [90.37194058299067, 23.840890495480306], [90.37191644310953, 23.84110638921785], [90.37187889218332, 23.841135829245108], [90.3714242577553, 23.84087086875907], [90.37147387862206, 23.841177535938964], [90.37157043814659, 23.841177535938964], [90.37110641598703, 23.841231509287553]]]},
    "fieldId": "FIELD-001",
    "startDate": "2024-01-01",
    "endDate": "2024-10-26",
    "intervalDays": 10
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
        "ndvi_mean": 0.45,
        "ndvi_std": 0.08,
        "cloud_cover": 12.3,
        "pixel_count": 1200
      },
      {
        "date": "2024-01-11",
        "ndvi_mean": 0.52,
        "ndvi_std": 0.09,
        "cloud_cover": 5.2,
        "pixel_count": 1245
      }
    ],
    "summary": {
      "total_observations": 30,
      "date_range": {
        "start": "2024-01-01",
        "end": "2024-10-26"
      },
      "ndvi_trend": "increasing",
      "average_ndvi": 0.62
    }
  },
  "message": "Time series generated successfully"
}
```

---
