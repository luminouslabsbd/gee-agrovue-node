# NDVI Chart API - Complete Documentation

## 🎯 Overview

The NDVI Chart API generates comprehensive time series charts showing **water, vegetation, and soil analysis** for agricultural fields using Google Earth Engine and Sentinel-2 satellite imagery.

### Key Features

- ✅ **Time Series NDVI Data** - Historical vegetation trends
- ✅ **Water Detection** - Identify water bodies (NDVI < 0)
- ✅ **Vegetation Analysis** - Classify vegetation health (NDVI 0.2 - 1.0)
- ✅ **Soil Detection** - Bare soil identification (NDVI 0 - 0.2)
- ✅ **Chart-Ready Data** - Direct integration with Chart.js
- ✅ **Statistical Analysis** - Mean, std, min, max, median
- ✅ **Trend Detection** - Improving, declining, or stable
- ✅ **Area Percentages** - Water, vegetation, and soil coverage
- ✅ **Cloud Masking** - Clean data with SCL-based filtering

---

## 📡 API Endpoint

### Generate NDVI Chart

```
POST /api/field-analysis/ndvi-chart
```

**Content-Type:** `application/json`

---

## 📥 Request Format

### Request Body

```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  },
  "fieldId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "interval": "daily|weekly|monthly|quarterly"
}
```

### Parameters

| Parameter       | Type    | Required | Description                      |
| --------------- | ------- | -------- | -------------------------------- |
| `fieldBoundary` | GeoJSON | Yes      | Field boundary polygon           |
| `fieldId`       | String  | Yes      | Unique field identifier          |
| `startDate`     | String  | Yes      | Start date (YYYY-MM-DD)          |
| `endDate`       | String  | Yes      | End date (YYYY-MM-DD)            |
| `interval`      | String  | No       | Time interval (default: monthly) |

### Interval Options

| Interval    | Days | Use Case                  |
| ----------- | ---- | ------------------------- |
| `daily`     | 1    | High-frequency monitoring |
| `weekly`    | 7    | Detailed analysis         |
| `biweekly`  | 14   | Regular monitoring        |
| `monthly`   | 30   | Standard analysis         |
| `quarterly` | 90   | Long-term trends          |

---

