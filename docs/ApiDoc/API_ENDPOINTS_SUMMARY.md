# Complete API Endpoints Summary

## 📊 Overview

**Total Endpoints:** 38  
**Base URL:** `http://localhost:3000`  
**Authentication:** Google Earth Engine Service Account (Auto-configured)  
**Data Format:** JSON  
**Satellite Data:** Sentinel-2 (10m), Sentinel-1 SAR (10m), MODIS

---

## 🗂️ API Categories

| Category | Endpoints | Description |
|----------|-----------|-------------|
| System | 2 | Health check and status |
| NDVI & Satellite | 4 | Basic NDVI and satellite imagery |
| Field Analysis | 10 | Field boundary analysis and time series |
| Image Export & Storage | 5 | NDVI image export and management |
| Time Series Management | 4 | Time series data management |
| Flood Detection | 2 | Flood detection using SAR |
| Zone Analysis | 3 | Spatial zone classification |
| Crop Analysis | 8 | Crop growth, yield, and stress detection |

---

## 📋 Complete Endpoint List

### 1. System APIs (2 endpoints)

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/api/health` | GET | Server health check |
| 2 | `/api/ee-status` | GET | Earth Engine initialization status |

### 2. NDVI & Satellite APIs (4 endpoints)

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 3 | `/api/ndvi` | GET | Get NDVI data (MODIS) |
| 4 | `/api/satellite` | GET | Get Sentinel-2 imagery |
| 5 | `/api/ndvi-legend` | GET | NDVI color legend |
| 6 | `/api/ndvi-color-visualization` | GET | NDVI visualization params |

### 3. Field Analysis APIs (10 endpoints)

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 7 | `/api/field-analysis` | POST | Analyze field NDVI |
| 8 | `/api/field-analysis/time-series` | POST | Generate time series |
| 9 | `/api/field-analysis/time-series-map` | POST | Generate time series maps |
| 10 | `/api/field-analysis/two-year-time-series` | POST | 2-year time series with images |
| 11 | `/api/field-analysis/field-image` | POST | Generate field image |
| 12 | `/api/field-analysis/ndvi-chart` | POST | NDVI chart (water/veg/soil) |
| 13 | `/api/field-analysis/update-field` | POST | Update field boundary |
| 14 | `/api/field-analysis/recalculate-ndvi` | POST | Recalculate NDVI |
| 15 | `/api/field-analysis/field-data/:fieldId` | GET | Get field data |
| 16 | `/api/field-analysis/change-history/:fieldId` | GET | Get change history |

### 4. Image Export & Storage APIs (5 endpoints)

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 17 | `/api/field-analysis/export-ndvi-image` | POST | Export NDVI image |
| 18 | `/api/field-analysis/stored-images` | GET | List stored images |
| 19 | `/api/field-analysis/stored-image/:filename` | GET | Get image metadata |
| 20 | `/api/field-analysis/stored-image/:filename` | DELETE | Delete image |
| 21 | `/api/field-analysis/storage-stats` | GET | Storage statistics |

### 5. Time Series Management APIs (4 endpoints)

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 22 | `/api/field-analysis/time-series/:seriesId` | GET | Get series metadata |
| 23 | `/api/field-analysis/time-series-list` | GET | List all series |
| 24 | `/api/field-analysis/time-series-stats` | GET | Series statistics |
| 25 | `/api/field-analysis/time-series/:seriesId` | DELETE | Delete series |

### 6. Flood Detection APIs (2 endpoints)

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 26 | `/api/field-analysis/flood-detection` | POST | Detect floods (SAR) |
| 27 | `/api/field-analysis/flood-time-series` | POST | Flood time series |

### 7. Zone Analysis APIs (3 endpoints)

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 28 | `/api/field-analysis/zone-image` | POST | Generate zone image |
| 29 | `/api/field-analysis/zone-image/:imageId` | GET | Get zone metadata |
| 30 | `/api/field-analysis/zone-images` | GET | List zone images |

### 8. Crop Analysis APIs (8 endpoints)

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 31 | `/api/crop-analysis/track-growth` | POST | Track crop growth stages |
| 32 | `/api/crop-analysis/classify-crop` | POST | Classify crop type |
| 33 | `/api/crop-analysis/performance` | POST | Crop performance analysis |
| 34 | `/api/crop-analysis/estimate-yield` | POST | Estimate crop yield |
| 35 | `/api/crop-analysis/detect-stress` | POST | Detect crop stress |
| 36 | `/api/crop-analysis/predict-yield` | POST | Predict final yield |
| 37 | `/api/crop-analysis/forecast-growth` | POST | Forecast growth |
| 38 | `/api/crop-analysis/crop-chart` | POST | Comprehensive crop chart |

---

## 🔑 Common Request Parameters

### Field Boundary (GeoJSON Polygon)
```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [longitude, latitude],
      [longitude, latitude],
      ...
    ]
  ]
}
```

### Date Format
- **Format:** `YYYY-MM-DD`
- **Example:** `2024-10-26`

### Field ID
- **Type:** String
- **Example:** `FIELD-001`, `NGR-KD-12345`

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## 🚀 Quick Start Examples

### 1. Check Server Status
```bash
curl http://localhost:3000/api/health
```

### 2. Analyze Field NDVI
```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.371, 23.841], [90.370, 23.840], [90.371, 23.841]]]
    },
    "fieldId": "FIELD-001",
    "startDate": "2024-10-01",
    "endDate": "2024-10-26"
  }'
