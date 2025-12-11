#!/bin/bash

# Test Productivity Differences API
# This script tests the productivity differences analysis API

echo "🧪 Testing Productivity Differences API..."
echo ""

# Test field boundary (Italy rice field)
FIELD_BOUNDARY='{
  "type": "Polygon",
  "coordinates": [
    [
      [9.1, 45.4],
      [9.2, 45.4],
      [9.2, 45.5],
      [9.1, 45.5],
      [9.1, 45.4]
    ]
  ]
}'

# Make API request
curl --location 'http://localhost:3000/api/field-analysis/productivity-differences' \
--header 'Content-Type: application/json' \
--data "{
  \"fieldBoundary\": $FIELD_BOUNDARY,
  \"fieldId\": \"TEST-PRODUCTIVITY-ZONES\",
  \"gridSize\": 100
}" | python3 -m json.tool

echo ""
echo "✅ Test complete!"

