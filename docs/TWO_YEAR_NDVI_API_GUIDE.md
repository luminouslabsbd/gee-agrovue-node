# 🌾 2-Year NDVI Time Series API - Complete Guide

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** October 23, 2025  

---

## 📋 Overview

The 2-Year NDVI Time Series API provides comprehensive historical NDVI data for field analysis over a 2-year period. It includes:

- ✅ 2-year historical NDVI data
- ✅ Monthly and weekly intervals
- ✅ Field image generation with visualization URLs
- ✅ NDVI statistics and trends
- ✅ Field data update capabilities
- ✅ Change history tracking

---

## 🎯 API Endpoints

### 1. Generate 2-Year Time Series

**Endpoint:** `POST /api/field-analysis/two-year-time-series`

**Request:**
```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  },
  "fieldId": "NGR-KD-12345",
  "intervalType": "monthly"
}
```

**Parameters:**
- `fieldBoundary` (required) - GeoJSON Polygon
- `fieldId` (required) - Field identifier
- `intervalType` (optional) - "monthly" or "weekly" (default: "monthly")

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "start_date": "2023-10-26",
    "end_date": "2025-10-26",
    "interval_type": "monthly",
    "total_data_points": 25,
    "time_series": [
      {
        "date": "2023-10-26",
        "mean_ndvi": 0.35,
        "std_ndvi": 0.05,
        "min_ndvi": 0.15,
        "max_ndvi": 0.55,
        "map_id": "abc123",
        "map_token": "xyz789",
        "map_url": "https://earthengine.googleapis.com/map/abc123/{z}/{x}/{y}?token=xyz789",
        "image_available": true
      }
    ],
    "field_images": [...],
    "trends": {
      "trend": "improving",
      "change_percentage": "15.50",
      "first_value": "0.3000",
      "last_value": "0.3465"
    },
    "statistics": {
      "overall_mean_ndvi": 0.35,
      "overall_std_ndvi": 0.04,
      "min_ndvi": 0.15,
      "max_ndvi": 0.55
    }
  }
}
```

---

### 2. Generate Field Image

**Endpoint:** `POST /api/field-analysis/field-image`

**Request:**
```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  },
  "fieldId": "NGR-KD-12345",
  "date": "2025-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "date": "2025-01-15",
    "map_id": "abc123",
    "map_token": "xyz789",
    "map_url": "https://earthengine.googleapis.com/map/abc123/{z}/{x}/{y}?token=xyz789",
    "statistics": {
      "mean_ndvi": 0.35,
      "std_ndvi": 0.05,
      "min_ndvi": 0.15,
      "max_ndvi": 0.55
    },
    "visualization": {
      "palette": ["#d73027", "#fc8d59", "#fee090", "#e0f3f8", "#91bfdb", "#4575b4"],
      "min": -1,
      "max": 1
    }
  }
}
```

---

### 3. Update Field Boundary

**Endpoint:** `POST /api/field-analysis/update-field`

**Request:**
```json
{
  "fieldId": "NGR-KD-12345",
  "newBoundary": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  },
  "metadata": {
    "crop": "Rice",
    "season": "Monsoon"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "boundary": {...},
    "metadata": {...},
    "area_sqm": 50000,
    "perimeter_m": 1000,
    "updated_at": "2025-10-23T09:15:38.668Z"
  },
  "changes": {
    "area_changed": true,
    "old_area": 45000,
    "new_area": 50000
  }
}
```

---

### 4. Recalculate NDVI

**Endpoint:** `POST /api/field-analysis/recalculate-ndvi`

**Request:**
```json
{
  "fieldId": "NGR-KD-12345",
  "date": "2025-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "date": "2025-01-15",
    "map_id": "abc123",
    "map_token": "xyz789",
    "map_url": "https://earthengine.googleapis.com/map/abc123/{z}/{x}/{y}?token=xyz789",
    "statistics": {...}
  }
}
```

---

### 5. Get Field Data

**Endpoint:** `GET /api/field-analysis/field-data/:fieldId`

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "boundary": {...},
    "metadata": {...},
    "area_sqm": 50000,
    "perimeter_m": 1000,
    "updated_at": "2025-10-23T09:15:38.668Z"
  }
}
```

---

### 6. Get Change History

**Endpoint:** `GET /api/field-analysis/change-history/:fieldId`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-10-23T09:15:38.668Z",
      "change_type": "boundary_update",
      "old_data": {...},
      "new_data": {...}
    }
  ]
}
```

---

## 📊 Interval Types

| Interval | Data Points/Year | Use Case |
|----------|-----------------|----------|
| Monthly | 24 | Long-term trends |
| Weekly | 104 | Detailed monitoring |

---

## 🎨 NDVI Color Palette

| Color | NDVI Range | Meaning |
|-------|-----------|---------|
| #d73027 (Red) | -1 to 0 | Poor vegetation |
| #fc8d59 (Orange) | 0 to 0.2 | Sparse vegetation |
| #fee090 (Yellow) | 0.2 to 0.4 | Bare soil |
| #e0f3f8 (Light Blue) | 0.4 to 0.6 | Moderate vegetation |
| #91bfdb (Blue) | 0.6 to 0.8 | Good vegetation |
| #4575b4 (Dark Blue) | 0.8 to 1 | Excellent vegetation |

---

## 🚀 Quick Start

### Using Web Viewer
```bash
# 1. Start server
npm start

# 2. Open browser
http://localhost:3000/ndvi-two-year-viewer.html

# 3. Select interval type
# 4. Click "Generate 2-Year Analysis"
# 5. View results and timeline
```

### Using cURL

```bash
curl -X POST http://localhost:3000/api/field-analysis/two-year-time-series \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
    },
    "fieldId": "NGR-KD-12345",
    "intervalType": "monthly"
  }'
```

---

## 📈 Trend Analysis

The API automatically calculates trends:

- **Improving:** NDVI increased > 5%
- **Declining:** NDVI decreased > 5%
- **Stable:** NDVI change ≤ 5%

---

## 🔄 Data Update Workflow

1. **Update Field Boundary**
   ```bash
   POST /api/field-analysis/update-field
   ```

2. **Recalculate NDVI**
   ```bash
   POST /api/field-analysis/recalculate-ndvi
   ```

3. **View Change History**
   ```bash
   GET /api/field-analysis/change-history/:fieldId
   ```

---

## ✅ Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Missing required fields | Check request format |
| 404 Not Found | Field not found | Verify field ID |
| 503 Service Unavailable | Earth Engine not initialized | Wait and retry |

---

## 📊 Data Source

- **Satellite:** Sentinel-2
- **Resolution:** 10m
- **Cloud Filter:** < 30%
- **Update Frequency:** Every 5 days

---

## 🎯 Use Cases

1. **Crop Monitoring** - Track vegetation health over 2 years
2. **Yield Prediction** - Correlate NDVI with yield
3. **Stress Detection** - Identify problem areas early
4. **Historical Analysis** - Compare year-over-year trends
5. **Field Management** - Make data-driven decisions

---

## 📞 Support

For issues or questions, refer to:
- `docs/TIME_SERIES_MAP_API_GUIDE.md` - Map visualization guide
- `docs/HOW_TO_USE_MAP_URLS.md` - Map URL usage
- `docs/TROUBLESHOOTING_404_ERROR.md` - Troubleshooting

---

**Status:** ✅ Production Ready  
**Last Updated:** October 23, 2025

