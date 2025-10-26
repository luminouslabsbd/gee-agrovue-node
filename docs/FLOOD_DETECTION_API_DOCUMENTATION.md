# Flood Detection API - Complete Documentation

## 🎯 Overview

The Flood Detection API uses **Sentinel-1 SAR (Synthetic Aperture Radar)** imagery to detect floods and analyze water extent changes in agricultural fields. It provides current flood status, historical flood analysis, and time series data.

### Key Features

- ✅ **Current Flood Detection** - Real-time flood status using recent SAR imagery
- ✅ **Historical Flood Analysis** - 5-year flood history with event tracking
- ✅ **Flood Risk Assessment** - Risk scoring based on frequency and severity
- ✅ **Water Extent Analysis** - Precise water coverage calculations
- ✅ **Time Series Data** - Historical water extent trends
- ✅ **SAR-Based Detection** - Works in all weather conditions (clouds, rain, night)
- ✅ **High Accuracy** - 10-meter spatial resolution

---

## 📡 API Endpoints

### 1. Flood Detection

```
POST /api/field-analysis/flood-detection
```

Detects current flood status and analyzes historical floods for a field.

### 2. Flood Time Series

```
POST /api/field-analysis/flood-time-series
```

Generates flood time series data showing water extent changes over time.

---

## 📥 Request Format

### Flood Detection Request

```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  },
  "fieldId": "string",
  "currentDate": "YYYY-MM-DD" (optional, defaults to today)
}
```

### Flood Time Series Request

```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  },
  "fieldId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "intervalDays": 30 (optional, default: 30)
}
```

### Parameters

| Parameter       | Type    | Required | Description                      |
| --------------- | ------- | -------- | -------------------------------- |
| `fieldBoundary` | GeoJSON | Yes      | Field boundary polygon           |
| `fieldId`       | String  | Yes      | Unique field identifier          |
| `currentDate`   | String  | No       | Analysis date (default: today)   |
| `startDate`     | String  | Yes\*    | Start date for time series       |
| `endDate`       | String  | Yes\*    | End date for time series         |
| `intervalDays`  | Number  | No       | Time interval (default: 30 days) |

\*Required for flood time series only

---

## 📤 Response Format

### Flood Detection Response

```json
{
  "success": true,
  "field_id": "ITALY-FLOOD-TEST",
  "analysis_date": "2024-10-26",
  "current_status": {
    "flood_detected": false,
    "severity": "none",
    "confidence": "high",
    "water_percentage": 0,
    "water_area_hectares": 0,
    "image_count": 3,
    "date_range": {
      "start": "2024-10-14",
      "end": "2024-10-26"
    }
  },
  "historical_analysis": {
    "floods_detected": [
      {
        "date": "2020-04-14",
        "water_percentage": 12.44,
        "water_area_hectares": 0.6322,
        "severity": "minor"
      },
      {
        "date": "2020-01-15",
        "water_percentage": 11.56,
        "water_area_hectares": 0.5876,
        "severity": "minor"
      }
    ],
    "total_flood_events": 2,
    "analysis_period_years": 5,
    "flood_risk": {
      "level": "moderate",
      "score": 32,
      "description": "Moderate flood risk - occasional flood events",
      "flood_frequency": 2,
      "avg_water_percentage": 12
    }
  },
  "water_extent": {
    "total_area_hectares": 5.0828,
    "water_area_hectares": 0,
    "water_percentage": 0,
    "land_percentage": 100
  },
  "metadata": {
    "data_source": "Sentinel-1 SAR",
    "spatial_resolution": "10m",
    "polarization": "VV, VH",
    "method": "SAR backscatter threshold analysis",
    "generated_at": "2025-10-26T10:16:25.835Z"
  }
}
```

### Flood Time Series Response

```json
{
  "success": true,
  "field_id": "ITALY-FLOOD-SERIES",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-10-26",
    "interval_days": 60
  },
  "time_series": [
    {
      "date": "2024-01-01",
      "water_percentage": 0,
      "water_area_hectares": 0,
      "flood_detected": false,
      "confidence": "high"
    },
    {
      "date": "2024-03-01",
      "water_percentage": 0,
      "water_area_hectares": 0,
      "flood_detected": false,
      "confidence": "high"
    }
  ],
  "statistics": {
    "total_data_points": 5,
    "flood_events_detected": 0,
    "flood_frequency_percentage": 0,
    "max_water_percentage": 0,
    "avg_water_percentage": 0,
    "most_recent_flood": null
  },
  "metadata": {
    "data_source": "Sentinel-1 SAR",
    "total_data_points": 5,
    "generated_at": "2025-10-26T10:16:51.944Z"
  }
}
```

