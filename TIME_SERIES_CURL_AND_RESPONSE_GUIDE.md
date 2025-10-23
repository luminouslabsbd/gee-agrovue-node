# NDVI Time Series API - cURL Requests & Response Guide

## 🚀 Quick Start

### API Endpoint
```
POST http://localhost:3000/api/field-analysis/time-series
Content-Type: application/json
```

---

## 📋 Request Template

```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[lon, lat], [lon, lat], ...]]
    },
    "fieldId": "FIELD-ID",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "intervalDays": 10
  }'
```

---

## 🎯 Three Real-World Examples

### Example 1: High-Resolution Monitoring (5-Day)

**Purpose:** Daily-like monitoring during critical growth period

**cURL Command:**
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
    "startDate": "2025-06-01",
    "endDate": "2025-08-31",
    "intervalDays": 5
  }'
```

**Response Summary:**
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "interval_days": 5,
    "data_points": 11,
    "statistics": {
      "mean_ndvi": 0.60,
      "std_ndvi": 0.10,
      "min_ndvi": 0.42,
      "max_ndvi": 0.72
    },
    "trends": {
      "trend": "improving",
      "slope": 0.0028,
      "r_squared": 0.92,
      "interpretation": "Vegetation health is improving at 0.0028 NDVI units per interval"
    }
  }
}
```

**Key Insights:**
- ✅ **Trend:** IMPROVING (slope 0.0028 > 0.01)
- ✅ **Confidence:** Excellent (R² = 0.92)
- ✅ **Peak:** 0.72 NDVI (healthy)
- ✅ **Quality:** All observations "Good"

---

### Example 2: Standard Monitoring (10-Day)

**Purpose:** Regular crop monitoring throughout season

**cURL Command:**
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

**Response Summary:**
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "interval_days": 10,
    "data_points": 37,
    "statistics": {
      "mean_ndvi": 0.50,
      "std_ndvi": 0.18,
      "min_ndvi": 0.22,
      "max_ndvi": 0.72
    },
    "trends": {
      "trend": "stable",
      "slope": -0.0004,
      "r_squared": 0.78,
      "interpretation": "Vegetation health is stable with minimal change"
    }
  }
}
```

**Key Insights:**
- ✅ **Trend:** STABLE (slope -0.0004 within ±0.01)
- ✅ **Confidence:** Good (R² = 0.78)
- ✅ **Pattern:** Clear seasonal cycle
- ✅ **Peak:** 0.72 NDVI (August)

---

### Example 3: Historical Analysis (30-Day)

**Purpose:** Multi-year comparison and long-term trends

**cURL Command:**
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
    "startDate": "2024-01-01",
    "endDate": "2025-12-31",
    "intervalDays": 30
  }'
```