```

### 3. Generate Time Series
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "FIELD-001",
    "startDate": "2024-01-01",
    "endDate": "2024-10-26",
    "intervalDays": 10
  }'
```

### 4. Detect Floods
```bash
curl -X POST http://localhost:3000/api/field-analysis/flood-detection \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "FIELD-001",
    "currentDate": "2024-10-26"
  }'
```

### 5. Track Crop Growth
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

---

## 📦 Available Resources

1. **Postman Collection:** `MASTER_POSTMAN_COLLECTION.json`
2. **cURL Examples:** `ALL_API_CURL_EXAMPLES.sh`
3. **Detailed Documentation:** `COMPLETE_API_DOCUMENTATION.md`
4. **Individual Collections:**
   - `postman/Crop_Analysis_API.postman_collection.json`
   - `postman/Flood_Detection_API.postman_collection.json`
   - `postman/NDVI_Chart_API.postman_collection.json`
   - `postman/Zone_Image_Generation_API.postman_collection.json`

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Test Specific Endpoint
```bash
# Make the script executable
chmod +x ALL_API_CURL_EXAMPLES.sh

# Run all tests
./ALL_API_CURL_EXAMPLES.sh
```

### Import to Postman
1. Open Postman
2. Click "Import"
3. Select `MASTER_POSTMAN_COLLECTION.json`
4. All 38 endpoints will be imported with examples

---

## 📈 Supported Crop Types

- Rice
- Wheat
- Corn (Maize)
- Soybean
- Cotton
- Sugarcane
- Vegetables
- Other

---

## 🌍 Satellite Data Sources

| Data Source | Resolution | Use Case |
|-------------|------------|----------|
| Sentinel-2 | 10m | NDVI, RGB imagery |
| Sentinel-1 SAR | 10m | Flood detection, all-weather |
| MODIS | 250m | Large-scale NDVI |

---

## ⚡ Performance Notes

- **Average Response Time:** 2-5 seconds (depends on date range)
- **Concurrent Requests:** Supported
- **Rate Limiting:** None (local development)
- **Caching:** Not implemented (real-time data)

---

## 🔧 Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found |
| 500 | Internal Server Error |
| 503 | Service Unavailable (EE not initialized) |

---

## 📞 Support

For issues or questions:
1. Check existing documentation in `/docs` folder
2. Review test files in `/tests` folder
3. Check server logs for detailed error messages

---

**Last Updated:** 2024-10-28  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

