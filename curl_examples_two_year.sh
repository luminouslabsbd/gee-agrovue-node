#!/bin/bash

# 🌾 NDVI 2-Year Time Series API - cURL Examples
# All examples use the same field boundary for consistency

BASE_URL="http://localhost:3000"

# Field boundary (Polygon)
FIELD_BOUNDARY='{
  "type": "Polygon",
  "coordinates": [[[90.37110641598703, 23.841231509287553],
                   [90.37093743681908, 23.84014467798467],
                   [90.37123516201974, 23.84014713133873],
                   [90.3713531792164, 23.840186384997345],
                   [90.37110641598703, 23.841231509287553]]]
}'

FIELD_ID="NGR-KD-12345"

echo "=========================================="
echo "🌾 NDVI 2-Year Time Series API Examples"
echo "=========================================="
echo ""

# Example 1: Generate 2-Year Time Series (Monthly)
echo "1️⃣  Generate 2-Year Time Series (Monthly Interval)"
echo "---"
curl -X POST "$BASE_URL/api/field-analysis/two-year-time-series" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldBoundary\": $FIELD_BOUNDARY,
    \"fieldId\": \"$FIELD_ID\",
    \"intervalType\": \"monthly\"
  }" | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

# Example 2: Generate 2-Year Time Series (Weekly)
echo "2️⃣  Generate 2-Year Time Series (Weekly Interval)"
echo "---"
curl -X POST "$BASE_URL/api/field-analysis/two-year-time-series" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldBoundary\": $FIELD_BOUNDARY,
    \"fieldId\": \"$FIELD_ID\",
    \"intervalType\": \"weekly\"
  }" | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

# Example 3: Generate Field Image for Specific Date
echo "3️⃣  Generate Field Image for Specific Date"
echo "---"
curl -X POST "$BASE_URL/api/field-analysis/field-image" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldBoundary\": $FIELD_BOUNDARY,
    \"fieldId\": \"$FIELD_ID\",
    \"date\": \"2025-01-15\"
  }" | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

# Example 4: Update Field Boundary
echo "4️⃣  Update Field Boundary"
echo "---"
NEW_BOUNDARY='{
  "type": "Polygon",
  "coordinates": [[[90.37, 23.84],
                   [90.371, 23.84],
                   [90.371, 23.841],
                   [90.37, 23.841],
                   [90.37, 23.84]]]
}'

curl -X POST "$BASE_URL/api/field-analysis/update-field" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldId\": \"$FIELD_ID\",
    \"newBoundary\": $NEW_BOUNDARY,
    \"metadata\": {
      \"crop\": \"Rice\",
      \"season\": \"Monsoon\",
      \"farmer_name\": \"John Doe\"
    }
  }" | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

# Example 5: Recalculate NDVI for Specific Date
echo "5️⃣  Recalculate NDVI for Specific Date"
echo "---"
curl -X POST "$BASE_URL/api/field-analysis/recalculate-ndvi" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldId\": \"$FIELD_ID\",
    \"date\": \"2025-06-15\"
  }" | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

# Example 6: Get Field Data
echo "6️⃣  Get Field Data"
echo "---"
curl -X GET "$BASE_URL/api/field-analysis/field-data/$FIELD_ID" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

# Example 7: Get Change History
echo "7️⃣  Get Change History"
echo "---"
curl -X GET "$BASE_URL/api/field-analysis/change-history/$FIELD_ID" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

# Example 8: Generate Field Image for Multiple Dates
echo "8️⃣  Generate Field Images for Multiple Dates"
echo "---"
for date in "2024-01-15" "2024-06-15" "2025-01-15"; do
  echo "Generating image for $date..."
  curl -X POST "$BASE_URL/api/field-analysis/field-image" \
    -H "Content-Type: application/json" \
    -d "{
      \"fieldBoundary\": $FIELD_BOUNDARY,
      \"fieldId\": \"$FIELD_ID\",
      \"date\": \"$date\"
    }" | jq '.data | {date, mean_ndvi, map_id}' 2>/dev/null || echo "Error"
  echo ""
done

echo "=========================================="
echo "✅ All examples completed!"
echo "=========================================="