---

## 🎨 Classification Thresholds

### Flood Severity Levels

| Severity | Water Coverage | Description                                   |
| -------- | -------------- | --------------------------------------------- |
| None     | < 5%           | No flood detected                             |
| Minor    | 5% - 15%       | Minor flooding, localized water accumulation  |
| Moderate | 15% - 30%      | Moderate flooding, significant water coverage |
| Major    | 30% - 50%      | Major flooding, extensive water coverage      |
| Severe   | > 50%          | Severe flooding, field mostly underwater      |

### Flood Risk Levels

| Risk Level | Score    | Description                           |
| ---------- | -------- | ------------------------------------- |
| Low        | 0 - 20   | Rare flood events with minimal impact |
| Moderate   | 20 - 40  | Occasional flood events               |
| High       | 40 - 60  | Frequent flood events                 |
| Very High  | 60 - 100 | Severe and frequent flooding          |

---

## 🔧 Technical Details

### Data Source

- **Satellite**: Sentinel-1 C-band SAR
- **Dataset**: `COPERNICUS/S1_GRD`
- **Spatial Resolution**: 10 meters
- **Temporal Resolution**: 6-12 days (revisit time)
- **Polarization**: VV and VH

### Detection Method

- **Water Detection**: SAR backscatter threshold analysis
- **VV Threshold**: -18 dB (water has low backscatter)
- **VH Threshold**: -25 dB
- **Change Detection**: Temporal comparison for flood identification

### Advantages of SAR

- ✅ **All-Weather**: Works through clouds, rain, fog
- ✅ **Day/Night**: Independent of sunlight
- ✅ **Water Sensitivity**: Excellent water detection capability
- ✅ **Penetration**: Can penetrate vegetation to detect water

### Historical Analysis

- **Period**: 5 years lookback
- **Sampling**: Monthly intervals to avoid timeout
- **Flood Threshold**: > 10% water coverage
- **Max Samples**: 60 data points

---

## 💻 cURL Examples

### Example 1: Detect Current Flood Status

```bash
curl -X POST http://localhost:3000/api/field-analysis/flood-detection \
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
    "fieldId": "ITALY-FLOOD-TEST",
    "currentDate": "2024-10-26"
  }'
```

**Response Summary:**

- ✅ No current flood detected
- ✅ 2 historical floods found (2020-04-14, 2020-01-15)
- ✅ Moderate flood risk (score: 32)
- ✅ 12% average water coverage during floods

---

### Example 2: Generate Flood Time Series

```bash
curl -X POST http://localhost:3000/api/field-analysis/flood-time-series \
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
    "fieldId": "ITALY-FLOOD-SERIES",
    "startDate": "2024-01-01",
    "endDate": "2024-10-26",
    "intervalDays": 60
  }'
```

**Response Summary:**

- ✅ 5 data points (60-day intervals)
- ✅ No floods detected in 2024
- ✅ 0% average water coverage
- ✅ High confidence measurements

---

## 🎓 Use Cases

### 1. Flood Risk Assessment

**Scenario**: Evaluate flood risk before purchasing agricultural land

**API Call**: Flood Detection

```bash
POST /api/field-analysis/flood-detection
```

**Benefits**:

- Historical flood frequency
- Flood severity analysis
- Risk scoring (0-100)
- Insurance planning

### 2. Crop Insurance Claims

**Scenario**: Document flood damage for insurance claims

**API Call**: Flood Detection + Time Series

```bash
POST /api/field-analysis/flood-detection
POST /api/field-analysis/flood-time-series
```

**Benefits**:

- Precise flood dates
- Water coverage percentage
- Affected area in hectares
- Historical comparison

### 3. Drainage System Planning

**Scenario**: Design drainage infrastructure based on flood patterns

**API Call**: Flood Time Series (5-year period)

```bash
POST /api/field-analysis/flood-time-series
{
  "startDate": "2019-01-01",
  "endDate": "2024-10-26",
  "intervalDays": 30
}
```

**Benefits**:

- Seasonal flood patterns
- Peak flood periods
- Water accumulation trends
- Infrastructure sizing

### 4. Real-Time Flood Monitoring

