# Zone Image Generation API - cURL Examples

## Quick Start

### 1. Generate Zone Image (Italy Rice Field - 100m grid)

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

**Expected Response:**
```json
{
  "success": true,
  "field_id": "ITALY-RICE-FIELD-01",
  "analysis_date": "2024-10-26",
  "crop_type": "rice",
  "images": {
    "ndvi_map_url": "https://earthengine.googleapis.com/v1alpha/...",
    "zone_map_url": "https://earthengine.googleapis.com/v1alpha/...",
    "metadata_url": "/zone-images/ITALY-RICE-FIELD-01_20241026_.../metadata.json",
    "legend_url": "/zone-images/ITALY-RICE-FIELD-01_20241026_.../legend.json"
  },
  "field_statistics": {
    "mean_ndvi": 0.5356,
    "std_ndvi": 0.0684,
    "min_ndvi": 0.3055,
    "max_ndvi": 0.6661,
    "variability": 0.1277,
    "area_hectares": "5.08"
  },
  "zone_analysis": { ... },
  "yield_predictions": {
    "field_summary": {
      "total_estimated_yield_tons": 38.45,
      "average_yield_tons_per_hectare": 7.57,
      "yield_efficiency_percentage": 75.69
    }
  },
  "productivity_status": {
    "overall_status": "Good",
    "overall_score": 72.45,
    "recommendations": [...]
  }
}
```

---

### 2. Generate Zone Image (Detailed - 50m grid)

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
    "gridSize": 50,
    "cropType": "rice"
  }'
```

**Note:** Smaller grid size = more zones = more detailed analysis = longer processing time

---

### 3. Generate Zone Image (Wheat Field)

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
    "fieldId": "WHEAT-FIELD-01",
    "date": "2024-10-26",
    "gridSize": 100,
    "cropType": "wheat"
  }'
```

**Crop-Specific Yield Calculations:**
- Rice: Base 3.5, Max 10.0 tons/hectare
- Wheat: Base 2.8, Max 8.0 tons/hectare
- Maize: Base 4.0, Max 12.0 tons/hectare
- Cotton: Base 1.5, Max 5.0 tons/hectare
- Soybean: Base 2.0, Max 6.0 tons/hectare

---

### 4. Get Zone Image Metadata

```bash
curl http://localhost:3000/api/field-analysis/zone-image/ITALY-RICE-FIELD-01_20241026_1234567890
```

**Expected Response:**
```json
{
  "success": true,
  "metadata": {
    "field_id": "ITALY-RICE-FIELD-01",
    "analysis_date": "2024-10-26",
    "crop_type": "rice",
    "images": { ... },
    "field_statistics": { ... },
    "zone_analysis": { ... },
    "yield_predictions": { ... },
    "productivity_status": { ... }
  }
}
```

---

### 5. List All Zone Images

```bash
curl http://localhost:3000/api/field-analysis/zone-images
```

**Expected Response:**
```json
{
  "success": true,
  "images": [
    {
      "image_id": "ITALY-RICE-FIELD-01_20241026_1234567890",
      "field_id": "ITALY-RICE-FIELD-01",
      "date": "2024-10-26",
      "created_at": "2024-10-26T12:34:56.789Z"
    },
    {
      "image_id": "WHEAT-FIELD-01_20241025_9876543210",
      "field_id": "WHEAT-FIELD-01",
      "date": "2024-10-25",
      "created_at": "2024-10-25T10:20:30.456Z"
    }
  ]
}
```

---

## Advanced Examples

### Save Response to File

```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { ... },
    "fieldId": "ITALY-RICE-FIELD-01",
    "date": "2024-10-26",
    "gridSize": 100,
    "cropType": "rice"
  }' > zone_analysis_result.json
```

### Pretty Print Response

```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { ... },
    "fieldId": "ITALY-RICE-FIELD-01",
    "date": "2024-10-26",
    "gridSize": 100,
    "cropType": "rice"
  }' | python3 -m json.tool
```

### Extract Specific Data

**Get Overall Productivity Score:**
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{ ... }' | jq '.productivity_status.overall_score'
```

**Get Total Estimated Yield:**
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{ ... }' | jq '.yield_predictions.field_summary.total_estimated_yield_tons'
```

**Get Zone Distribution:**
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{ ... }' | jq '.productivity_status.zone_distribution'
```

**Get Recommendations:**
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{ ... }' | jq '.productivity_status.recommendations'
```

---

## Testing Different Grid Sizes

### Fast Processing (200m grid)
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { ... },
    "fieldId": "TEST-FIELD",
    "gridSize": 200,
    "cropType": "rice"
  }'
```
**Processing Time:** ~30 seconds  
**Zones:** Few zones, less detail

### Balanced (100m grid) - RECOMMENDED
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { ... },
    "fieldId": "TEST-FIELD",
    "gridSize": 100,
    "cropType": "rice"
  }'
```
**Processing Time:** ~60 seconds  
**Zones:** Good balance of detail and speed

### Detailed (50m grid)
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { ... },
    "fieldId": "TEST-FIELD",
    "gridSize": 50,
    "cropType": "rice"
  }'
```
**Processing Time:** ~90 seconds  
**Zones:** Many zones, high detail

### Very Detailed (20m grid)
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { ... },
    "fieldId": "TEST-FIELD",
    "gridSize": 20,
    "cropType": "rice"
  }'
```
**Processing Time:** ~120+ seconds  
**Zones:** Very many zones, maximum detail

---

## Testing Different Crop Types

### Rice
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{ ..., "cropType": "rice" }'
```

### Wheat
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{ ..., "cropType": "wheat" }'
```

### Maize
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{ ..., "cropType": "maize" }'
```

### Cotton
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{ ..., "cropType": "cotton" }'
```

### Soybean
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{ ..., "cropType": "soybean" }'
```

---

## Error Handling Examples

### Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Response:**
```json
{
  "success": false,
  "error": "Missing required fields: fieldBoundary and fieldId are required"
}
```

### Invalid Grid Size
```bash
curl -X POST http://localhost:3000/api/field-analysis/zone-image \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": { ... },
    "fieldId": "TEST",
    "gridSize": 10
  }'
```
**Response:**
```json
{
  "success": false,
  "error": "Grid size must be between 20 and 200 meters"
}
```

---

## Health Check Examples

### Server Health
```bash
curl http://localhost:3000/api/health
```

### Earth Engine Status
```bash
curl http://localhost:3000/api/ee-status
```

---

## Tips

1. **Processing Time**: Larger fields and smaller grid sizes take longer
2. **Grid Size**: Use 100m for balanced performance
3. **Crop Type**: Choose correct crop type for accurate yield predictions
4. **Date**: Use recent dates for current conditions
5. **Save Results**: Save responses to files for later analysis
6. **Image URLs**: Use returned URLs in mapping applications

---

*Generated: 2024-10-26*  
*Version: 1.0.0*

