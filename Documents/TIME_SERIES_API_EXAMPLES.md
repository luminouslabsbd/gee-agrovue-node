# NDVI Time Series API - Complete Examples with Responses

## 📡 API Endpoint

```
POST /api/field-analysis/time-series
Content-Type: application/json
```

---

## 🔍 Example 1: High-Resolution Monitoring (5-Day Interval)

### Use Case
Monitor field during critical growth period with daily-like observations

### cURL Request
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

### API Response (200 OK)
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "start_date": "2025-06-01",
    "end_date": "2025-08-31",
    "interval_days": 5,
    "data_points": 18,
    "time_series": [
      {
        "date": "2025-06-05",
        "ndvi_mean": 0.42,
        "ndvi_std": 0.09,
        "ndvi_min": 0.20,
        "ndvi_max": 0.68,
        "cloud_cover": 12.3,
        "data_quality": "Good"
      },
      {
        "date": "2025-06-10",
        "ndvi_mean": 0.48,
        "ndvi_std": 0.08,
        "ndvi_min": 0.25,
        "ndvi_max": 0.72,
        "cloud_cover": 8.5,
        "data_quality": "Good"
      },
      {
        "date": "2025-06-15",
        "ndvi_mean": 0.52,
        "ndvi_std": 0.07,
        "ndvi_min": 0.30,
        "ndvi_max": 0.75,
        "cloud_cover": 5.2,
        "data_quality": "Good"
      },
      {
        "date": "2025-06-20",
        "ndvi_mean": 0.55,
        "ndvi_std": 0.06,
        "ndvi_min": 0.35,
        "ndvi_max": 0.78,
        "cloud_cover": 3.1,
        "data_quality": "Good"
      },
      {
        "date": "2025-06-25",
        "ndvi_mean": 0.58,
        "ndvi_std": 0.06,
        "ndvi_min": 0.38,
        "ndvi_max": 0.80,
        "cloud_cover": 2.8,
        "data_quality": "Good"
      },
      {
        "date": "2025-07-05",
        "ndvi_mean": 0.62,
        "ndvi_std": 0.05,
        "ndvi_min": 0.42,
        "ndvi_max": 0.82,
        "cloud_cover": 1.5,
        "data_quality": "Good"
      },
      {
        "date": "2025-07-15",
        "ndvi_mean": 0.65,
        "ndvi_std": 0.05,
        "ndvi_min": 0.45,
        "ndvi_max": 0.85,
        "cloud_cover": 2.2,
        "data_quality": "Good"
      },
      {
        "date": "2025-07-25",
        "ndvi_mean": 0.68,
        "ndvi_std": 0.04,
        "ndvi_min": 0.48,
        "ndvi_max": 0.87,
        "cloud_cover": 4.1,
        "data_quality": "Good"
      },
      {
        "date": "2025-08-05",
        "ndvi_mean": 0.70,
        "ndvi_std": 0.04,
        "ndvi_min": 0.50,
        "ndvi_max": 0.88,
        "cloud_cover": 6.3,
        "data_quality": "Good"
      },
      {
        "date": "2025-08-15",
        "ndvi_mean": 0.72,
        "ndvi_std": 0.04,
        "ndvi_min": 0.52,
        "ndvi_max": 0.89,
        "cloud_cover": 8.9,
        "data_quality": "Good"
      },
      {
        "date": "2025-08-25",
        "ndvi_mean": 0.70,
        "ndvi_std": 0.05,
        "ndvi_min": 0.50,
        "ndvi_max": 0.87,
        "cloud_cover": 11.2,
        "data_quality": "Good"
      }
    ],
    "statistics": {
      "mean_ndvi": 0.60,
      "std_ndvi": 0.10,
      "min_ndvi": 0.42,
      "max_ndvi": 0.72,
      "data_points": 11,
      "date_range_days": 91
    },
    "trends": {
      "trend": "improving",
      "slope": 0.0028,
      "r_squared": 0.92,
      "interpretation": "Vegetation health is improving at a rate of 0.0028 NDVI units per interval"
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

### Analysis
- **Trend:** ✅ **IMPROVING** - Vegetation health increasing throughout season
- **Slope:** 0.0028 - Strong positive growth rate
- **R-Squared:** 0.92 - Excellent fit (92% of variance explained)
- **Peak NDVI:** 0.72 on 2025-08-15 (peak vegetation)
- **Data Quality:** All observations "Good" (low cloud cover)
- **Duration:** 91 days (3 months)

---

## 📊 Example 2: Standard Monitoring (10-Day Interval)

### Use Case
Regular crop monitoring throughout growing season

### cURL Request
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

### API Response (200 OK)
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
      },
      {
        "date": "2025-02-05",
        "ndvi_mean": 0.30,
        "ndvi_std": 0.11,
        "ndvi_min": 0.10,
        "ndvi_max": 0.55,
        "cloud_cover": 15.2,
        "data_quality": "Good"
      },
      {
        "date": "2025-03-10",
        "ndvi_mean": 0.38,
        "ndvi_std": 0.10,
        "ndvi_min": 0.18,
        "ndvi_max": 0.62,
        "cloud_cover": 12.1,
        "data_quality": "Good"
      },
      {
        "date": "2025-04-15",
        "ndvi_mean": 0.48,
        "ndvi_std": 0.08,
        "ndvi_min": 0.28,
        "ndvi_max": 0.70,
        "cloud_cover": 8.3,
        "data_quality": "Good"
      },
      {
        "date": "2025-05-20",
        "ndvi_mean": 0.58,
        "ndvi_std": 0.07,
        "ndvi_min": 0.38,
        "ndvi_max": 0.78,
        "cloud_cover": 5.2,
        "data_quality": "Good"
      },
      {
        "date": "2025-06-25",
        "ndvi_mean": 0.65,
        "ndvi_std": 0.06,
        "ndvi_min": 0.45,
        "ndvi_max": 0.82,
        "cloud_cover": 3.1,
        "data_quality": "Good"
      },
      {
        "date": "2025-07-30",
        "ndvi_mean": 0.70,
        "ndvi_std": 0.05,
        "ndvi_min": 0.50,
        "ndvi_max": 0.85,
        "cloud_cover": 2.8,
        "data_quality": "Good"
      },
      {
        "date": "2025-08-25",
        "ndvi_mean": 0.72,
        "ndvi_std": 0.04,
        "ndvi_min": 0.52,
        "ndvi_max": 0.87,
        "cloud_cover": 4.5,
        "data_quality": "Good"
      },
      {
        "date": "2025-09-20",
        "ndvi_mean": 0.68,
        "ndvi_std": 0.05,
        "ndvi_min": 0.48,
        "ndvi_max": 0.84,
        "cloud_cover": 7.2,
        "data_quality": "Good"
      },
      {
        "date": "2025-10-15",
        "ndvi_mean": 0.55,
        "ndvi_std": 0.08,
        "ndvi_min": 0.35,
        "ndvi_max": 0.75,
        "cloud_cover": 10.1,
        "data_quality": "Good"
      },
      {
        "date": "2025-11-10",
        "ndvi_mean": 0.35,
        "ndvi_std": 0.10,
        "ndvi_min": 0.15,
        "ndvi_max": 0.58,
        "cloud_cover": 14.3,
        "data_quality": "Good"
      },
      {
        "date": "2025-12-20",
        "ndvi_mean": 0.22,
        "ndvi_std": 0.11,
        "ndvi_min": 0.02,
        "ndvi_max": 0.45,
        "cloud_cover": 20.5,
        "data_quality": "Fair"
      }
    ],
    "statistics": {
      "mean_ndvi": 0.50,
      "std_ndvi": 0.18,
      "min_ndvi": 0.22,
      "max_ndvi": 0.72,
      "data_points": 12,
      "date_range_days": 365
    },
    "trends": {
      "trend": "stable",
      "slope": -0.0004,
      "r_squared": 0.78,
      "interpretation": "Vegetation health is stable with minimal change"
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

### Analysis
- **Trend:** ✅ **STABLE** - Overall seasonal pattern (growth then decline)
- **Slope:** -0.0004 - Minimal overall change
- **R-Squared:** 0.78 - Good fit (78% of variance explained)
- **Peak NDVI:** 0.72 on 2025-08-25 (peak season)
- **Seasonal Pattern:** Clear growth (Jan-Aug) and decline (Sep-Dec)
- **Duration:** 365 days (full year)

---

## 📈 Example 3: Monthly Trends (30-Day Interval)

### Use Case
Long-term historical analysis and comparison

### cURL Request
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

### API Response (200 OK)
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "start_date": "2024-01-01",
    "end_date": "2025-12-31",
    "interval_days": 30,
    "data_points": 24,
    "time_series": [
      {
        "date": "2024-01-15",
        "ndvi_mean": 0.20,
        "ndvi_std": 0.13,
        "ndvi_min": 0.00,
        "ndvi_max": 0.48,
        "cloud_cover": 22.1,
        "data_quality": "Fair"
      },
      {
        "date": "2024-02-15",
        "ndvi_mean": 0.28,
        "ndvi_std": 0.12,
        "ndvi_min": 0.08,
        "ndvi_max": 0.55,
        "cloud_cover": 18.5,
        "data_quality": "Good"
      },
      {
        "date": "2024-03-20",
        "ndvi_mean": 0.40,
        "ndvi_std": 0.10,
        "ndvi_min": 0.20,
        "ndvi_max": 0.65,
        "cloud_cover": 14.2,
        "data_quality": "Good"
      },
      {
        "date": "2024-04-25",
        "ndvi_mean": 0.52,
        "ndvi_std": 0.08,
        "ndvi_min": 0.32,
        "ndvi_max": 0.75,
        "cloud_cover": 9.8,
        "data_quality": "Good"
      },
      {
        "date": "2024-05-30",
        "ndvi_mean": 0.62,
        "ndvi_std": 0.06,
        "ndvi_min": 0.42,
        "ndvi_max": 0.82,
        "cloud_cover": 5.3,
        "data_quality": "Good"
      },
      {
        "date": "2024-07-05",
        "ndvi_mean": 0.70,
        "ndvi_std": 0.05,
        "ndvi_min": 0.50,
        "ndvi_max": 0.87,
        "cloud_cover": 2.1,
        "data_quality": "Good"
      },
      {
        "date": "2024-08-10",
        "ndvi_mean": 0.75,
        "ndvi_std": 0.04,
        "ndvi_min": 0.55,
        "ndvi_max": 0.90,
        "cloud_cover": 1.8,
        "data_quality": "Good"
      },
      {
        "date": "2024-09-15",
        "ndvi_mean": 0.72,
        "ndvi_std": 0.05,
        "ndvi_min": 0.52,
        "ndvi_max": 0.88,
        "cloud_cover": 3.5,
        "data_quality": "Good"
      },
      {
        "date": "2024-10-20",
        "ndvi_mean": 0.58,
        "ndvi_std": 0.08,
        "ndvi_min": 0.38,
        "ndvi_max": 0.78,
        "cloud_cover": 8.2,
        "data_quality": "Good"
      },
      {
        "date": "2024-11-25",
        "ndvi_mean": 0.38,
        "ndvi_std": 0.11,
        "ndvi_min": 0.18,
        "ndvi_max": 0.62,
        "cloud_cover": 12.9,
        "data_quality": "Good"
      },
      {
        "date": "2024-12-30",
        "ndvi_mean": 0.22,
        "ndvi_std": 0.12,
        "ndvi_min": 0.02,
        "ndvi_max": 0.48,
        "cloud_cover": 19.3,
        "data_quality": "Fair"
      },
      {
        "date": "2025-01-30",
        "ndvi_mean": 0.25,
        "ndvi_std": 0.12,
        "ndvi_min": 0.05,
        "ndvi_max": 0.50,
        "cloud_cover": 18.5,
        "data_quality": "Fair"
      },
      {
        "date": "2025-03-05",
        "ndvi_mean": 0.38,
        "ndvi_std": 0.10,
        "ndvi_min": 0.18,
        "ndvi_max": 0.62,
        "cloud_cover": 12.1,
        "data_quality": "Good"
      },
      {
        "date": "2025-04-10",
        "ndvi_mean": 0.48,
        "ndvi_std": 0.08,
        "ndvi_min": 0.28,
        "ndvi_max": 0.70,
        "cloud_cover": 8.3,
        "data_quality": "Good"
      },
      {
        "date": "2025-05-15",
        "ndvi_mean": 0.58,
        "ndvi_std": 0.07,
        "ndvi_min": 0.38,
        "ndvi_max": 0.78,
        "cloud_cover": 5.2,
        "data_quality": "Good"
      },
      {
        "date": "2025-06-20",
        "ndvi_mean": 0.65,
        "ndvi_std": 0.06,
        "ndvi_min": 0.45,
        "ndvi_max": 0.82,
        "cloud_cover": 3.1,
        "data_quality": "Good"
      },
      {
        "date": "2025-07-25",
        "ndvi_mean": 0.70,
        "ndvi_std": 0.05,
        "ndvi_min": 0.50,
        "ndvi_max": 0.85,
        "cloud_cover": 2.8,
        "data_quality": "Good"
      },
      {
        "date": "2025-08-30",
        "ndvi_mean": 0.72,
        "ndvi_std": 0.04,
        "ndvi_min": 0.52,
        "ndvi_max": 0.87,
        "cloud_cover": 4.5,
        "data_quality": "Good"
      },
      {
        "date": "2025-10-05",
        "ndvi_mean": 0.55,
        "ndvi_std": 0.08,
        "ndvi_min": 0.35,
        "ndvi_max": 0.75,
        "cloud_cover": 10.1,
        "data_quality": "Good"
      },
      {
        "date": "2025-11-10",
        "ndvi_mean": 0.35,
        "ndvi_std": 0.10,
        "ndvi_min": 0.15,
        "ndvi_max": 0.58,
        "cloud_cover": 14.3,
        "data_quality": "Good"
      },
      {
        "date": "2025-12-15",
        "ndvi_mean": 0.22,
        "ndvi_std": 0.11,
        "ndvi_min": 0.02,
        "ndvi_max": 0.45,
        "cloud_cover": 20.5,
        "data_quality": "Fair"
      }
    ],
    "statistics": {
      "mean_ndvi": 0.50,
      "std_ndvi": 0.20,
      "min_ndvi": 0.20,
      "max_ndvi": 0.75,
      "data_points": 21,
      "date_range_days": 730
    },
    "trends": {
      "trend": "stable",
      "slope": -0.0002,
      "r_squared": 0.75,
      "interpretation": "Vegetation health is stable with minimal change over 2 years"
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

### Analysis
- **Trend:** ✅ **STABLE** - Consistent seasonal patterns across 2 years
- **Slope:** -0.0002 - Minimal long-term change
- **R-Squared:** 0.75 - Good fit (75% of variance explained)
- **Peak NDVI:** 0.75 on 2024-08-10 (peak season)
- **Comparison:** 2024 and 2025 show similar patterns
- **Duration:** 730 days (2 years maximum)

---

## ⚠️ Error Response Examples

### Error 1: Missing Required Field
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series \
  -H "Content-Type: application/json" \
  -d '{"fieldId": "NGR-KD-12345"}'
```

**Response (400 Bad Request):**
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

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Invalid interval. Must be one of: 5, 10, 15, 30"
}
```

### Error 3: Date Range Exceeds 2 Years
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

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Date range exceeds maximum of 730 days (2 years)"
}
```

---

## 📊 Response Field Explanations

### Time Series Data Point
```json
{
  "date": "2025-06-05",              // Acquisition date
  "ndvi_mean": 0.42,                 // Average NDVI value
  "ndvi_std": 0.09,                  // Standard deviation (variability)
  "ndvi_min": 0.20,                  // Minimum NDVI in field
  "ndvi_max": 0.68,                  // Maximum NDVI in field
  "cloud_cover": 12.3,               // Cloud cover percentage
  "data_quality": "Good"             // Quality assessment
}
```

### Statistics
```json
{
  "mean_ndvi": 0.60,                 // Average across all time points
  "std_ndvi": 0.10,                  // Overall variability
  "min_ndvi": 0.42,                  // Lowest value in period
  "max_ndvi": 0.72,                  // Highest value in period
  "data_points": 11,                 // Number of observations
  "date_range_days": 91              // Total days covered
}
```

### Trends
```json
{
  "trend": "improving",              // Direction: improving/stable/declining
  "slope": 0.0028,                   // Rate of change per interval
  "r_squared": 0.92,                 // Goodness of fit (0-1)
  "interpretation": "..."            // Human-readable description
}
```

---

## 🎯 Quick Reference

| Interval | Best For | Data Points/Year |
|----------|----------|------------------|
| 5 days | Daily monitoring | 73 |
| 10 days | Standard monitoring | 37 |
| 15 days | Bi-weekly checks | 24 |
| 30 days | Monthly trends | 12 |

---

**Version:** 1.0.0  
**Last Updated:** October 21, 2025  
**Status:** Production Ready ✅

