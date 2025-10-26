#!/bin/bash

# Time Series Image Storage API - cURL Examples
# These examples demonstrate how to use the time series image storage API

BASE_URL="http://localhost:3000"

echo "🌾 Time Series Image Storage API - cURL Examples"
echo "=================================================="
echo ""

# Example 1: Generate 2-Year Time Series with Images
echo "1️⃣  Generate 2-Year Time Series with Images"
echo "=============================================="
echo "Endpoint: POST /api/field-analysis/two-year-time-series"
echo ""
RESPONSE=$(curl -s -X POST "$BASE_URL/api/field-analysis/two-year-time-series" \
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
    "intervalType": "monthly"
  }')

echo "$RESPONSE" | jq '.'
SERIES_ID=$(echo "$RESPONSE" | jq -r '.data.series_id')
echo "Series ID: $SERIES_ID"
echo ""
echo ""

# Example 2: Get First Image Download URL
echo "2️⃣  Get First Image Download URL"
echo "=================================="
if [ "$SERIES_ID" != "null" ] && [ ! -z "$SERIES_ID" ]; then
  DOWNLOAD_URL=$(echo "$RESPONSE" | jq -r '.data.time_series[0].download_url')
  echo "Download URL: $DOWNLOAD_URL"
  echo "Full URL: $BASE_URL$DOWNLOAD_URL"
  echo ""
  echo ""
fi

# Example 3: List All Time Series
echo "3️⃣  List All Time Series"
echo "========================"
echo "Endpoint: GET /api/field-analysis/time-series-list"
echo ""
curl -s -X GET "$BASE_URL/api/field-analysis/time-series-list" | jq '.'
echo ""
echo ""

# Example 4: List Time Series for Specific Field
echo "4️⃣  List Time Series for Specific Field"
echo "========================================"
echo "Endpoint: GET /api/field-analysis/time-series-list?fieldId=NGR-KD-12345"
echo ""
curl -s -X GET "$BASE_URL/api/field-analysis/time-series-list?fieldId=NGR-KD-12345" | jq '.'
echo ""
echo ""

# Example 5: Get Time Series Metadata
echo "5️⃣  Get Time Series Metadata"
echo "============================="
echo "Endpoint: GET /api/field-analysis/time-series/:seriesId"
echo ""
if [ "$SERIES_ID" != "null" ] && [ ! -z "$SERIES_ID" ]; then
  echo "Getting metadata for series: $SERIES_ID"
  curl -s -X GET "$BASE_URL/api/field-analysis/time-series/$SERIES_ID" | jq '.'
else
  echo "Note: Replace :seriesId with actual series ID from Example 3"
  echo "Example: curl -X GET \"$BASE_URL/api/field-analysis/time-series/NGR-KD-12345_1698316800000\" | jq '.'"
fi
echo ""
echo ""

# Example 6: Get Storage Statistics
echo "6️⃣  Get Storage Statistics"
echo "==========================="
echo "Endpoint: GET /api/field-analysis/time-series-stats"
echo ""
curl -s -X GET "$BASE_URL/api/field-analysis/time-series-stats" | jq '.'
echo ""
echo ""

# Example 7: Download Specific Image
echo "7️⃣  Download Specific Image"
echo "============================"
echo "Endpoint: GET /time-series-images/:seriesId/:filename"
echo ""
if [ "$SERIES_ID" != "null" ] && [ ! -z "$SERIES_ID" ]; then
  DOWNLOAD_URL=$(echo "$RESPONSE" | jq -r '.data.time_series[0].download_url')
  echo "Downloading image from: $BASE_URL$DOWNLOAD_URL"
  echo ""
  curl -s -X GET "$BASE_URL$DOWNLOAD_URL" | jq '.'
else
  echo "Note: Replace with actual download URL from time series response"
fi
echo ""
echo ""

# Example 8: Delete Time Series
echo "8️⃣  Delete Time Series"
echo "======================="
echo "Endpoint: DELETE /api/field-analysis/time-series/:seriesId"
echo ""
if [ "$SERIES_ID" != "null" ] && [ ! -z "$SERIES_ID" ]; then
  echo "Note: Uncomment to delete series"
  echo "# curl -X DELETE \"$BASE_URL/api/field-analysis/time-series/$SERIES_ID\" | jq '.'"
else
  echo "Note: Replace :seriesId with actual series ID"
  echo "Example: curl -X DELETE \"$BASE_URL/api/field-analysis/time-series/NGR-KD-12345_1698316800000\" | jq '.'"
fi
echo ""
echo ""

# Example 9: Generate Weekly Time Series
echo "9️⃣  Generate Weekly Time Series with Images"
echo "============================================"
echo "Endpoint: POST /api/field-analysis/two-year-time-series"
echo ""
curl -s -X POST "$BASE_URL/api/field-analysis/two-year-time-series" \
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
    "fieldId": "NGR-KD-67890",
    "intervalType": "weekly"
  }' | jq '.data | {series_id, total_data_points, storage_info}'
echo ""
echo ""

# Example 10: Batch Download All Images from Series
echo "🔟 Batch Download All Images from Series"
echo "=========================================="
echo "Script to download all images from a series:"
echo ""
echo "#!/bin/bash"
echo "SERIES_ID=\"$SERIES_ID\""
echo "curl -s \"$BASE_URL/api/field-analysis/time-series/\$SERIES_ID\" | jq -r '.data.storage_path' | while read path; do"
echo "  echo \"Downloading images from: \$path\""
echo "done"
echo ""
echo ""

echo "✅ All examples completed!"
echo ""
echo "📝 Notes:"
echo "- Replace fieldId with your actual field ID"
echo "- Replace coordinates with your actual field boundary"
echo "- Use 'jq' for pretty JSON output (install with: brew install jq)"
echo "- Download URLs are valid for direct access"
echo "- Images are stored in: public/time-series-images/"
echo ""

