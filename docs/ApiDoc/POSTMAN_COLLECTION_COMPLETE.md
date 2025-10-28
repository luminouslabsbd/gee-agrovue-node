# ✅ Master Postman Collection - Complete

## 📊 Collection Summary

**File:** `MASTER_POSTMAN_COLLECTION.json`  
**Total Categories:** 8  
**Total Endpoints:** 38  
**Format:** Postman Collection v2.1.0  
**Status:** ✅ Complete with all APIs

---

## 📋 Complete Endpoint List

### 1. System APIs (2 endpoints)

| # | Name | Method | Endpoint |
|---|------|--------|----------|
| 1 | Health Check | GET | `/api/health` |
| 2 | Earth Engine Status | GET | `/api/ee-status` |

---

### 2. NDVI & Satellite APIs (4 endpoints)

| # | Name | Method | Endpoint |
|---|------|--------|----------|
| 3 | Get NDVI Data | GET | `/api/ndvi` |
| 4 | Get Satellite Imagery | GET | `/api/satellite` |
| 5 | Get NDVI Legend | GET | `/api/ndvi-legend` |
| 6 | Get NDVI Color Visualization | GET | `/api/ndvi-color-visualization` |

---

### 3. Field Analysis APIs (10 endpoints)

| # | Name | Method | Endpoint |
|---|------|--------|----------|
| 7 | Field Analysis | POST | `/api/field-analysis` |
| 8 | Time Series Analysis | POST | `/api/field-analysis/time-series` |
| 9 | Time Series Map | POST | `/api/field-analysis/time-series-map` |
| 10 | Two-Year Time Series | POST | `/api/field-analysis/two-year-time-series` |
| 11 | Field Image | POST | `/api/field-analysis/field-image` |
| 12 | NDVI Chart | POST | `/api/field-analysis/ndvi-chart` |
| 13 | Update Field | POST | `/api/field-analysis/update-field` |
| 14 | Recalculate NDVI | POST | `/api/field-analysis/recalculate-ndvi` |
| 15 | Get Field Data | GET | `/api/field-analysis/field-data/:fieldId` |
| 16 | Get Change History | GET | `/api/field-analysis/change-history/:fieldId` |

---

### 4. Image Export & Storage APIs (5 endpoints)

| # | Name | Method | Endpoint |
|---|------|--------|----------|
| 17 | Export NDVI Image | POST | `/api/field-analysis/export-ndvi-image` |
| 18 | List Stored Images | GET | `/api/field-analysis/stored-images` |
| 19 | Get Image Metadata | GET | `/api/field-analysis/stored-image/:filename` |
| 20 | Delete Stored Image | DELETE | `/api/field-analysis/stored-image/:filename` |
| 21 | Get Storage Stats | GET | `/api/field-analysis/storage-stats` |

---

### 5. Time Series Management APIs (4 endpoints)

| # | Name | Method | Endpoint |
|---|------|--------|----------|
| 22 | Get Series Metadata | GET | `/api/field-analysis/time-series/:seriesId` |
| 23 | List Time Series | GET | `/api/field-analysis/time-series-list` |
| 24 | Get Time Series Stats | GET | `/api/field-analysis/time-series-stats` |
| 25 | Delete Time Series | DELETE | `/api/field-analysis/time-series/:seriesId` |

---

### 6. Flood Detection APIs (2 endpoints) ✨ NEW

| # | Name | Method | Endpoint |
|---|------|--------|----------|
| 26 | Flood Detection | POST | `/api/field-analysis/flood-detection` |
| 27 | Flood Time Series | POST | `/api/field-analysis/flood-time-series` |

**Request Body Example:**
```json
{
  "fieldBoundary": {...},
  "fieldId": "FIELD-001",
  "currentDate": "2024-10-26",
  "baselineStartDate": "2024-01-01",
  "baselineEndDate": "2024-03-31"
}
```

---

### 7. Zone Analysis APIs (3 endpoints) ✨ NEW

| # | Name | Method | Endpoint |
|---|------|--------|----------|
| 28 | Generate Zone Image | POST | `/api/field-analysis/zone-image` |
| 29 | Get Zone Image Metadata | GET | `/api/field-analysis/zone-image/:imageId` |
| 30 | List Zone Images | GET | `/api/field-analysis/zone-images` |

**Request Body Example:**
```json
{
  "fieldBoundary": {...},
  "fieldId": "FIELD-001",
  "date": "2024-10-26",
  "gridSize": 50,
  "cropType": "rice"
}
```

---

### 8. Crop Analysis APIs (8 endpoints) ✨ NEW

| # | Name | Method | Endpoint |
|---|------|--------|----------|
| 31 | Track Crop Growth | POST | `/api/crop-analysis/track-growth` |
| 32 | Classify Crop Type | POST | `/api/crop-analysis/classify-crop` |
| 33 | Crop Performance Analysis | POST | `/api/crop-analysis/performance` |
| 34 | Estimate Crop Yield | POST | `/api/crop-analysis/estimate-yield` |
| 35 | Detect Crop Stress | POST | `/api/crop-analysis/detect-stress` |
| 36 | Predict Crop Yield | POST | `/api/crop-analysis/predict-yield` |
| 37 | Forecast Crop Growth | POST | `/api/crop-analysis/forecast-growth` |
| 38 | Comprehensive Crop Chart | POST | `/api/crop-analysis/crop-chart` |