**Scenario**: Monitor fields during rainy season

**API Call**: Flood Detection (daily checks)

```bash
POST /api/field-analysis/flood-detection
{
  "currentDate": "2024-10-26"
}
```

**Benefits**:

- Current flood status
- Water extent percentage
- Severity classification
- Immediate alerts

### 5. Climate Change Analysis

**Scenario**: Study flood frequency changes over time

**API Call**: Flood Time Series (multi-year)

```bash
POST /api/field-analysis/flood-time-series
{
  "startDate": "2015-01-01",
  "endDate": "2024-10-26",
  "intervalDays": 90
}
```

**Benefits**:

- Long-term trends
- Frequency changes
- Severity evolution
- Climate adaptation planning

---

## 📊 Integration Examples

### JavaScript/Node.js

```javascript
const axios = require("axios");

async function detectFlood(fieldBoundary, fieldId) {
  try {
    const response = await axios.post(
      "http://localhost:3000/api/field-analysis/flood-detection",
      {
        fieldBoundary: fieldBoundary,
        fieldId: fieldId,
        currentDate: new Date().toISOString().split("T")[0],
      }
    );

    const data = response.data;

    if (data.current_status.flood_detected) {
      console.log(
        `⚠️ FLOOD ALERT: ${data.current_status.severity} flood detected!`
      );
      console.log(`Water coverage: ${data.current_status.water_percentage}%`);
      console.log(
        `Affected area: ${data.current_status.water_area_hectares} hectares`
      );
    } else {
      console.log("✅ No flood detected");
    }

    console.log(`Flood risk: ${data.historical_analysis.flood_risk.level}`);
    console.log(
      `Historical floods: ${data.historical_analysis.total_flood_events}`
    );

    return data;
  } catch (error) {
    console.error("Error:", error.message);
  }
}
```

### Python

```python
import requests
from datetime import date

def detect_flood(field_boundary, field_id):
    url = 'http://localhost:3000/api/field-analysis/flood-detection'

    payload = {
        'fieldBoundary': field_boundary,
        'fieldId': field_id,
        'currentDate': date.today().isoformat()
    }

    response = requests.post(url, json=payload)
    data = response.json()

    if data['current_status']['flood_detected']:
        print(f"⚠️ FLOOD ALERT: {data['current_status']['severity']} flood detected!")
        print(f"Water coverage: {data['current_status']['water_percentage']}%")
        print(f"Affected area: {data['current_status']['water_area_hectares']} hectares")
    else:
        print("✅ No flood detected")

    print(f"Flood risk: {data['historical_analysis']['flood_risk']['level']}")
    print(f"Historical floods: {data['historical_analysis']['total_flood_events']}")

    return data
```

---

## 🚀 Quick Start

### 1. Start Server

```bash
npm start
```

### 2. Test Flood Detection

```bash
curl -X POST http://localhost:3000/api/field-analysis/flood-detection \
  -H "Content-Type: application/json" \
  -d @flood_request.json
```

### 3. View Results

Check the response for:

- Current flood status
- Historical flood events
- Flood risk assessment
- Water extent analysis

---

## ⚠️ Important Notes

### Limitations

- **SAR Availability**: Sentinel-1 data available from 2014 onwards
- **Temporal Resolution**: 6-12 day revisit time
- **Processing Time**: Historical analysis may take 1-3 minutes
- **Timeout Protection**: Historical analysis samples every 30th image

### Best Practices

- ✅ Use recent dates for current flood detection (last 12 days)
- ✅ Use 30-60 day intervals for time series to avoid timeouts
- ✅ Check confidence level in results
- ✅ Combine with NDVI data for crop damage assessment
- ✅ Monitor during rainy seasons for early flood detection

### Data Quality

- **High Confidence**: 2+ SAR images available
- **Medium Confidence**: 1 SAR image available
- **Low Confidence**: No SAR images available

---

## ✅ Summary

The Flood Detection API provides:

- ✅ **Current Flood Status** - Real-time flood detection
- ✅ **Historical Analysis** - 5-year flood history
- ✅ **Risk Assessment** - Flood risk scoring
- ✅ **Time Series Data** - Water extent trends
- ✅ **SAR Technology** - All-weather detection
- ✅ **High Accuracy** - 10-meter resolution
- ✅ **Comprehensive Metrics** - Water percentage, area, severity
- ✅ **Easy Integration** - RESTful API with JSON responses

**Ready for production use!** 🚀
