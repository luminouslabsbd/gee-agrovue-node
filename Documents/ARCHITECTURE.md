# Field Analysis API - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  (cURL, JavaScript, Python, Postman, etc.)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP POST
                         │ /api/field-analysis
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS SERVER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Middleware Layer                                         │   │
│  │ - CORS                                                   │   │
│  │ - JSON Parser                                            │   │
│  │ - Static Files                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Endpoint: POST /api/field-analysis                  │   │
│  │ - Input Validation                                       │   │
│  │ - Error Handling                                         │   │
│  │ - Request Routing                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Calls
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              FIELD ANALYSIS SERVICE LAYER                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ FieldAnalysisService                                     │   │
│  │ - analyzeFieldNDVI()                                     │   │
│  │ - _geoJsonToEEGeometry()                                 │   │
│  │ - _extractNDVIStats()                                    │   │
│  │ - _interpretHealth()                                     │   │
│  │ - _calculateConfidence()                                 │   │
│  │ - _calculateHectares()                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Uses
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           GOOGLE EARTH ENGINE API LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Earth Engine Client Library (@google/earthengine)        │   │
│  │ - Geometry Operations                                    │   │
│  │ - Image Collections                                      │   │
│  │ - Reducers & Statistics                                  │   │
│  │ - Filters                                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Queries
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SATELLITE DATA SOURCES                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Sentinel-2 Level 2A (Surface Reflectance)               │   │
│  │ - Collection: COPERNICUS/S2_SR                           │   │
│  │ - Bands: B4 (Red), B8 (NIR)                              │   │
│  │ - Resolution: 10 meters                                  │   │
│  │ - Cloud Filter: < 30%                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────┐
│  GeoJSON Polygon    │
│  (Field Boundary)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Input Validation                        │
│ - Check geometry type (Polygon)         │
│ - Check required fields                 │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Convert to EE Geometry                  │
│ GeoJSON → EE.Geometry.Polygon()         │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Query Sentinel-2 Collection             │
│ - Filter by bounds                      │
│ - Filter by date range                  │
│ - Filter by cloud cover (< 30%)         │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Calculate NDVI                          │
│ NDVI = (B8 - B4) / (B8 + B4)            │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Compute Statistics                      │
│ - Mean, Std Dev, Min, Max               │
│ - Median, P25, P75                      │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Extract Quality Metrics                 │
│ - Cloud cover %                         │
│ - Pixel count                           │
│ - Confidence score                      │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Interpret Health Status                 │
│ - Map NDVI to health status             │
│ - Calculate health score                │
│ - Generate alerts                       │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Calculate Area                          │
│ - Geometry area in m²                   │
│ - Convert to hectares                   │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Return Analysis Result                  │
│ - NDVI statistics                       │
│ - Quality metrics                       │
│ - Health interpretation                 │
│ - Field area                            │
└─────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Express Server                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ POST /api/field-analysis                               │ │
│  │                                                        │ │
│  │ 1. Validate input                                      │ │
│  │ 2. Check EE initialization                            │ │
│  │ 3. Call FieldAnalysisService.analyzeFieldNDVI()       │ │
│  │ 4. Return response                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          │ calls                             │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FieldAnalysisService                                   │ │
│  │                                                        │ │
│  │ analyzeFieldNDVI(boundary, fieldId, start, end)       │ │
│  │   ├─ _geoJsonToEEGeometry()                           │ │
│  │   ├─ Query Sentinel-2 collection                      │ │
│  │   ├─ Calculate NDVI                                   │ │
│  │   ├─ _extractNDVIStats()                              │ │
│  │   ├─ _interpretHealth()                               │ │
│  │   ├─ _calculateConfidence()                           │ │
│  │   ├─ _calculateHectares()                             │ │
│  │   └─ Return analysis result                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          │ uses                              │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Earth Engine Client                                    │ │
│  │                                                        │ │
│  │ - Geometry operations                                 │ │
│  │ - Image collection queries                            │ │
│  │ - Reducer operations                                  │ │
│  │ - Filter operations                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Class Diagram

```
┌─────────────────────────────────────────┐
│      FieldAnalysisService               │
├─────────────────────────────────────────┤
│ - ee: EarthEngine                       │
├─────────────────────────────────────────┤
│ + analyzeFieldNDVI()                    │
│ - _geoJsonToEEGeometry()                │
│ - _extractNDVIStats()                   │
│ - _interpretHealth()                    │
│ - _calculateConfidence()                │
│ - _calculateHectares()                  │
└─────────────────────────────────────────┘
           │
           │ uses
           ▼
┌─────────────────────────────────────────┐
│      Earth Engine API                   │
├─────────────────────────────────────────┤
│ + Geometry                              │
│ + ImageCollection                       │
│ + Filter                                │
│ + Reducer                               │
└─────────────────────────────────────────┘
```

## Request/Response Flow

```
CLIENT REQUEST
    │
    ├─ Method: POST
    ├─ URL: /api/field-analysis
    ├─ Headers: Content-Type: application/json
    └─ Body: {fieldBoundary, fieldId, startDate, endDate}
    │
    ▼
SERVER PROCESSING
    │
    ├─ Validate input
    ├─ Check EE initialization
    ├─ Call FieldAnalysisService
    │   ├─ Convert GeoJSON to EE geometry
    │   ├─ Query Sentinel-2 imagery
    │   ├─ Calculate NDVI
    │   ├─ Compute statistics
    │   ├─ Extract quality metrics
    │   ├─ Interpret health
    │   └─ Calculate area
    └─ Format response
    │
    ▼
CLIENT RESPONSE
    │
    ├─ Status: 200 OK
    ├─ Headers: Content-Type: application/json
    └─ Body: {success, data, message}
        ├─ data.field_id
        ├─ data.date
        ├─ data.ndvi {mean, std, min, max, median, p25, p75}
        ├─ data.quality {cloud_cover, pixel_count, data_source, acquisition_date, confidence}
        ├─ data.interpretation {health_status, health_score, alerts}
        └─ data.hectares
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │Server 1│  │Server 2│  │Server 3│
    │:3000   │  │:3001   │  │:3002   │
    └────────┘  └────────┘  └────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Shared Credentials    │
        │  (credentials.json)    │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Google Earth Engine   │
        │  API                   │
        └────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| GEE Client | @google/earthengine |
| Testing | Jest, Supertest |
| Satellite Data | Sentinel-2 |
| Authentication | Service Account |

## Performance Characteristics

- **Response Time**: 5-15 seconds
- **Concurrent Requests**: Unlimited (stateless)
- **Data Freshness**: ~5 days (Sentinel-2 revisit time)
- **Spatial Resolution**: 10 meters
- **Scalability**: Horizontal (stateless design)

## Security Architecture

```
┌─────────────────────────────────────────┐
│ Input Validation Layer                  │
│ - Geometry type check                   │
│ - Required field validation             │
│ - Type checking                         │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Authentication Layer                    │
│ - Service account credentials           │
│ - EE API authentication                 │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Authorization Layer                     │
│ - EE project access                     │
│ - Data access control                   │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Error Handling Layer                    │
│ - Safe error messages                   │
│ - No sensitive data exposure            │
└─────────────────────────────────────────┘
```

## Scalability Strategy

1. **Stateless Design**: Each request is independent
2. **Horizontal Scaling**: Add more servers behind load balancer
3. **Caching**: Implement Redis for repeated queries
4. **Rate Limiting**: Prevent abuse
5. **Async Processing**: Non-blocking operations
6. **Connection Pooling**: Efficient resource usage

