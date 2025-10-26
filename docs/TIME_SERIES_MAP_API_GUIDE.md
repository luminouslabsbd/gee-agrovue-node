# 🗺️ NDVI Time Series Map API - Complete Guide

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** October 23, 2025  

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Endpoint](#api-endpoint)
3. [Request Format](#request-format)
4. [Response Format](#response-format)
5. [Examples](#examples)
6. [Map Visualization](#map-visualization)
7. [Error Handling](#error-handling)
8. [Performance](#performance)

---

## 🎯 Overview

The NDVI Time Series Map API generates NDVI maps and visualizations for field boundaries over time. It provides:

- ✅ NDVI maps for each time period
- ✅ Map tiles and visualization URLs
- ✅ NDVI statistics per date
- ✅ Visualization parameters (palette, min/max)
- ✅ Support for multiple intervals (5, 10, 15, 30 days)
- ✅ Historical and present data

---

## 📡 API Endpoint

### URL
```
POST http://localhost:3000/api/field-analysis/time-series-map
```

### Headers
```
Content-Type: application/json
```

---

## 📝 Request Format

### Required Fields
```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  },
  "fieldId": "NGR-KD-12345"
}
```

### Optional Fields
```json
{
  "startDate": "2025-01-01",      // Default: 1 year ago
  "endDate": "2025-12-31",        // Default: Today
  "intervalDays": 10              // Default: 10 (Options: 5, 10, 15, 30)
}
```

### Complete Request Example
```json
{
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
}
```

---

## 📊 Response Format

### Success Response
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
        "map_id": "abc123def456",
        "map_token": "xyz789uvw012",
        "map_url": "https://earthengine.googleapis.com/map/abc123def456/{z}/{x}/{y}?token=xyz789uvw012",
        "statistics": {
          "mean_ndvi": 0.25,
          "std_ndvi": 0.04,
          "min_ndvi": 0.13,
          "max_ndvi": 0.34
        },
        "visualization": {
          "palette": ["#d73027", "#fc8d59", "#fee090", "#e0f3f8", "#91bfdb", "#4575b4"],
          "min": -1,
          "max": 1
        }
      },
      ...
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

## 🔍 Examples

### Example 1: Monthly Monitoring (30-day interval)
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series-map \
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
    "intervalDays": 30
  }'
```

### Example 2: Weekly Monitoring (10-day interval)
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series-map \
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
    "intervalDays": 10
  }'
```

---

## 🗺️ Map Visualization

### Using Map URLs in Web Applications

#### Leaflet.js Example
```javascript
const map = L.map('map').setView([23.84, 90.37], 15);

// Add base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Add NDVI map layer
const ndviLayer = L.tileLayer(
  'https://earthengine.googleapis.com/map/{mapId}/{z}/{x}/{y}?token={token}',
  {
    mapId: 'abc123def456',
    token: 'xyz789uvw012',
    attribution: 'Google Earth Engine'
  }
).addTo(map);
```

#### Google Maps Example
```javascript
const map = new google.maps.Map(document.getElementById('map'), {
  zoom: 15,
  center: { lat: 23.84, lng: 90.37 }
});

const ndviLayer = new google.maps.ImageMapType({
  getTileUrl: function(coord, zoom) {
    return 'https://earthengine.googleapis.com/map/abc123def456/' + 
           zoom + '/' + coord.x + '/' + coord.y + '?token=xyz789uvw012';
  },
  tileSize: new google.maps.Size(256, 256),
  name: 'NDVI'
});

map.overlayMapTypes.push(ndviLayer);
```

---

## ❌ Error Handling

### Error 1: Missing Required Fields
```json
{
  "success": false,
  "error": "Missing required fields: fieldBoundary and fieldId"
}
```

### Error 2: Invalid Geometry Type
```json
{
  "success": false,
  "error": "Only Polygon geometries are supported"
}
```

### Error 3: No Data Available
```json
{
  "success": false,
  "error": "No Sentinel-2 imagery available for the specified date range"
}
```

### Error 4: Date Range Exceeds Limit
```json
{
  "success": false,
  "error": "Date range exceeds maximum of 730 days"
}
```

---

## ⚡ Performance

### Response Times
- **Single Map:** 30-60 seconds
- **Time Series (10 maps):** 5-10 minutes
- **Time Series (30 maps):** 15-30 minutes

### Optimization Tips
1. Use larger intervals (30 days) for faster results
2. Limit date range to 1 year
3. Use smaller field boundaries
4. Cache results for repeated queries

---

## 📚 Related Endpoints

- `POST /api/field-analysis` - Single-point NDVI analysis
- `POST /api/field-analysis/time-series` - Time series data (no maps)
- `GET /api/health` - Server health check

---

## 🎓 Use Cases

1. **Crop Monitoring** - Track vegetation health over growing season
2. **Yield Prediction** - Correlate NDVI trends with yield
3. **Stress Detection** - Identify problem areas early
4. **Historical Analysis** - Compare year-over-year trends
5. **Field Management** - Make data-driven decisions

---

**Status:** ✅ Production Ready  
**Support:** See documentation folder for more guides

