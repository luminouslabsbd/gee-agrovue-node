# Field Analysis API - Testing Guide

## Overview

Comprehensive testing suite with unit tests, integration tests, and API endpoint tests.

## Test Structure

```
tests/
├── fieldAnalysisService.test.js    # Unit tests for service
└── fieldAnalysisAPI.test.js        # Integration tests for API
```

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode (Auto-rerun on changes)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Specific Test File

```bash
npm test -- fieldAnalysisService.test.js
```

### Verbose Output

```bash
npm test -- --verbose
```

## Test Coverage

### Unit Tests (fieldAnalysisService.test.js)

#### 1. GeoJSON to EE Geometry Conversion

```javascript
describe('_geoJsonToEEGeometry', () => {
  test('should convert valid Polygon GeoJSON to EE geometry')
  test('should throw error for non-Polygon geometry')
})
```

**What it tests:**
- Valid Polygon conversion
- Error handling for invalid geometry types

#### 2. NDVI Statistics Extraction

```javascript
describe('_extractNDVIStats', () => {
  test('should extract NDVI statistics correctly')
})
```

**What it tests:**
- Correct extraction of mean, std, min, max, median, p25, p75
- Proper rounding to 2 decimal places

#### 3. Health Interpretation

```javascript
describe('_interpretHealth', () => {
  test('should interpret very low NDVI as Poor')
  test('should interpret low NDVI as Fair')
  test('should interpret moderate NDVI as Good')
  test('should interpret high NDVI as Healthy')
  test('should interpret very high NDVI as Very Healthy')
})
```

**What it tests:**
- Correct health status mapping
- Correct health score assignment
- Alert generation

#### 4. Confidence Calculation

```javascript
describe('_calculateConfidence', () => {
  test('should calculate confidence with no cloud cover')
  test('should reduce confidence with cloud cover')
  test('should reduce confidence with low pixel count')
  test('should return value between 0 and 1')
})
```

**What it tests:**
- Cloud cover impact on confidence
- Pixel count impact on confidence
- Boundary conditions (0-1 range)

#### 5. Area Calculation

```javascript
describe('_calculateHectares', () => {
  test('should calculate hectares from geometry')
  test('should return 0 on error')
})
```

**What it tests:**
- Correct conversion from m² to hectares
- Error handling

#### 6. Full Analysis

```javascript
describe('analyzeFieldNDVI', () => {
  test('should return analysis result with all required fields')
  test('should have correct NDVI structure')
  test('should have correct quality structure')
  test('should have correct interpretation structure')
})
```

**What it tests:**
- Complete analysis workflow
- Response structure validation
- All required fields present

### Integration Tests (fieldAnalysisAPI.test.js)

#### 1. Service Availability

```javascript
test('should return 503 when Earth Engine not initialized')
```

**What it tests:**
- Proper error handling when EE not ready

#### 2. Input Validation

```javascript
test('should return 400 when fieldBoundary is missing')
test('should return 400 when fieldId is missing')
test('should return 400 for non-Polygon geometry')
```

**What it tests:**
- Required field validation
- Geometry type validation

#### 3. Successful Analysis

```javascript
test('should return 200 with analysis data for valid request')
test('should return correct data structure')
test('should have correct NDVI statistics')
test('should have correct quality information')
test('should have correct health interpretation')
```

**What it tests:**
- Successful API response
- Response structure
- Data accuracy

## Test Data

### Sample Field Boundary

```json
{
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
```

### Mock Earth Engine

Tests use a mock Earth Engine object that simulates:
- Geometry operations
- Image collection queries
- Reducer operations
- Filter operations

## Expected Test Results

### Successful Test Run

```
PASS  tests/fieldAnalysisService.test.js
  FieldAnalysisService
    _geoJsonToEEGeometry
      ✓ should convert valid Polygon GeoJSON to EE geometry
      ✓ should throw error for non-Polygon geometry
    _extractNDVIStats
      ✓ should extract NDVI statistics correctly
    _interpretHealth
      ✓ should interpret very low NDVI as Poor
      ✓ should interpret low NDVI as Fair
      ✓ should interpret moderate NDVI as Good
      ✓ should interpret high NDVI as Healthy
      ✓ should interpret very high NDVI as Very Healthy
    _calculateConfidence
      ✓ should calculate confidence with no cloud cover
      ✓ should reduce confidence with cloud cover
      ✓ should reduce confidence with low pixel count
      ✓ should return value between 0 and 1
    _calculateHectares
      ✓ should calculate hectares from geometry
      ✓ should return 0 on error
    analyzeFieldNDVI
      ✓ should return analysis result with all required fields
      ✓ should have correct NDVI structure
      ✓ should have correct quality structure
      ✓ should have correct interpretation structure

PASS  tests/fieldAnalysisAPI.test.js
  Field Analysis API Endpoint
    POST /api/field-analysis
      ✓ should return 503 when Earth Engine not initialized
      ✓ should return 400 when fieldBoundary is missing
      ✓ should return 400 when fieldId is missing
      ✓ should return 400 for non-Polygon geometry
      ✓ should return 200 with analysis data for valid request
      ✓ should return correct data structure
      ✓ should have correct NDVI statistics
      ✓ should have correct quality information
      ✓ should have correct health interpretation

Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
```

## Coverage Thresholds

```
Statements   : 70% (minimum)
Branches     : 70% (minimum)
Functions    : 70% (minimum)
Lines        : 70% (minimum)
```

## Manual Testing with cURL

### Test 1: Valid Request

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.37110641598703, 23.841231509287553], ...]]
    },
    "fieldId": "NGR-KD-12345"
  }'
```

**Expected Response:** 200 OK with analysis data

### Test 2: Missing Field ID

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.37110641598703, 23.841231509287553], ...]]
    }
  }'
```

**Expected Response:** 400 Bad Request

### Test 3: Invalid Geometry

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

**Expected Response:** 400 Bad Request

### Test 4: With Date Range

```bash
curl -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "NGR-KD-12345",
    "startDate": "2025-10-01",
    "endDate": "2025-10-15"
  }'
```

**Expected Response:** 200 OK with analysis data

## Debugging Tests

### Run Single Test

```bash
npm test -- --testNamePattern="should convert valid Polygon"
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output

```bash
npm test -- --verbose
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Test Maintenance

### Adding New Tests

1. Create test file in `tests/` directory
2. Follow naming convention: `*.test.js`
3. Use descriptive test names
4. Include setup and teardown
5. Run `npm test` to verify

### Updating Tests

1. Modify test file
2. Run `npm run test:watch`
3. Verify all tests pass
4. Update documentation if needed

## Performance Testing

### Load Testing

```bash
# Using Apache Bench
ab -n 100 -c 10 -p payload.json \
  -T application/json \
  http://localhost:3000/api/field-analysis
```

### Stress Testing

```bash
# Using Artillery
artillery quick --count 100 --num 1000 \
  http://localhost:3000/api/field-analysis
```

## Troubleshooting

### Tests Timeout

Increase timeout in jest.config.js:
```javascript
testTimeout: 30000 // 30 seconds
```

### Mock Issues

Ensure mock Earth Engine matches actual API:
```javascript
const mockEE = createMockEE();
```

### Coverage Issues

Check coverage report:
```bash
npm run test:coverage
```

## Best Practices

1. ✅ Write tests before code (TDD)
2. ✅ Keep tests isolated and independent
3. ✅ Use descriptive test names
4. ✅ Mock external dependencies
5. ✅ Test both success and failure cases
6. ✅ Maintain high coverage (>70%)
7. ✅ Run tests frequently
8. ✅ Update tests with code changes