**Response Summary:**
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "interval_days": 30,
    "data_points": 24,
    "statistics": {
      "mean_ndvi": 0.50,
      "std_ndvi": 0.20,
      "min_ndvi": 0.20,
      "max_ndvi": 0.75
    },
    "trends": {
      "trend": "stable",
      "slope": -0.0002,
      "r_squared": 0.75,
      "interpretation": "Vegetation health is stable with minimal change over 2 years"
    }
  }
}
```

**Key Insights:**
- ✅ **Trend:** STABLE (slope -0.0002 within ±0.01)
- ✅ **Confidence:** Good (R² = 0.75)
- ✅ **Duration:** 2 years (maximum)
- ✅ **Consistency:** Similar patterns both years

---

## 📊 Response Structure Breakdown

### Complete Response Format
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
        "ndvi_mean": 0.25,
        "ndvi_std": 0.12,
        "ndvi_min": 0.05,
        "ndvi_max": 0.50,
        "cloud_cover": 18.5,
        "data_quality": "Fair"
      }
    ],
    
    "statistics": {
      "mean_ndvi": 0.50,
      "std_ndvi": 0.18,
      "min_ndvi": 0.22,
      "max_ndvi": 0.72,
      "data_points": 37,
      "date_range_days": 365
    },
    
    "trends": {
      "trend": "stable",
      "slope": -0.0004,
      "r_squared": 0.78,
      "interpretation": "Vegetation health is stable..."
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

---

## 🔍 Field-by-Field Explanation

### Time Series Data Point
```json
{
  "date": "2025-01-15",        // Satellite image acquisition date
  "ndvi_mean": 0.25,           // Average NDVI (0-1 scale)
  "ndvi_std": 0.12,            // Variability within field
  "ndvi_min": 0.05,            // Lowest NDVI (stressed areas)
  "ndvi_max": 0.50,            // Highest NDVI (best areas)
  "cloud_cover": 18.5,         // Cloud percentage (0-100)
  "data_quality": "Fair"       // Good/Fair/Poor assessment
}
```

### Statistics Object
```json
{
  "mean_ndvi": 0.50,           // Average across all time points
  "std_ndvi": 0.18,            // Overall variability
  "min_ndvi": 0.22,            // Lowest value in period
  "max_ndvi": 0.72,            // Highest value in period
  "data_points": 37,           // Number of observations
  "date_range_days": 365       // Total days covered
}
```

### Trends Object
```json
{
  "trend": "stable",           // Direction: improving/stable/declining
  "slope": -0.0004,            // Rate of change per interval
  "r_squared": 0.78,           // Goodness of fit (0-1)
  "interpretation": "..."      // Human-readable description
}
```

---

## ⚠️ Error Responses

### Error 1: Missing Field
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{"fieldId": "NGR-KD-12345"}'
```

**Response (400):**
```json
{
  "success": false,
  "error": "Missing required fields: fieldBoundary and fieldId"
}
```

### Error 2: Invalid Interval
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "NGR-KD-12345",
    "intervalDays": 7
  }'
```

**Response (500):**
```json
{
  "success": false,
  "error": "Invalid interval. Must be one of: 5, 10, 15, 30"
}
```

### Error 3: Date Range Too Long
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "NGR-KD-12345",
    "startDate": "2023-01-01",
    "endDate": "2025-12-31",
    "intervalDays": 10
  }'
```

**Response (500):**
```json
{
  "success": false,
  "error": "Date range exceeds maximum of 730 days (2 years)"
}
```

---

## 🎯 Trend Interpretation Quick Guide

| Trend | Slope | Meaning | Action |
|-------|-------|---------|--------|
| **Improving** | > 0.01 | Health increasing | ✅ Continue practices |
| **Stable** | -0.01 to 0.01 | No change | ⚠️ Monitor closely |
| **Declining** | < -0.01 | Health decreasing | 🔴 Investigate |

---

## 📈 NDVI Value Interpretation

| NDVI Range | Vegetation | Interpretation |
|-----------|-----------|-----------------|
| 0.0-0.2 | Bare soil | No vegetation |
| 0.2-0.4 | Sparse | Poor health |
| 0.4-0.6 | Moderate | Fair health |
| 0.6-0.8 | Dense | Good health |
| 0.8-1.0 | Very dense | Excellent health |

---

## 🔧 Common Use Cases

### Use Case 1: Monitor Crop Growth
```bash
# 10-day intervals for full season
intervalDays: 10
startDate: "2025-06-01"
endDate: "2025-09-30"
```

### Use Case 2: Detect Stress Early
```bash
# 5-day intervals for high resolution
intervalDays: 5
startDate: "2025-07-01"
endDate: "2025-07-31"
```

### Use Case 3: Compare Years
```bash
# 30-day intervals for 2-year comparison
intervalDays: 30
startDate: "2024-01-01"
endDate: "2025-12-31"
```

---

## ✅ Testing Checklist

- [ ] Server running on port 3000
- [ ] cURL command formatted correctly
- [ ] JSON is valid
- [ ] Field boundary is Polygon type
- [ ] Interval is 5, 10, 15, or 30
- [ ] Date range < 730 days
- [ ] Response received successfully
- [ ] All data points have quality assessment

---

**Version:** 1.0.0  
**Last Updated:** October 21, 2025  
**Status:** Production Ready ✅

