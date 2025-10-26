# Field Analysis API Documentation

## Overview

The Field Analysis API provides comprehensive NDVI (Normalized Difference Vegetation Index) analysis for farm field boundaries using Google Earth Engine and Sentinel-2 satellite imagery.

## Base URL

```
http://localhost:3000
```

## Endpoints

### POST /api/field-analysis

Analyze NDVI data for a farm field boundary and return comprehensive statistics, quality metrics, and crop health interpretation.

#### Request

**Method:** `POST`

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [
      [
        [longitude, latitude],
        [longitude, latitude],
        ...
      ]
    ]
  },
  "fieldId": "NGR-KD-12345",
  "startDate": "2025-10-01",
  "endDate": "2025-10-15"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fieldBoundary` | GeoJSON Polygon | Yes | Field boundary as GeoJSON Polygon geometry |
| `fieldId` | String | Yes | Unique field identifier |
| `startDate` | String (YYYY-MM-DD) | No | Start date for analysis (default: 30 days ago) |
| `endDate` | String (YYYY-MM-DD) | No | End date for analysis (default: today) |

#### Response

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "date": "2025-10-21",
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
      "acquisition_date": "2025-10-14",
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

**Response Fields:**

- **field_id**: The field identifier provided in the request
- **date**: Analysis date (ISO 8601 format)
- **ndvi**: NDVI statistics
  - **mean**: Average NDVI value
  - **std**: Standard deviation
  - **min**: Minimum NDVI value
  - **max**: Maximum NDVI value
  - **median**: Median NDVI value
  - **p25**: 25th percentile
  - **p75**: 75th percentile
- **quality**: Data quality metrics
  - **cloud_cover**: Cloud cover percentage
  - **pixel_count**: Number of valid pixels analyzed
  - **data_source**: Satellite data source (Sentinel-2)
  - **acquisition_date**: Date of satellite image acquisition
  - **confidence**: Confidence score (0-1)
- **interpretation**: Crop health interpretation
  - **health_status**: Health status (Poor, Fair, Good, Healthy, Very Healthy)
  - **health_score**: Health score (0-100)
  - **alerts**: Array of alert messages
- **hectares**: Field area in hectares

#### Error Responses

**400 Bad Request** - Missing required fields:
```json
{
  "success": false,
  "error": "Missing required fields: fieldBoundary and fieldId"
}
```

**400 Bad Request** - Invalid geometry type:
```json
{
  "success": false,
  "error": "Only Polygon geometries are supported"
}
```

**503 Service Unavailable** - Earth Engine not initialized:
```json
{
  "success": false,
  "error": "Earth Engine not initialized yet. Please try again in a moment."
}
```

**500 Internal Server Error** - Analysis failed:
```json
{
  "success": false,
  "error": "Field analysis failed: [error details]"
}
```

## cURL Examples

### Basic Request

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
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
    "fieldId": "NGR-KD-12345"
  }'
```

### Request with Date Range

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
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
    "fieldId": "NGR-KD-12345",
    "startDate": "2025-10-01",
    "endDate": "2025-10-15"
  }'
```

### Pretty Print Response

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{...}' | jq '.'
```

## Health Status Interpretation

| NDVI Range | Status | Score | Meaning |
|-----------|--------|-------|---------|
| < 0.30 | Poor | 20 | Bare soil or severe crop stress |
| 0.30 - 0.40 | Fair | 40 | Low vegetation, monitor closely |
| 0.40 - 0.50 | Good | 60 | Moderate vegetation growth |
| 0.50 - 0.70 | Healthy | 85 | Good vegetation health |
| > 0.70 | Very Healthy | 95 | Excellent vegetation health |

## Data Quality Metrics

- **Cloud Cover**: Percentage of cloud coverage in the satellite image (0-100%)
- **Pixel Count**: Number of valid pixels analyzed in the field
- **Confidence**: Overall confidence score (0-1) based on cloud cover and pixel count
- **Data Source**: Always "Sentinel-2" for this API
- **Acquisition Date**: Date when the satellite image was captured

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

## Implementation Notes

### GEE Engineer Perspective

1. **Data Source**: Sentinel-2 Level 2A (Surface Reflectance)
2. **NDVI Calculation**: (B8 - B4) / (B8 + B4)
   - B8: Near-Infrared (NIR) band
   - B4: Red band
3. **Cloud Filtering**: Images with > 30% cloud cover are filtered out
4. **Spatial Resolution**: 10 meters per pixel
5. **Statistics**: Calculated using Earth Engine reducers for efficiency

### SR Software Engineer Perspective

1. **Architecture**: Service-based design with separation of concerns
2. **Error Handling**: Comprehensive error handling with meaningful messages
3. **Validation**: Input validation for geometry type and required fields
4. **Performance**: Asynchronous operations with proper error propagation
5. **Testing**: Unit tests and integration tests with mocked Earth Engine
6. **Scalability**: Stateless API design for horizontal scaling

## Future Enhancements

- [ ] Batch analysis for multiple fields
- [ ] Historical trend analysis
- [ ] Anomaly detection
- [ ] Predictive analytics
- [ ] Export to various formats (CSV, GeoJSON, etc.)
- [ ] Webhook notifications for alerts
- [ ] Caching for repeated queries