## 📤 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "field_id": "string",
  "date_range": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD",
    "interval": "string",
    "interval_days": number
  },
  "chart_data": {
    "labels": ["date1", "date2", ...],
    "datasets": [
      {
        "label": "NDVI",
        "data": [0.4, 0.5, ...],
        "borderColor": "#4CAF50",
        "backgroundColor": "rgba(76, 175, 80, 0.1)",
        "fill": true,
        "tension": 0.4
      },
      {
        "label": "Water %",
        "data": [0, 0, ...],
        "borderColor": "#0000FF",
        "yAxisID": "percentage"
      },
      {
        "label": "Vegetation %",
        "data": [75, 80, ...],
        "borderColor": "#32CD32",
        "yAxisID": "percentage"
      },
      {
        "label": "Soil %",
        "data": [25, 20, ...],
        "borderColor": "#8B4513",
        "yAxisID": "percentage"
      }
    ]
  },
  "time_series": [
    {
      "date": "YYYY-MM-DD",
      "ndvi": 0.4015,
      "ndvi_std": 0.0699,
      "ndvi_min": 0.3149,
      "ndvi_max": 0.5428,
      "image_count": 4,
      "classification": "moderate_vegetation",
      "classification_label": "Moderate Vegetation",
      "water_percentage": 0,
      "vegetation_percentage": 75,
      "soil_percentage": 25,
      "color": "#90EE90"
    }
  ],
  "statistics": {
    "ndvi": {
      "mean": 0.4015,
      "std": 0.0699,
      "min": 0.3149,
      "max": 0.5428,
      "median": 0.3843
    },
    "water": {
      "mean_percentage": 0,
      "max_percentage": 0,
      "occurrences": 0
    },
    "vegetation": {
      "mean_percentage": 60,
      "max_percentage": 75,
      "min_percentage": 50
    },
    "soil": {
      "mean_percentage": 40,
      "max_percentage": 50,
      "min_percentage": 25
    },
    "trend": "improving"
  },
  "area_analysis": {
    "water": {
      "pixels": 0,
      "percentage": 0,
      "area_hectares": 0
    },
    "soil": {
      "pixels": 0,
      "percentage": 0,
      "area_hectares": 0
    },
    "vegetation": {
      "pixels": 692.37,
      "percentage": 100,
      "area_hectares": 6.9237
    },
    "total_pixels": 692.37,
    "total_area_hectares": 6.9237
  },
  "chart_config": {
    "type": "line",
    "options": { ... },
    "color_legend": [
      {
        "category": "water",
        "label": "Water",
        "color": "#0000FF",
        "range": "-1 to 0"
      },
      {
        "category": "soil",
        "label": "Bare Soil",
        "color": "#8B4513",
        "range": "0 to 0.2"
      },
      {
        "category": "sparse_veg",
        "label": "Sparse Vegetation",
        "color": "#FFD700",
        "range": "0.2 to 0.4"
      },
      {
        "category": "moderate_veg",
        "label": "Moderate Vegetation",
        "color": "#90EE90",
        "range": "0.4 to 0.6"
      },
      {
        "category": "good_veg",
        "label": "Good Vegetation",
        "color": "#32CD32",
        "range": "0.6 to 0.8"
      },
      {
        "category": "excellent_veg",
        "label": "Excellent Vegetation",
        "color": "#006400",
        "range": "0.8 to 1"
      }
    ]
  },
  "metadata": {
    "data_source": "Sentinel-2",
    "spatial_resolution": "10m",
    "cloud_filter": "< 30%",
    "generated_at": "2025-10-26T09:35:05.606Z",
    "total_data_points": 10
  }
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🎨 Classification Thresholds

| Category      | NDVI Range | Color                 | Label                |
| ------------- | ---------- | --------------------- | -------------------- |
| Water         | -1 to 0    | #0000FF (Blue)        | Water Body           |
| Soil          | 0 to 0.2   | #8B4513 (Brown)       | Bare Soil            |
| Sparse Veg    | 0.2 to 0.4 | #FFD700 (Gold)        | Sparse Vegetation    |
| Moderate Veg  | 0.4 to 0.6 | #90EE90 (Light Green) | Moderate Vegetation  |
| Good Veg      | 0.6 to 0.8 | #32CD32 (Green)       | Good Vegetation      |
| Excellent Veg | 0.8 to 1.0 | #006400 (Dark Green)  | Excellent Vegetation |

---

## 📊 NDVI Formula

```
NDVI = (NIR - Red) / (NIR + Red)
```

Where:

- **NIR** = Near-Infrared band (B8 in Sentinel-2)
- **Red** = Red band (B4 in Sentinel-2)

---

## 🔧 Technical Details

### Data Source

- **Satellite**: Sentinel-2 Level 2A Surface Reflectance
- **Dataset**: `COPERNICUS/S2_SR`
- **Spatial Resolution**: 10 meters
- **Temporal Resolution**: 5 days (revisit time)

### Cloud Filtering

- **Method**: Scene Classification Layer (SCL) band
- **Threshold**: < 30% cloud cover
- **Masked Classes**: Clouds, cloud shadows, snow/ice
- **Kept Classes**: Vegetation, non-vegetated, water, unclassified

### Processing

- **Scale**: 10 meters
- **Reducer**: Mean, StdDev, Min, Max
- **Max Pixels**: 1e9

---

## 💻 cURL Examples

### Example 1: Monthly NDVI Chart (10 months)

