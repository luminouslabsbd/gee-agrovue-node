#!/bin/bash

# NDVI Image Export API - cURL Examples
# These examples demonstrate how to use the NDVI Image Export API

BASE_URL="http://localhost:3000"

echo "🌾 NDVI Image Export API - cURL Examples"
echo "========================================"
echo ""

# Example 1: Export and Store NDVI Image
echo "1️⃣  Export and Store NDVI Image"
echo "================================"
echo "Endpoint: POST /api/field-analysis/export-ndvi-image"
echo ""
curl -X POST "$BASE_URL/api/field-analysis/export-ndvi-image" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.37110641598703, 23.841231509287553],
                       [90.37093743681908, 23.84014467798467],
                       [90.37123516201974, 23.84],
                       [90.3713531792164, 23.840186384997345],
                       [90.37110641598703, 23.841231509287553]]]
    },
    "fieldId": "NGR-KD-12345",
    "date": "2023-10-26"
  }' | jq '.'
echo ""
echo ""

# Example 2: Export NDVI Image for Different Date
echo "2️⃣  Export NDVI Image for Different Date"
echo "=========================================="
echo "Endpoint: POST /api/field-analysis/export-ndvi-image"
echo ""
curl -X POST "$BASE_URL/api/field-analysis/export-ndvi-image" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.37110641598703, 23.841231509287553],
                       [90.37093743681908, 23.84014467798467],
                       [90.37123516201974, 23.84],
                       [90.3713531792164, 23.840186384997345],
                       [90.37110641598703, 23.841231509287553]]]
    },
    "fieldId": "NGR-KD-12345",
    "date": "2024-05-15"
  }' | jq '.'
echo ""
echo ""

# Example 3: List All Stored Images
echo "3️⃣  List All Stored Images"
echo "==========================="
echo "Endpoint: GET /api/field-analysis/stored-images"
echo ""
curl -X GET "$BASE_URL/api/field-analysis/stored-images" | jq '.'
echo ""
echo ""

# Example 4: List Images for Specific Field
echo "4️⃣  List Images for Specific Field"
echo "===================================="
echo "Endpoint: GET /api/field-analysis/stored-images?fieldId=NGR-KD-12345"
echo ""
curl -X GET "$BASE_URL/api/field-analysis/stored-images?fieldId=NGR-KD-12345" | jq '.'
echo ""
echo ""

# Example 5: Get Storage Statistics
echo "5️⃣  Get Storage Statistics"
echo "==========================="
echo "Endpoint: GET /api/field-analysis/storage-stats"
echo ""
curl -X GET "$BASE_URL/api/field-analysis/storage-stats" | jq '.'
echo ""
echo ""

# Example 6: Get Stored Image Metadata
echo "6️⃣  Get Stored Image Metadata"
echo "=============================="
echo "Endpoint: GET /api/field-analysis/stored-image/:filename"
echo "Note: Replace 'filename' with actual filename from list"
echo ""
echo "Example (you need to get filename from Example 3 or 4):"
echo "curl -X GET \"$BASE_URL/api/field-analysis/stored-image/ndvi_NGR-KD-12345_2023-10-26_1698316800000.json\" | jq '.'"
echo ""
echo ""

# Example 7: Delete Stored Image
echo "7️⃣  Delete Stored Image"
echo "========================"
echo "Endpoint: DELETE /api/field-analysis/stored-image/:filename"
echo "Note: Replace 'filename' with actual filename"
echo ""
echo "Example (you need to get filename from Example 3 or 4):"
echo "curl -X DELETE \"$BASE_URL/api/field-analysis/stored-image/ndvi_NGR-KD-12345_2023-10-26_1698316800000.json\" | jq '.'"
echo ""
echo ""

# Example 8: Export Multiple Images for Same Field
echo "8️⃣  Export Multiple Images for Same Field (Batch)"
echo "=================================================="
echo "Exporting images for multiple dates..."
echo ""

DATES=("2023-10-26" "2023-11-26" "2023-12-26" "2024-01-26")

for date in "${DATES[@]}"; do
  echo "Exporting image for date: $date"
  curl -X POST "$BASE_URL/api/field-analysis/export-ndvi-image" \
    -H "Content-Type: application/json" \
    -d "{
      \"fieldBoundary\": {
        \"type\": \"Polygon\",
        \"coordinates\": [[[90.37110641598703, 23.841231509287553],
                           [90.37093743681908, 23.84014467798467],
                           [90.37123516201974, 23.84],
                           [90.3713531792164, 23.840186384997345],
                           [90.37110641598703, 23.841231509287553]]]
      },
      \"fieldId\": \"NGR-KD-12345\",
      \"date\": \"$date\"
    }" | jq '.data.filename'
  echo ""
done

echo ""
echo "✅ All examples completed!"
echo ""
echo "📝 Notes:"
echo "- Replace fieldId with your actual field ID"
echo "- Replace coordinates with your actual field boundary"
echo "- Replace dates with dates you want to analyze"
echo "- Use 'jq' for pretty JSON output (install with: brew install jq)"
echo ""

