#!/bin/bash

# NDVI Time Series API - cURL Examples
# This script contains all working cURL requests for the API

echo "🌍 NDVI Time Series API - cURL Examples"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API Base URL
API_URL="http://localhost:3000"

# Field Boundary (Bangladesh)
FIELD_BOUNDARY='{"type":"Polygon","coordinates":[[[90.37110641598703,23.841231509287553],[90.37093743681908,23.84014467798467],[90.37123516201974,23.84014713133873],[90.3713531792164,23.840186384997345],[90.37110641598703,23.841231509287553]]]}'

# ============================================
# 1. HEALTH CHECK
# ============================================
echo -e "${BLUE}1. Health Check${NC}"
echo "Testing if server is running..."
echo ""
curl -X GET "$API_URL/api/health" \
  -H "Content-Type: application/json"
echo ""
echo ""

# ============================================
# 2. TIME SERIES - 10 DAY INTERVAL
# ============================================
echo -e "${BLUE}2. Time Series - 10 Day Interval${NC}"
echo "Generating NDVI time series data..."
echo ""
curl -X POST "$API_URL/api/field-analysis/time-series" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldBoundary\": $FIELD_BOUNDARY,
    \"fieldId\": \"NGR-KD-12345\",
    \"startDate\": \"2025-01-01\",
    \"endDate\": \"2025-12-31\",
    \"intervalDays\": 10
  }"
echo ""
echo ""

# ============================================
# 3. TIME SERIES MAP - 10 DAY INTERVAL
# ============================================
echo -e "${BLUE}3. Time Series Map - 10 Day Interval${NC}"
echo "Generating NDVI maps with visualization URLs..."
echo ""
curl -X POST "$API_URL/api/field-analysis/time-series-map" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldBoundary\": $FIELD_BOUNDARY,
    \"fieldId\": \"NGR-KD-12345\",
    \"startDate\": \"2025-01-01\",
    \"endDate\": \"2025-12-31\",
    \"intervalDays\": 10
  }"
echo ""
echo ""

# ============================================
# 4. TIME SERIES MAP - 30 DAY INTERVAL
# ============================================
echo -e "${BLUE}4. Time Series Map - 30 Day Interval (Monthly)${NC}"
echo "Generating monthly NDVI maps..."
echo ""
curl -X POST "$API_URL/api/field-analysis/time-series-map" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldBoundary\": $FIELD_BOUNDARY,
    \"fieldId\": \"NGR-KD-12345\",
    \"startDate\": \"2025-01-01\",
    \"endDate\": \"2025-12-31\",
    \"intervalDays\": 30
  }"
echo ""
echo ""

# ============================================
# 5. TIME SERIES MAP - 5 DAY INTERVAL
# ============================================
echo -e "${BLUE}5. Time Series Map - 5 Day Interval (High Resolution)${NC}"
echo "Generating high-resolution NDVI maps..."
echo ""
curl -X POST "$API_URL/api/field-analysis/time-series-map" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldBoundary\": $FIELD_BOUNDARY,
    \"fieldId\": \"NGR-KD-12345\",
    \"startDate\": \"2025-06-01\",
    \"endDate\": \"2025-08-31\",
    \"intervalDays\": 5
  }"
echo ""
echo ""

# ============================================
# 6. FIELD ANALYSIS
# ============================================
echo -e "${BLUE}6. Field Analysis - Single Point${NC}"
echo "Analyzing field NDVI..."
echo ""
curl -X POST "$API_URL/api/field-analysis" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldBoundary\": $FIELD_BOUNDARY,
    \"fieldId\": \"NGR-KD-12345\"
  }"
echo ""
echo ""

# ============================================
# 7. ERROR EXAMPLE - Missing Field
# ============================================
echo -e "${YELLOW}7. Error Example - Missing Required Field${NC}"
echo "Testing error handling..."
echo ""
curl -X POST "$API_URL/api/field-analysis/time-series-map" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldId\": \"NGR-KD-12345\"
  }"
echo ""
echo ""

# ============================================
# 8. ERROR EXAMPLE - Invalid Geometry
# ============================================
echo -e "${YELLOW}8. Error Example - Invalid Geometry Type${NC}"
echo "Testing geometry validation..."
echo ""
curl -X POST "$API_URL/api/field-analysis/time-series-map" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldBoundary\": {\"type\": \"Point\", \"coordinates\": [90.37, 23.84]},
    \"fieldId\": \"NGR-KD-12345\"
  }"
echo ""
echo ""

echo -e "${GREEN}✅ All examples completed!${NC}"
echo ""
echo "📚 For more information, see:"
echo "   - docs/TIME_SERIES_MAP_API_GUIDE.md"
echo "   - postman_collection.json"
echo "   - docs/API_RESPONSE_EXAMPLES.md"

