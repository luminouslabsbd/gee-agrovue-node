# 🚀 Get Started with Field Analysis API

## ⏱️ 5-Minute Quick Start

### Step 1: Start the Server (30 seconds)
```bash
npm start
```

You should see:
```
✅ Earth Engine authenticated with service account
✅ Earth Engine initialized successfully
✅ Field Analysis Service initialized
🌍 Google Earth Engine Server running on http://localhost:3000
```

### Step 2: Test the API (1 minute)
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
  }' | jq '.'
```

### Step 3: View the Response (1 minute)
You should see:
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

### Step 4: Run Tests (2 minutes)
```bash
npm test
```

You should see:
```
PASS  tests/fieldAnalysisService.test.js
PASS  tests/fieldAnalysisAPI.test.js

Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
```

## 📚 Next Steps

### Learn the API
1. Read **QUICK_REFERENCE.md** (5 min)
2. Read **API_DOCUMENTATION.md** (10 min)
3. Try examples in **FIELD_ANALYSIS_EXAMPLES.md** (10 min)

### Understand the Code
1. Read **IMPLEMENTATION_SUMMARY.md** (10 min)
2. Read **ARCHITECTURE.md** (15 min)
3. Explore the code in `services/fieldAnalysisService.js`

### Integrate into Your App
1. See **FIELD_ANALYSIS_EXAMPLES.md** for code examples
2. Use the API endpoint: `POST /api/field-analysis`
3. Parse the response and use the data

## 🎯 Common Tasks

### Task 1: Analyze a Different Field
```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[your_lon, your_lat], ...]]
    },
    "fieldId": "YOUR-FIELD-ID"
  }'
```

### Task 2: Analyze with Date Range
```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "NGR-KD-12345",
    "startDate": "2025-09-01",
    "endDate": "2025-10-15"
  }'
```

### Task 3: Integrate with JavaScript
```javascript
const response = await fetch('http://localhost:3000/api/field-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fieldBoundary: {...},
    fieldId: 'NGR-KD-12345'
  })
});

const result = await response.json();
console.log(`Health Status: ${result.data.interpretation.health_status}`);
console.log(`NDVI Mean: ${result.data.ndvi.mean}`);
console.log(`Area: ${result.data.hectares} hectares`);
```

### Task 4: Integrate with Python
```python
import requests

response = requests.post(
  'http://localhost:3000/api/field-analysis',
  json={
    'fieldBoundary': {...},
    'fieldId': 'NGR-KD-12345'
  }
)

result = response.json()
print(f"Health Status: {result['data']['interpretation']['health_status']}")
print(f"NDVI Mean: {result['data']['ndvi']['mean']}")
print(f"Area: {result['data']['hectares']} hectares")
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## 📖 Documentation Quick Links

| Document | Purpose | Read Time |
|----------|---------|-----------|
| README_FIELD_ANALYSIS.md | Overview | 5 min |
| QUICK_REFERENCE.md | Quick lookup | 3 min |
| API_DOCUMENTATION.md | API details | 10 min |
| FIELD_ANALYSIS_EXAMPLES.md | Code examples | 10 min |
| ARCHITECTURE.md | System design | 15 min |
| TESTING_GUIDE.md | Testing | 10 min |
| IMPLEMENTATION_SUMMARY.md | Technical details | 15 min |

## 🆘 Troubleshooting

### Problem: "Earth Engine not initialized"
**Solution**: Wait 5 seconds after starting the server

### Problem: "No Sentinel-2 imagery available"
**Solution**: Try a different date range or location

### Problem: "Port 3000 in use"
**Solution**: Use a different port
```bash
PORT=3001 npm start
```

### Problem: Tests failing
**Solution**: Make sure dependencies are installed
```bash
npm install
npm test
```

## 📊 Understanding the Response

### NDVI Statistics
- **mean**: Average vegetation index (0-1)
- **std**: Standard deviation
- **min/max**: Minimum and maximum values
- **median**: Middle value
- **p25/p75**: 25th and 75th percentiles

### Health Status
- **Poor** (< 0.30): Bare soil or severe stress
- **Fair** (0.30-0.40): Low vegetation
- **Good** (0.40-0.50): Moderate growth
- **Healthy** (0.50-0.70): Good health
- **Very Healthy** (> 0.70): Excellent health

### Quality Metrics
- **cloud_cover**: Percentage of clouds (0-100%)
- **pixel_count**: Number of valid pixels
- **confidence**: Quality score (0-1)
- **data_source**: Always "Sentinel-2"
- **acquisition_date**: When the image was taken

## 🎓 Learning Resources

- **Google Earth Engine**: https://developers.google.com/earth-engine
- **Sentinel-2**: https://sentinel.esa.int/web/sentinel/missions/sentinel-2
- **NDVI**: https://en.wikipedia.org/wiki/Normalized_difference_vegetation_index
- **Express.js**: https://expressjs.com/
- **Jest**: https://jestjs.io/

## ✅ Verification Checklist

- [ ] Server starts without errors
- [ ] API responds to requests
- [ ] Tests pass (28/28)
- [ ] Response includes NDVI data
- [ ] Response includes health status
- [ ] Response includes quality metrics
- [ ] Response includes field area

## 🚀 You're Ready!

You now have:
✅ A running API server  
✅ Working NDVI analysis  
✅ Comprehensive testing  
✅ Complete documentation  

### What to do next:
1. Explore the API with different fields
2. Read the documentation
3. Integrate into your application
4. Deploy to production

## 📞 Need Help?

1. **Quick questions**: See QUICK_REFERENCE.md
2. **API questions**: See API_DOCUMENTATION.md
3. **Code examples**: See FIELD_ANALYSIS_EXAMPLES.md
4. **Architecture**: See ARCHITECTURE.md
5. **Testing**: See TESTING_GUIDE.md

---

**Congratulations!** 🎉 You're now ready to use the Field Analysis API!

