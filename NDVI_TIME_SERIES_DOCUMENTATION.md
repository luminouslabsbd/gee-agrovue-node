# NDVI Time Series API - Complete Documentation

## 📊 Overview

The NDVI Time Series API generates historical vegetation trends for crop health analysis and yield prediction. It provides configurable time intervals, comprehensive statistics, and trend analysis for farm field boundaries.

**Key Features:**
- ✅ Historical NDVI trends (up to 2 years)
- ✅ Configurable intervals (5, 10, 15, 30 days)
- ✅ Trend detection (improving, declining, stable)
- ✅ Statistical analysis (mean, std, min, max)
- ✅ Data quality assessment
- ✅ Cloud filtering (< 30%)

---

## 🎯 Objective

Generate NDVI time series for:
- **Crop Health Monitoring** - Track vegetation changes over time
- **Yield Prediction** - Correlate NDVI trends with crop yield
- **Anomaly Detection** - Identify stress periods
- **Management Decisions** - Data-driven irrigation and fertilization

---

## ⏱️ Interval Options

| Interval | Use Case | Data Points (1 year) | Pros | Cons |
|----------|----------|----------------------|------|------|
| **5 days** | Daily monitoring | 73 | High resolution | More cloud gaps |
| **10 days** | Weekly management | 37 | **Recommended** | Standard |
| **15 days** | Bi-weekly checks | 24 | Less computation | Lower resolution |
| **30 days** | Monthly trends | 12 | Minimal computation | Misses rapid changes |

**Recommendation:** 10 days (default) - aligns with Sentinel-2 revisit time

---

## 📡 Date Range Constraints

- **Maximum:** 2 years (730 days)
- **Minimum:** 1 day
- **Prevents:** Excessive computation and memory usage

---

## 🔌 API Endpoint

### Request

```
POST /api/field-analysis/time-series
Content-Type: application/json
```

### Request Body

```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  },
  "fieldId": "NGR-KD-12345",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "intervalDays": 10
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fieldBoundary` | GeoJSON | Yes | Polygon geometry of field |
| `fieldId` | String | Yes | Unique field identifier |
| `startDate` | String | No | Start date (YYYY-MM-DD), default: 1 year ago |
| `endDate` | String | No | End date (YYYY-MM-DD), default: today |
| `intervalDays` | Number | No | Interval in days (5, 10, 15, 30), default: 10 |

---

## 📤 Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "interval_days": 10,
    "data_points": 37,
    "time_series": [
      {
        "date": "2025-01-15",
        "ndvi_mean": 0.45,
        "ndvi_std": 0.08,
        "ndvi_min": 0.25,
        "ndvi_max": 0.65,
        "cloud_cover": 8.5,
        "data_quality": "Good"
      },
      ...
    ],
    "statistics": {
      "mean_ndvi": 0.58,
      "std_ndvi": 0.12,
      "min_ndvi": 0.35,
      "max_ndvi": 0.78,
      "data_points": 37,
      "date_range_days": 365
    },
    "trends": {
      "trend": "improving",
      "slope": 0.0015,
      "r_squared": 0.85,
      "interpretation": "Vegetation health is improving at a rate of 0.0015 NDVI units per interval"
    },
    "metadata": {
      "data_source": "Sentinel-2",
      "spatial_resolution": "10m",
      "cloud_filter": "< 30%",
      "generated_at": "2025-10-21T10:30:00.000Z"
    }
  },
  "message": "Time series generated successfully"
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": "Invalid interval. Must be one of: 5, 10, 15, 30"
}
```

---

## 🧪 cURL Examples

### Example 1: Basic Time Series (10-day interval)

```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.37110641598703, 23.841231509287553],
                       [90.37093743681908, 23.84014467798467],
                       [90.37123516201974, 23.84014713133873],
                       [90.3713531792164, 23.840186384997345],
                       [90.37110641598703, 23.841231509287553]]]
    },
    "fieldId": "NGR-KD-12345",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "intervalDays": 10
  }'
```

### Example 2: High-Resolution Monitoring (5-day interval)

```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "NGR-KD-12345",
    "startDate": "2025-06-01",
    "endDate": "2025-08-31",
    "intervalDays": 5
  }'
```

### Example 3: Monthly Trends (30-day interval)

```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "NGR-KD-12345",
    "intervalDays": 30
  }'