```bash
curl -X POST http://localhost:3000/api/field-analysis/ndvi-chart \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [
        [
          [12.633435130119326, 42.6498850799555],
          [12.633585333824158, 42.64952208649428],
          [12.633628249168396, 42.64908806979262],
          [12.633499503135681, 42.64897759233047],
          [12.63356387615204, 42.64877241938018],
          [12.63375699520111, 42.648488332639424],
          [12.633907198905947, 42.64795961219534],
          [12.634164690971376, 42.64786491552187],
          [12.634711861610413, 42.64787280691682],
          [12.635602355003359, 42.64807009146552],
          [12.63606369495392, 42.64803063460584],
          [12.636653780937197, 42.64803063460584],
          [12.63683617115021, 42.64825159269771],
          [12.636954188346865, 42.64829894075813],
          [12.636353373527529, 42.64893024478662],
          [12.63555943965912, 42.64979038621333],
          [12.635216116905214, 42.65020072472159],
          [12.634583115577698, 42.65020072472159],
          [12.63383209705353, 42.65014548700316],
          [12.633435130119326, 42.6498850799555]
        ]
      ]
    },
    "fieldId": "ITALY-FIELD-001",
    "startDate": "2024-01-01",
    "endDate": "2024-10-26",
    "interval": "monthly"
  }'
```

**Response:**

```json
{
  "success": true,
  "field_id": "ITALY-FIELD-001",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-10-26",
    "interval": "monthly",
    "interval_days": 30
  },
  "chart_data": {
    "labels": [
      "2024-01-01",
      "2024-01-31",
      "2024-03-01",
      "2024-03-31",
      "2024-04-30",
      "2024-05-30",
      "2024-06-29",
      "2024-07-29",
      "2024-08-28",
      "2024-09-27"
    ],
    "datasets": [
      {
        "label": "NDVI",
        "data": [
          0.3312, 0.3317, 0.3883, 0.4161, 0.4771, 0.3803, 0.3686, 0.3149,
          0.4641, 0.5428
        ]
      },
      {
        "label": "Water %",
        "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      },
      {
        "label": "Vegetation %",
        "data": [50, 50, 50, 75, 75, 50, 50, 50, 75, 75]
      },
      {
        "label": "Soil %",
        "data": [50, 50, 50, 25, 25, 50, 50, 50, 25, 25]
      }
    ]
  },
  "statistics": {
    "ndvi": {
      "mean": 0.4015,
      "std": 0.0699,
      "min": 0.3149,
      "max": 0.5428,
      "median": 0.3843
    },
    "water": {
      "mean_percentage": 0,
      "max_percentage": 0,
      "occurrences": 0
    },
    "vegetation": {
      "mean_percentage": 60,
      "max_percentage": 75,
      "min_percentage": 50
    },
    "soil": {
      "mean_percentage": 40,
      "max_percentage": 50,
      "min_percentage": 25
    },
    "trend": "improving"
  },
  "area_analysis": {
    "water": {
      "pixels": 0,
      "percentage": 0,
      "area_hectares": 0
    },
    "vegetation": {
      "pixels": 692.37,
      "percentage": 100,
      "area_hectares": 6.9237
    },
    "total_area_hectares": 6.9237
  },
  "metadata": {
    "data_source": "Sentinel-2",
    "spatial_resolution": "10m",
    "cloud_filter": "< 30%",
    "total_data_points": 10
  }
}
```

---

### Example 2: Weekly NDVI Chart (3 months)