**Request Body Examples:**

**Track Crop Growth:**
```json
{
  "fieldBoundary": {...},
  "fieldId": "FIELD-001",
  "cropType": "rice",
  "plantingDate": "2024-06-01",
  "currentDate": "2024-10-26"
}
```

**Classify Crop Type:**
```json
{
  "fieldBoundary": {...},
  "fieldId": "FIELD-001",
  "startDate": "2024-01-01",
  "endDate": "2024-10-26"
}
```

**Crop Performance Analysis:**
```json
{
  "fieldBoundary": {...},
  "fieldId": "FIELD-001",
  "cropType": "rice",
  "startDate": "2024-06-01",
  "endDate": "2024-10-26",
  "fieldArea": 5.0
}
```

**Detect Crop Stress:**
```json
{
  "fieldBoundary": {...},
  "fieldId": "FIELD-001",
  "cropType": "rice",
  "startDate": "2024-06-01",
  "endDate": "2024-10-26"
}
```

**Predict Crop Yield:**
```json
{
  "fieldBoundary": {...},
  "fieldId": "FIELD-001",
  "cropType": "rice",
  "plantingDate": "2024-06-01",
  "currentDate": "2024-10-26",
  "fieldArea": 5.0
}
```

**Forecast Crop Growth:**
```json
{
  "fieldBoundary": {...},
  "fieldId": "FIELD-001",
  "cropType": "rice",
  "plantingDate": "2024-06-01",
  "currentDate": "2024-10-26",
  "forecastDays": 30
}
```

**Comprehensive Crop Chart:**
```json
{
  "fieldBoundary": {...},
  "fieldId": "FIELD-001",
  "cropType": "rice",
  "plantingDate": "2024-06-01",
  "startDate": "2024-06-01",
  "endDate": "2024-10-26",
  "interval": "weekly"
}
```

---

## 🚀 How to Use

### 1. Import to Postman

1. Open Postman
2. Click **"Import"** button
3. Select **`MASTER_POSTMAN_COLLECTION.json`**
4. Collection will be imported with all 38 endpoints

### 2. Configure Variables

The collection includes pre-configured variables:

- **`baseUrl`**: `http://localhost:3000`
- **`fieldBoundary`**: Sample GeoJSON polygon (Bangladesh location)

### 3. Test Endpoints

All endpoints are organized into 8 folders:
- System APIs
- NDVI & Satellite APIs
- Field Analysis APIs
- Image Export & Storage APIs
- Time Series Management APIs
- Flood Detection APIs ✨
- Zone Analysis APIs ✨
- Crop Analysis APIs ✨

---

## 📊 Statistics

| Category | Endpoints | Method Distribution |
|----------|-----------|---------------------|
| System APIs | 2 | GET: 2 |
| NDVI & Satellite APIs | 4 | GET: 4 |
| Field Analysis APIs | 10 | POST: 8, GET: 2 |
| Image Export & Storage APIs | 5 | POST: 1, GET: 3, DELETE: 1 |
| Time Series Management APIs | 4 | GET: 3, DELETE: 1 |
| Flood Detection APIs | 2 | POST: 2 |
| Zone Analysis APIs | 3 | POST: 1, GET: 2 |
| Crop Analysis APIs | 8 | POST: 8 |
| **TOTAL** | **38** | **POST: 21, GET: 15, DELETE: 2** |

---

## ✅ Verification

Run this command to verify the collection:

```bash
# Count total endpoints
cat MASTER_POSTMAN_COLLECTION.json | jq '[.item[].item | length] | add'
# Output: 38

# List all categories
cat MASTER_POSTMAN_COLLECTION.json | jq -r '.item[] | .name + " (" + (.item | length | tostring) + " endpoints)"'
```

---

## 🎯 What's New

### Added in This Update:

✅ **Flood Detection APIs (2 endpoints)**
- Flood Detection using Sentinel-1 SAR
- Flood Time Series analysis

✅ **Zone Analysis APIs (3 endpoints)**
- Generate zone-based productivity maps
- Get zone image metadata
- List all zone images

✅ **Crop Analysis APIs (8 endpoints)**
- Track crop growth stages
- Classify crop types
- Analyze crop performance
- Estimate crop yield
- Detect crop stress
- Predict final yield
- Forecast future growth
- Generate comprehensive crop charts

---

## 📝 Notes

- All POST requests include sample request bodies
- Variables are pre-configured for easy testing
- Field boundary uses real Bangladesh coordinates
- All endpoints tested and verified
- JSON format validated

---

**Status:** ✅ Complete - All 38 endpoints included  
**Last Updated:** 2024-10-28  
**Version:** 1.0.0

