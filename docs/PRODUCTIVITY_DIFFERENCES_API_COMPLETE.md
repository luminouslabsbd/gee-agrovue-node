# 🌾 Productivity Differences API - Complete Documentation

## 📋 Overview

The **Productivity Differences API** analyzes agricultural fields using satellite imagery (Sentinel-2) and classifies them into **7 productivity zones** based on NDVI (Normalized Difference Vegetation Index) statistical distribution.

This API uses an **image-based classification approach** for efficient, scalable analysis that completes in seconds instead of minutes.

---

## 🎯 Key Features

✅ **7-Zone Productivity Classification** - Based on standard deviations from field mean  
✅ **Image-Based Processing** - Single GEE operation (fast & scalable)  
✅ **Field Boundary Clipping** - Precise analysis of your field  
✅ **Zone Distribution Statistics** - Pixel counts and percentages  
✅ **Management Recommendations** - Actionable advice for each zone  
✅ **Visualization Images** - NDVI map and productivity zones map  
✅ **Automatic Image Storage** - Images saved locally and served via HTTP  

---

## 📊 Productivity Zone System

The API classifies fields into 7 zones based on **standard deviations from the field mean NDVI**:

| Zone | Label | Std Dev Range | Productivity % | Color | Management Action |
|------|-------|---------------|----------------|-------|-------------------|
| **m3** | Very Low Productivity | < -1.5σ | **69%** | 🔴 Dark Red (#8B0000) | Urgent intervention - soil testing, drainage, pest control |
| **m2** | Low Productivity | -1.5σ to -0.5σ | **87%** | 🔴 Crimson (#DC143C) | Targeted fertilization and irrigation needed |
| **m1** | Below Average | -0.5σ to -0.25σ | **95%** | 🟠 Dark Orange (#FF8C00) | Monitor closely, consider soil amendments |
| **p0** | Average Productivity | -0.25σ to +0.25σ | **100%** | 🟡 Gold (#FFD700) | Maintain current practices |
| **p1** | Above Average | +0.25σ to +0.5σ | **107%** | 🟢 Yellow Green (#9ACD32) | Good performance, optimize for maximum yield |
| **p2** | High Productivity | +0.5σ to +1.5σ | **111%** | 🟢 Lime Green (#32CD32) | Excellent conditions, use as reference |
| **p3** | Very High Productivity | > +1.5σ | **119%** | 🟢 Dark Green (#006400) | Optimal productivity, replicate conditions |

**Note:** σ (sigma) = standard deviation of field NDVI

---

## 🔌 API Endpoint

### **POST** `/api/field-analysis/productivity-differences`

Generates 7-zone productivity classification analysis for a field.

---

## 📥 Request Format

### Headers
```
Content-Type: application/json
```

### Request Body

```json
{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [
      [
        [9.15, 45.45],
        [9.16, 45.45],
        [9.16, 45.46],
        [9.15, 45.46],
        [9.15, 45.45]
      ]
    ]
  },
  "fieldId": "ITALY-RICE-FIELD",
  "date": "2024-07-15"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fieldBoundary` | GeoJSON Polygon | ✅ Yes | Field boundary coordinates (longitude, latitude) |
| `fieldId` | String | ✅ Yes | Unique identifier for the field |
| `date` | String (YYYY-MM-DD) | ❌ No | Analysis date (defaults to current date) |

---

## 📤 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "field_id": "ITALY-RICE-FIELD",
  "analysis_date": "2024-07-15",
  "field_statistics": {
    "mean_ndvi": 0.2742,
    "std_dev_ndvi": 0.1918,
    "min_ndvi": -0.0312,
    "max_ndvi": 0.8093,
    "image_count": 2
  },
  "productivity_differences": {
    "m3": 69,
    "m2": 87,
    "m1": 95,
    "p0": 100,
    "p1": 107,
    "p2": 111,
    "p3": 119
  },
  "available_productivity_zones": [
    "m3", "m2", "m1", "p0", "p1", "p2", "p3"
  ],
  "zone_distribution": {
    "m3": {
      "pixel_count": 17,
      "percentage": 0.14,
      "productivity_percentage": 69,
      "label": "Very Low Productivity"
    },
    "m2": {
      "pixel_count": 5382.4,
      "percentage": 43.46,
      "productivity_percentage": 87,
      "label": "Low Productivity"
    },
    "p0": {
      "pixel_count": 1614.51,
      "percentage": 13.04,
      "productivity_percentage": 100,
      "label": "Average Productivity"
    },
    "p2": {
      "pixel_count": 1934.18,
      "percentage": 15.62,
      "productivity_percentage": 111,
      "label": "High Productivity"
    },
    "p3": {
      "pixel_count": 1478.56,
      "percentage": 11.94,
      "productivity_percentage": 119,
      "label": "Very High Productivity"
    }
  },
  "images": {
    "ndvi_map": "/productivity-zones/ITALY-RICE-FIELD/ndvi_map.png",
    "productivity_zones_map": "/productivity-zones/ITALY-RICE-FIELD/productivity_zones.png"
  },
  "zone_details": [
    {
      "code": "m3",
      "label": "Very Low Productivity",
      "productivity_percentage": 69,
      "color": "#8B0000",
      "management": "Urgent intervention - soil testing, drainage, pest control"
    },
    {
      "code": "p0",
      "label": "Average Productivity",
      "productivity_percentage": 100,
      "color": "#FFD700",
      "management": "Maintain current practices"
    }
  ]
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": "No cloud-free images found"
}
```

---

## 🧪 Testing Examples

### Example 1: Italy Rice Field (Summer 2024)

**cURL:**
```bash
curl --location 'http://localhost:3000/api/field-analysis/productivity-differences' \
--header 'Content-Type: application/json' \
--data '{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [
      [
        [9.15, 45.45],
        [9.16, 45.45],
        [9.16, 45.46],
        [9.15, 45.46],
        [9.15, 45.45]
      ]
    ]
  },
  "fieldId": "ITALY-RICE-FIELD",
  "date": "2024-07-15"
}'
```

**Response Time:** ~12 seconds  
**Zones Found:** All 7 zones (m3, m2, m1, p0, p1, p2, p3)  
**Field Size:** ~1.1 km × 1.1 km  

---

## 📊 Response Field Descriptions

### `field_statistics`
- `mean_ndvi`: Average NDVI value across the field (0 to 1)
- `std_dev_ndvi`: Standard deviation of NDVI values
- `min_ndvi`: Minimum NDVI value in the field
- `max_ndvi`: Maximum NDVI value in the field
- `image_count`: Number of Sentinel-2 images used

### `productivity_differences`
Fixed productivity percentages for each zone (always the same):
- **m3**: 69% - Very low productivity
- **m2**: 87% - Low productivity
- **m1**: 95% - Below average
- **p0**: 100% - Average (baseline)
- **p1**: 107% - Above average
- **p2**: 111% - High productivity
- **p3**: 119% - Very high productivity

### `available_productivity_zones`
Array of zone codes that exist in the analyzed field. Not all fields will have all 7 zones.

### `zone_distribution`
Detailed statistics for each zone present in the field:
- `pixel_count`: Number of 10m×10m pixels in this zone
- `percentage`: Percentage of field area in this zone
- `productivity_percentage`: Productivity level (69-119%)
- `label`: Human-readable zone name

### `images`
URLs to visualization images (served via Express static middleware):
- `ndvi_map`: NDVI visualization (red to green gradient)
- `productivity_zones_map`: Color-coded productivity zones

### `zone_details`
Management recommendations for each available zone:
- `code`: Zone identifier (m3, m2, m1, p0, p1, p2, p3)
- `label`: Zone name
- `productivity_percentage`: Productivity level
- `color`: Hex color code for visualization
- `management`: Recommended management action

---

## 🖼️ Visualization Images

The API generates two images automatically:

### 1. NDVI Map (`ndvi_map.png`)
- Shows vegetation health across the field
- Color gradient: Red (low NDVI) → Green (high NDVI)
- Resolution: 512×512 pixels
- Format: PNG

### 2. Productivity Zones Map (`productivity_zones.png`)
- Shows 7-zone classification
- Color-coded by productivity level
- Resolution: 512×512 pixels
- Format: PNG

**Access Images:**
```
http://localhost:3000/productivity-zones/{fieldId}/ndvi_map.png
http://localhost:3000/productivity-zones/{fieldId}/productivity_zones.png
```

---

## ⚡ Performance

### Image-Based Approach (CURRENT)
- ✅ **Processing Time:** 10-15 seconds
- ✅ **Scalability:** Works with any field size
- ✅ **GEE Operations:** 3-4 API calls total
- ✅ **Memory Usage:** Low
- ✅ **Success Rate:** High

### Grid-Based Approach (DEPRECATED)
- ❌ **Processing Time:** 3+ minutes (often timeout)
- ❌ **Scalability:** Fails on large fields
- ❌ **GEE Operations:** 100s-1000s of API calls
- ❌ **Memory Usage:** Very high
- ❌ **Success Rate:** Low (quota issues)

---

## 🔧 Technical Implementation

### Algorithm Overview

1. **Fetch NDVI Data** - Get Sentinel-2 imagery for date range (±7 days)
2. **Calculate Statistics** - Compute field mean and standard deviation
3. **Classify Image** - Apply threshold-based classification (single GEE operation)
4. **Calculate Zone Stats** - Use frequency histogram to count pixels per zone
5. **Generate Images** - Create NDVI and zone visualization thumbnails
6. **Download & Store** - Save images locally for HTTP serving

### Key GEE Operations

```javascript
// Classification (single operation)
let zoneImage = ee.Image(0);
zoneImage = zoneImage.where(ndviImage.lt(mean - 1.5*stdDev), 1);  // m3
zoneImage = zoneImage.where(ndviImage.gte(mean - 1.5*stdDev).and(ndviImage.lt(mean - 0.5*stdDev)), 2);  // m2
// ... (continues for all 7 zones)

// Statistics (single operation)
const histogram = zoneImage.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(),
  geometry: fieldBoundary,
  scale: 10
});
```

---

## 📦 Postman Collection

Import the Postman collection for easy testing:

**File:** `postman/Productivity_Differences_API.postman_collection.json`

**Features:**
- Pre-configured request with example field
- Sample response included
- Full API documentation
- Ready to import and test

---

## 🚀 Next Steps

1. **Import Postman Collection** - Test the API with provided examples
2. **View Images** - Open the image URLs in your browser
3. **Analyze Results** - Review zone distribution and management recommendations
4. **Integrate** - Use the API in your web/mobile application

---

## 📞 Support

For issues or questions:
- Check server logs for detailed error messages
- Ensure Sentinel-2 data is available for your date/location
- Use dates from the past (not future dates)
- Verify field boundary coordinates are valid GeoJSON

---

**Status:** ✅ **PRODUCTION READY**  
**Last Updated:** 2025-11-01  
**API Version:** 1.0.0

