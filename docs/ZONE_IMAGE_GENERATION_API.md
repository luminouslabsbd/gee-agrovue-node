# Zone Image Generation API Documentation

## Overview

The Zone Image Generation API provides comprehensive field zone analysis with **actual NDVI map images**, **color-coded zone visualization**, **crop yield predictions**, and **productivity status**. Images are stored in the public folder and accessible via HTTP URLs.

This API answers the question: **"Which parts of my field are good and which parts are bad?"**

---

## Table of Contents

1. [API Endpoints](#api-endpoints)
2. [Features](#features)
3. [Request/Response Format](#requestresponse-format)
4. [Zone Classification](#zone-classification)
5. [Crop Yield Predictions](#crop-yield-predictions)
6. [Productivity Status](#productivity-status)
7. [Image Storage](#image-storage)
8. [cURL Examples](#curl-examples)
9. [Integration Guide](#integration-guide)

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/field-analysis
```

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/zone-image` | POST | Generate zone image with NDVI, zones, and crop yield |
| `/zone-image/:imageId` | GET | Get zone image metadata |
| `/zone-images` | GET | List all generated zone images |

---

## Features

### ✅ What This API Provides

1. **NDVI Map Images** - Color-coded NDVI visualization
2. **Zone Classification** - 5-level classification (Excellent to Very Poor)
3. **Crop Yield Predictions** - Estimated yield for each zone and total field
4. **Productivity Status** - Overall field productivity score (0-100)
5. **Zone-Specific Data** - Detailed statistics for each zone
6. **Image Storage** - Images stored in `public/zone-images/` folder
7. **HTTP Access** - Images accessible via URLs
8. **Metadata** - Complete analysis data in JSON format

---

## Request/Response Format

### Generate Zone Image

**Endpoint:** `POST /api/field-analysis/zone-image`

**Request Body:**
```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  },
  "fieldId": "FIELD-001",
  "date": "2024-10-26",
  "gridSize": 50,
  "cropType": "rice"
}
```

**Parameters:**
- `fieldBoundary` (required): GeoJSON polygon defining field boundary
- `fieldId` (required): Unique field identifier
- `date` (optional): Analysis date (YYYY-MM-DD), defaults to current date
- `gridSize` (optional): Grid size in meters (20-200), defaults to 50
- `cropType` (optional): Crop type (rice, wheat, maize, cotton, soybean), defaults to rice

**Response:**
```json
{
  "success": true,
  "field_id": "FIELD-001",
  "analysis_date": "2024-10-26",
  "crop_type": "rice",
  
  "images": {
    "ndvi_map_url": "https://earthengine.googleapis.com/v1alpha/.../tiles/{z}/{x}/{y}",
    "zone_map_url": "https://earthengine.googleapis.com/v1alpha/.../tiles/{z}/{x}/{y}",
    "metadata_url": "/zone-images/FIELD-001_20241026_1234567890/metadata.json",
    "legend_url": "/zone-images/FIELD-001_20241026_1234567890/legend.json"
  },
  
  "field_statistics": {
    "mean_ndvi": 0.5356,
    "std_ndvi": 0.0684,
    "min_ndvi": 0.3055,
    "max_ndvi": 0.6661,
    "variability": 0.1277,
    "area_hectares": "5.08"
  },
  
  "zone_analysis": {
    "zones": [
      {
        "zone_id": 1,
        "mean_ndvi": 0.4523,
        "std_ndvi": 0.0234,
        "area_hectares": 0.4321,
        "classification": "Moderate",
        "classification_code": "moderate",
        "color": "#FFD700",
        "priority": 3
      }
    ],
    "summary": {
      "by_classification": {
        "excellent": { "count": 0, "total_area": 0, "label": "Excellent", "color": "#006400", "percentage": 0 },
        "good": { "count": 10, "total_area": 4.65, "label": "Good", "color": "#32CD32", "percentage": 91.46 },
        "moderate": { "count": 1, "total_area": 0.43, "label": "Moderate", "color": "#FFD700", "percentage": 8.54 }
      },
      "total_area": 5.08,
      "average_ndvi": 0.5356,
      "priority_zones": []
    }
  },
  
  "yield_predictions": {
    "crop_type": "rice",
    "zone_yields": [
      {
        "zone_id": 1,
        "estimated_yield_tons_per_hectare": 7.12,
        "total_yield_tons": 3.08,
        "yield_quality": "Good",
        "classification": "Moderate"
      }
    ],
    "field_summary": {
      "total_estimated_yield_tons": 38.45,
      "average_yield_tons_per_hectare": 7.57,
      "total_area_hectares": 5.08,
      "potential_max_yield_tons": 50.80,
      "yield_efficiency_percentage": 75.69
    }
  },
  
  "productivity_status": {
    "overall_status": "Good",
    "overall_score": 72.45,
    "status_color": "#32CD32",
    "component_scores": {
      "ndvi_health_score": 66.87,
      "yield_efficiency_score": 75.69,
      "uniformity_score": 91.46
    },
    "zone_distribution": {
      "excellent_percentage": 0,
      "good_percentage": 91.46,
      "moderate_percentage": 8.54,
      "poor_percentage": 0,
      "very_poor_percentage": 0
    },
    "priority_zones_count": 0,
    "priority_zones": [],
    "recommendations": [
      "Field is performing well overall",
      "Continue current practices",
      "Monitor moderate zones for improvement opportunities",
      "Consider targeted interventions for lower-performing zones"
    ]
  },
  
  "metadata": {
    "grid_size_meters": 50,
    "total_zones": 11,
    "image_count": 3,
    "data_source": "Sentinel-2 Level 2A",
    "generated_at": "2024-10-26T12:34:56.789Z"
  }
}
```

---

## Zone Classification

### 5-Level Classification System

| Classification | NDVI Range | Color | Priority | Description |
|----------------|------------|-------|----------|-------------|
| **Excellent** | 0.7 - 1.0 | Dark Green (#006400) | 1 | Optimal crop health and productivity |
| **Good** | 0.5 - 0.7 | Green (#32CD32) | 2 | Healthy vegetation, good productivity |
| **Moderate** | 0.3 - 0.5 | Yellow (#FFD700) | 3 | Moderate health, needs monitoring |
| **Poor** | 0.1 - 0.3 | Orange (#FF8C00) | 4 | Poor health, intervention needed |
| **Very Poor** | < 0.1 | Red (#DC143C) | 5 | Critical condition, urgent action required |

### Zone Data Structure

Each zone includes:
- **Zone ID**: Unique identifier
- **Mean NDVI**: Average NDVI value
- **Standard Deviation**: NDVI variability within zone
- **Area**: Zone area in hectares
- **Classification**: Performance category
- **Color**: Hex color code for visualization
- **Priority**: Urgency level (1-5)

---

## Crop Yield Predictions

### Supported Crop Types

| Crop | Base Yield | NDVI Multiplier | Max Yield | Unit |
|------|------------|-----------------|-----------|------|
| Rice | 3.5 | 8.0 | 10.0 | tons/hectare |
| Wheat | 2.8 | 6.5 | 8.0 | tons/hectare |
| Maize | 4.0 | 9.0 | 12.0 | tons/hectare |
| Cotton | 1.5 | 3.5 | 5.0 | tons/hectare |
| Soybean | 2.0 | 5.0 | 6.0 | tons/hectare |

### Yield Calculation Formula

```
Estimated Yield = min(Base Yield + (NDVI × Multiplier), Max Yield)
```

### Yield Quality Classification

- **Excellent**: ≥ 80% of max yield
- **Good**: 60-80% of max yield
- **Moderate**: 40-60% of max yield
- **Poor**: 20-40% of max yield
- **Very Poor**: < 20% of max yield

---

## Productivity Status

### Overall Productivity Score (0-100)

The productivity score is calculated from three components:

1. **NDVI Health Score (40%)**: Normalized NDVI value
2. **Yield Efficiency Score (40%)**: Percentage of potential max yield
3. **Uniformity Score (20%)**: Field uniformity (100% - poor zones percentage)

```
Overall Score = (NDVI Score × 0.4) + (Yield Score × 0.4) + (Uniformity Score × 0.2)
```

### Status Categories

| Score Range | Status | Color | Recommendations |
|-------------|--------|-------|-----------------|
| 80-100 | Excellent | Dark Green | Maintain practices, use as benchmark |
| 60-80 | Good | Green | Continue practices, monitor moderate zones |
| 40-60 | Moderate | Yellow | Review practices, focus on poor zones |
| 20-40 | Poor | Orange | Immediate intervention, comprehensive assessment |
| 0-20 | Very Poor | Red | Urgent action, consult agronomist |

---

## Image Storage

### Storage Structure

```
public/zone-images/
├── index.json                          # Index of all images
├── FIELD-001_20241026_1234567890/
│   ├── metadata.json                   # Complete analysis data
│   └── legend.json                     # Zone classification legend
└── FIELD-002_20241027_9876543210/
    ├── metadata.json
    └── legend.json
```

### Image URLs

1. **NDVI Map URL**: Google Earth Engine tile service
   - Format: `https://earthengine.googleapis.com/v1alpha/{mapid}/tiles/{z}/{x}/{y}`
   - Use with Leaflet, Google Maps, or OpenLayers

2. **Zone Map URL**: Color-coded zone classification
   - Format: `https://earthengine.googleapis.com/v1alpha/{mapid}/tiles/{z}/{x}/{y}`
   - Shows zones in classification colors

3. **Metadata URL**: Complete analysis data
   - Format: `/zone-images/{imageId}/metadata.json`
   - Accessible via HTTP

4. **Legend URL**: Zone classification legend
   - Format: `/zone-images/{imageId}/legend.json`
   - Color codes and descriptions

### Auto-Cleanup

- System keeps last 100 zone images
- Older images automatically deleted
- Index updated automatically

---

## cURL Examples

### Example 1: Generate Zone Image (Italy Rice Field)

```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[
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
      ]]
    },
    "fieldId": "ITALY-RICE-FIELD-01",
    "date": "2024-10-26",
    "gridSize": 100,
    "cropType": "rice"
  }'
```

### Example 2: Get Zone Image Metadata

```bash
curl http://localhost:3000/api/field-analysis/zone-image/ITALY-RICE-FIELD-01_20241026_1234567890
```

### Example 3: List All Zone Images

```bash
curl http://localhost:3000/api/field-analysis/zone-images
```

---

## Integration Guide

### Leaflet Integration

```javascript
// Generate zone image
const response = await fetch('http://localhost:3000/api/field-analysis/zone-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fieldBoundary: fieldGeoJSON,
    fieldId: 'FIELD-001',
    cropType: 'rice'
  })
});

const data = await response.json();

// Add NDVI layer
const ndviLayer = L.tileLayer(data.images.ndvi_map_url, {
  attribution: 'Google Earth Engine'
}).addTo(map);

// Add zone layer
const zoneLayer = L.tileLayer(data.images.zone_map_url, {
  attribution: 'Google Earth Engine'
}).addTo(map);

// Display productivity status
console.log(`Field Status: ${data.productivity_status.overall_status}`);
console.log(`Overall Score: ${data.productivity_status.overall_score}`);
console.log(`Estimated Yield: ${data.yield_predictions.field_summary.total_estimated_yield_tons} tons`);
```

### React Integration

```javascript
import React, { useState } from 'react';

function ZoneAnalysis() {
  const [zoneData, setZoneData] = useState(null);
  
  const analyzeField = async () => {
    const response = await fetch('/api/field-analysis/zone-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldBoundary: fieldGeoJSON,
        fieldId: 'FIELD-001',
        cropType: 'rice'
      })
    });
    
    const data = await response.json();
    setZoneData(data);
  };
  
  return (
    <div>
      <button onClick={analyzeField}>Analyze Field</button>
      
      {zoneData && (
        <div>
          <h2>Productivity Status: {zoneData.productivity_status.overall_status}</h2>
          <p>Score: {zoneData.productivity_status.overall_score}/100</p>
          <p>Estimated Yield: {zoneData.yield_predictions.field_summary.total_estimated_yield_tons} tons</p>
          
          <h3>Zone Distribution:</h3>
          <ul>
            <li>Excellent: {zoneData.productivity_status.zone_distribution.excellent_percentage}%</li>
            <li>Good: {zoneData.productivity_status.zone_distribution.good_percentage}%</li>
            <li>Moderate: {zoneData.productivity_status.zone_distribution.moderate_percentage}%</li>
            <li>Poor: {zoneData.productivity_status.zone_distribution.poor_percentage}%</li>
          </ul>
          
          <h3>Recommendations:</h3>
          <ul>
            {zoneData.productivity_status.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## Technical Specifications

### Data Source
- **Satellite**: Sentinel-2 Level 2A Surface Reflectance
- **Dataset**: COPERNICUS/S2_SR
- **Spatial Resolution**: 10 meters
- **NDVI Formula**: (B8 - B4) / (B8 + B4)
- **Cloud Filtering**: < 30% cloud coverage

### Processing Time
- **Small fields (< 5 ha)**: 30-60 seconds
- **Medium fields (5-20 ha)**: 60-120 seconds
- **Large fields (> 20 ha)**: 120-180 seconds

### Grid Size Recommendations
- **Detailed analysis**: 20-50 meters
- **Balanced**: 50-100 meters (recommended)
- **Fast processing**: 100-200 meters

---

## Use Cases

1. **Precision Fertilization**: Apply fertilizer only to zones that need it
2. **Targeted Irrigation**: Adjust irrigation based on zone performance
3. **Yield Forecasting**: Predict harvest quantities for planning
4. **Problem Detection**: Identify underperforming areas early
5. **ROI Analysis**: Calculate return on investment by zone
6. **Insurance Claims**: Document crop performance with satellite data
7. **Farm Management**: Track field performance over time

---

## Error Handling

### Common Errors

**No satellite images available:**
```json
{
  "success": false,
  "error": "No satellite images available for date: 2024-10-26"
}
```
**Solution**: Try a different date or check cloud coverage

**Invalid field boundary:**
```json
{
  "success": false,
  "error": "Missing required fields: fieldBoundary and fieldId are required"
}
```
**Solution**: Ensure GeoJSON polygon is valid

---

## Summary

The Zone Image Generation API provides:

✅ **NDVI Map Images** - Color-coded visualization  
✅ **Zone Classification** - 5-level performance categories  
✅ **Crop Yield Predictions** - Estimated yield per zone and total  
✅ **Productivity Status** - Overall field score (0-100)  
✅ **Image Storage** - Public folder with HTTP access  
✅ **Comprehensive Data** - Complete analysis in JSON format  
✅ **Easy Integration** - Works with Leaflet, Google Maps, React  

**Perfect for precision agriculture, farm management, and crop monitoring!**

---

*Generated: 2024-10-26*  
*Version: 1.0.0*  
*Status: Production Ready ✅*