```bash
curl -X POST http://localhost:3000/api/field-analysis/ndvi-chart \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [
        [
          [12.633435130119326, 42.6498850799555],
          [12.633585333824158, 42.64952208649428],
          [12.633628249168396, 42.64908806979262],
          [12.633499503135681, 42.64897759233047],
          [12.63356387615204, 42.64877241938018],
          [12.63375699520111, 42.648488332639424],
          [12.633907198905947, 42.64795961219534],
          [12.634164690971376, 42.64786491552187],
          [12.634711861610413, 42.64787280691682],
          [12.635602355003359, 42.64807009146552],
          [12.63606369495392, 42.64803063460584],
          [12.636653780937197, 42.64803063460584],
          [12.63683617115021, 42.64825159269771],
          [12.636954188346865, 42.64829894075813],
          [12.636353373527529, 42.64893024478662],
          [12.63555943965912, 42.64979038621333],
          [12.635216116905214, 42.65020072472159],
          [12.634583115577698, 42.65020072472159],
          [12.63383209705353, 42.65014548700316],
          [12.633435130119326, 42.6498850799555]
        ]
      ]
    },
    "fieldId": "ITALY-FIELD-001",
    "startDate": "2024-08-01",
    "endDate": "2024-10-26",
    "interval": "weekly"
  }'
```

---

### Example 3: Quarterly NDVI Chart (2 years)

```bash
curl -X POST http://localhost:3000/api/field-analysis/ndvi-chart \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [
        [
          [12.633435130119326, 42.6498850799555],
          [12.633585333824158, 42.64952208649428],
          [12.633628249168396, 42.64908806979262],
          [12.633499503135681, 42.64897759233047],
          [12.63356387615204, 42.64877241938018],
          [12.63375699520111, 42.648488332639424],
          [12.633907198905947, 42.64795961219534],
          [12.634164690971376, 42.64786491552187],
          [12.634711861610413, 42.64787280691682],
          [12.635602355003359, 42.64807009146552],
          [12.63606369495392, 42.64803063460584],
          [12.636653780937197, 42.64803063460584],
          [12.63683617115021, 42.64825159269771],
          [12.636954188346865, 42.64829894075813],
          [12.636353373527529, 42.64893024478662],
          [12.63555943965912, 42.64979038621333],
          [12.635216116905214, 42.65020072472159],
          [12.634583115577698, 42.65020072472159],
          [12.63383209705353, 42.65014548700316],
          [12.633435130119326, 42.6498850799555]
        ]
      ]
    },
    "fieldId": "ITALY-FIELD-001",
    "startDate": "2023-01-01",
    "endDate": "2024-10-26",
    "interval": "quarterly"
  }'
```

---

## 📊 Chart.js Integration

### HTML Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>NDVI Chart</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  </head>
  <body>
    <canvas id="ndviChart"></canvas>

    <script>
      // Fetch NDVI chart data
      fetch("http://localhost:3000/api/field-analysis/ndvi-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldBoundary: {
            /* ... */
          },
          fieldId: "ITALY-FIELD-001",
          startDate: "2024-01-01",
          endDate: "2024-10-26",
          interval: "monthly",
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const ctx = document.getElementById("ndviChart").getContext("2d");
          new Chart(ctx, {
            type: "line",
            data: data.chart_data,
            options: data.chart_config.options,
          });
        });
    </script>
  </body>
</html>
```

---

## 🚀 Quick Start

### 1. Start Server

```bash
npm start
```

### 2. Test API

```bash
curl http://localhost:3000/api/health
```

### 3. Generate Chart

```bash
curl -X POST http://localhost:3000/api/field-analysis/ndvi-chart \
  -H "Content-Type: application/json" \
  -d @request.json
```

---

## 📦 Postman Collection

Import the Postman collection from:

```
postman/NDVI_Chart_API.postman_collection.json
```

---

## ✅ Summary

The NDVI Chart API provides:

- ✅ **Comprehensive Analysis** - Water, vegetation, and soil detection
- ✅ **Time Series Data** - Historical NDVI trends
- ✅ **Chart-Ready Format** - Direct Chart.js integration
- ✅ **Statistical Insights** - Mean, std, min, max, median
- ✅ **Trend Detection** - Improving, declining, stable
- ✅ **Area Analysis** - Hectares and percentages
- ✅ **Cloud Masking** - Clean, reliable data
- ✅ **Flexible Intervals** - Daily to quarterly
- ✅ **GEE Integration** - Sentinel-2 satellite imagery

**Ready for production use!** 🚀
