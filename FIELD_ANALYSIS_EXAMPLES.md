# Field Analysis API - Usage Examples

## Quick Start

### 1. Start the Server

```bash
npm start
```

The server will initialize Earth Engine and be ready to accept requests.

### 2. Test the API

Use cURL, Postman, or any HTTP client to send requests.

## Example 1: Basic Field Analysis

**Request:**

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [
        [
          [90.37110641598703, 23.841231509287553],
          [90.37093743681908, 23.84014467798467],
          [90.37123516201974, 23.84014713133873],
          [90.3713531792164, 23.840186384997345],
          [90.37143632769585, 23.840105424313425],
          [90.37150606513023, 23.840120144441542],
          [90.37162408232689, 23.8403286794102],
          [90.37181988358499, 23.840316412656623],
          [90.37198618054391, 23.840529854003293],
          [90.37194058299067, 23.840890495480306],
          [90.37191644310953, 23.84110638921785],
          [90.37187889218332, 23.841135829245108],
          [90.3714242577553, 23.84087086875907],
          [90.37147387862206, 23.841177535938964],
          [90.37157043814659, 23.841177535938964],
          [90.37110641598703, 23.841231509287553]
        ]
      ]
    },
    "fieldId": "NGR-KD-12345"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "field_id": "NGR-KD-12345",
    "date": "2025-10-21",
    "ndvi": {
      "mean": 0.68,
      "std": 0.12,
      "min": 0.35,
      "max": 0.85,
      "median": 0.68,
      "p25": 0.62,
      "p75": 0.74
    },
    "quality": {
      "cloud_cover": 8.5,
      "pixel_count": 1247,
      "data_source": "Sentinel-2",
      "acquisition_date": "2025-10-14",
      "confidence": 0.95
    },
    "interpretation": {
      "health_status": "Healthy",
      "health_score": 85,
      "alerts": []
    },
    "hectares": 5.0
  },
  "message": "Field analysis completed successfully"
}
```

## Example 2: Analysis with Date Range

**Request:**

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [
        [
          [90.37110641598703, 23.841231509287553],
          [90.37093743681908, 23.84014467798467],
          [90.37123516201974, 23.84014713133873],
          [90.3713531792164, 23.840186384997345],
          [90.37143632769585, 23.840105424313425],
          [90.37150606513023, 23.840120144441542],
          [90.37162408232689, 23.8403286794102],
          [90.37181988358499, 23.840316412656623],
          [90.37198618054391, 23.840529854003293],
          [90.37194058299067, 23.840890495480306],
          [90.37191644310953, 23.84110638921785],
          [90.37187889218332, 23.841135829245108],
          [90.3714242577553, 23.84087086875907],
          [90.37147387862206, 23.841177535938964],
          [90.37157043814659, 23.841177535938964],
          [90.37110641598703, 23.841231509287553]
        ]
      ]
    },
    "fieldId": "NGR-KD-12345",
    "startDate": "2025-09-15",
    "endDate": "2025-10-15"
  }'
```

## Example 3: Using JavaScript/Node.js

```javascript
const fetch = require('node-fetch');

async function analyzeField() {
  const fieldBoundary = {
    type: 'Polygon',
    coordinates: [
      [
        [90.37110641598703, 23.841231509287553],
        [90.37093743681908, 23.84014467798467],
        [90.37123516201974, 23.84014713133873],
        [90.3713531792164, 23.840186384997345],
        [90.37143632769585, 23.840105424313425],
        [90.37150606513023, 23.840120144441542],
        [90.37162408232689, 23.8403286794102],
        [90.37181988358499, 23.840316412656623],
        [90.37198618054391, 23.840529854003293],
        [90.37194058299067, 23.840890495480306],
        [90.37191644310953, 23.84110638921785],
        [90.37187889218332, 23.841135829245108],
        [90.3714242577553, 23.84087086875907],
        [90.37147387862206, 23.841177535938964],
        [90.37157043814659, 23.841177535938964],
        [90.37110641598703, 23.841231509287553]
      ]
    ]
  };

  try {
    const response = await fetch('http://localhost:3000/api/field-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fieldBoundary,
        fieldId: 'NGR-KD-12345',
        startDate: '2025-10-01',
        endDate: '2025-10-15'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Field Analysis Results:');
      console.log(`Field ID: ${result.data.field_id}`);
      console.log(`Health Status: ${result.data.interpretation.health_status}`);
      console.log(`Health Score: ${result.data.interpretation.health_score}`);
      console.log(`NDVI Mean: ${result.data.ndvi.mean}`);
      console.log(`Area: ${result.data.hectares} hectares`);
      console.log(`Cloud Cover: ${result.data.quality.cloud_cover}%`);
      console.log(`Confidence: ${(result.data.quality.confidence * 100).toFixed(1)}%`);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

analyzeField();
```