```

---

## 📊 Response Fields Explained

### Time Series Data Points

- **date**: Acquisition date of satellite image
- **ndvi_mean**: Average NDVI value for the field
- **ndvi_std**: Standard deviation (variability)
- **ndvi_min**: Minimum NDVI value
- **ndvi_max**: Maximum NDVI value
- **cloud_cover**: Cloud cover percentage
- **data_quality**: Good/Fair/Poor assessment

### Statistics

- **mean_ndvi**: Average NDVI across all time points
- **std_ndvi**: Overall variability
- **min_ndvi**: Lowest NDVI value in period
- **max_ndvi**: Highest NDVI value in period
- **data_points**: Number of observations
- **date_range_days**: Total days covered

### Trends

- **trend**: Direction (improving/declining/stable)
- **slope**: Rate of change per interval
- **r_squared**: Goodness of fit (0-1)
- **interpretation**: Human-readable trend description

---

## 🔍 Trend Interpretation

| Trend | Slope | Meaning | Action |
|-------|-------|---------|--------|
| **Improving** | > 0.01 | Vegetation health increasing | Continue current practices |
| **Stable** | -0.01 to 0.01 | No significant change | Monitor closely |
| **Declining** | < -0.01 | Vegetation health decreasing | Investigate stress factors |

---

## ⚠️ Error Codes

| Code | Error | Solution |
|------|-------|----------|
| 400 | Missing fieldBoundary/fieldId | Add required fields |
| 400 | Non-Polygon geometry | Use Polygon only |
| 500 | Invalid interval | Use 5, 10, 15, or 30 |
| 500 | Date range exceeds 2 years | Reduce date range |
| 500 | No imagery available | Try different date range |
| 503 | Earth Engine not initialized | Wait a moment and retry |

---

## 🎓 Use Cases

### 1. Crop Health Monitoring
```
Monitor field health throughout growing season
Interval: 10 days
Duration: Full season (120-150 days)
```

### 2. Stress Detection
```
Identify irrigation or pest stress early
Interval: 5 days
Duration: Critical growth period
```

### 3. Yield Prediction
```
Correlate NDVI trends with final yield
Interval: 10 days
Duration: Full season
```

### 4. Historical Analysis
```
Compare multiple seasons
Interval: 30 days
Duration: 2 years
```

---

## 🔧 Configuration

### Valid Intervals
```javascript
[5, 10, 15, 30] // days
```

### Default Values
```javascript
intervalDays: 10        // 10-day intervals
startDate: 1 year ago   // 365 days before today
endDate: today          // Current date
```

### Constraints
```javascript
MAX_DATE_RANGE_DAYS: 730  // 2 years maximum
CLOUD_FILTER: 30%         // Only images with < 30% cloud
SPATIAL_RESOLUTION: 10m   // Sentinel-2 resolution
```

---

## 📈 Data Quality

### Quality Assessment

- **Good**: Cloud cover < 15% AND std < 0.2
- **Fair**: Cloud cover 15-30% OR std 0.2-0.3
- **Poor**: Cloud cover > 30%

### Confidence Factors

- Cloud cover percentage
- Pixel count
- Data variability
- Temporal coverage

---

## 🚀 Integration Example

```javascript
// Node.js/Express
const response = await fetch('http://localhost:3000/api/field-analysis/time-series', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fieldBoundary: fieldGeoJSON,
    fieldId: 'NGR-KD-12345',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    intervalDays: 10
  })
});

const result = await response.json();
console.log(result.data.trends); // Trend analysis
console.log(result.data.statistics); // Overall statistics
```

---

## 📚 Related APIs

- **POST /api/field-analysis** - Single-point NDVI analysis
- **GET /api/health** - Server health check
- **GET /api/ee-status** - Earth Engine status

---

## ✅ Testing

```bash
# Run all tests
npm test

# Run time series tests only
npm test -- ndviTimeSeries

# Run with coverage
npm run test:coverage
```

**Test Results:** 66/66 passing ✅

---

## 📞 Support

For issues or questions:
1. Check error codes above
2. Review use cases
3. Verify date range (max 2 years)
4. Confirm interval is valid (5, 10, 15, 30)
5. Check Earth Engine status

---

**Version:** 1.0.0  
**Last Updated:** October 21, 2025  
**Status:** Production Ready ✅