## Example 4: Python Integration

```python
import requests
import json

def analyze_field():
    field_boundary = {
        "type": "Polygon",
        "coordinates": [
            [
                [90.37110641598703, 23.841231509287553],
                [90.37093743681908, 23.84014467798467],
                [90.37123516201974, 23.84014713133873],
                [90.3713531792164, 23.840186384997345],
                [90.37143632769585, 23.840105424313425],
                [90.37150606513023, 23.840120144441542],
                [90.37162408232689, 23.8403286794102],
                [90.37181988358499, 23.840316412656623],
                [90.37198618054391, 23.840529854003293],
                [90.37194058299067, 23.840890495480306],
                [90.37191644310953, 23.84110638921785],
                [90.37187889218332, 23.841135829245108],
                [90.3714242577553, 23.84087086875907],
                [90.37147387862206, 23.841177535938964],
                [90.37157043814659, 23.841177535938964],
                [90.37110641598703, 23.841231509287553]
            ]
        ]
    }

    payload = {
        "fieldBoundary": field_boundary,
        "fieldId": "NGR-KD-12345",
        "startDate": "2025-10-01",
        "endDate": "2025-10-15"
    }

    response = requests.post(
        'http://localhost:3000/api/field-analysis',
        json=payload,
        headers={'Content-Type': 'application/json'}
    )

    result = response.json()
    
    if result['success']:
        data = result['data']
        print(f"Field ID: {data['field_id']}")
        print(f"Health Status: {data['interpretation']['health_status']}")
        print(f"NDVI Mean: {data['ndvi']['mean']}")
        print(f"Area: {data['hectares']} hectares")
        print(f"Confidence: {data['quality']['confidence'] * 100:.1f}%")
    else:
        print(f"Error: {result['error']}")

if __name__ == "__main__":
    analyze_field()
```

## Example 5: Error Handling

### Missing Field ID

**Request:**

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[...]]
    }
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Missing required fields: fieldBoundary and fieldId"
}
```

### Invalid Geometry Type

**Request:**

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Point",
      "coordinates": [90.37, 23.84]
    },
    "fieldId": "NGR-KD-12345"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Only Polygon geometries are supported"
}
```

## Data Interpretation Guide

### NDVI Values

- **0.0 - 0.3**: Bare soil, water, or urban areas
- **0.3 - 0.5**: Sparse vegetation or stressed crops
- **0.5 - 0.7**: Moderate to good vegetation
- **0.7 - 1.0**: Dense, healthy vegetation

### Health Scores

- **0-20**: Poor - Immediate intervention needed
- **21-40**: Fair - Monitor closely
- **41-60**: Good - Normal growth
- **61-85**: Healthy - Good condition
- **86-100**: Very Healthy - Excellent condition

### Alerts

The API generates alerts based on NDVI values:

- NDVI < 0.3: "Very low vegetation index - possible crop stress or bare soil"
- NDVI 0.3-0.4: "Low vegetation index - monitor for potential issues"
- NDVI 0.4-0.5: "Moderate vegetation index - normal growth"

## Performance Tips

1. **Batch Processing**: For multiple fields, consider implementing batch endpoints
2. **Caching**: Cache results for the same field and date range
3. **Date Range**: Shorter date ranges may return faster results
4. **Cloud Cover**: Higher cloud cover may affect analysis quality

## Troubleshooting

### "Earth Engine not initialized"

Wait a few seconds after starting the server for Earth Engine to initialize.

### "No Sentinel-2 imagery available"

The date range may not have available imagery. Try extending the date range.

### Low Confidence Score

High cloud cover or low pixel count reduces confidence. Try a different date range.

