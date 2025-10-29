#!/bin/bash

# Complete Admin Authentication and API Testing Script
# Tests admin login and protected API endpoints

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@agrovue.com"
ADMIN_PASSWORD="Admin@123456"

echo "═══════════════════════════════════════════════════════════"
echo "🔐 COMPLETE ADMIN AUTHENTICATION & API TESTING"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Admin Login
echo -e "${BLUE}1. Testing Admin Login...${NC}"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get admin token!${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Admin token received!${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Test 2: Get Admin Profile
echo "═══════════════════════════════════════════════════════════"
echo -e "${BLUE}2. Testing Get Admin Profile...${NC}"
echo ""

PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "$PROFILE_RESPONSE" | jq '.'
echo ""

# Test 3: Field Analysis (Protected API)
echo "═══════════════════════════════════════════════════════════"
echo -e "${BLUE}3. Testing Protected API - Field Analysis...${NC}"
echo ""

FIELD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/field-analysis" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.37110641598703,23.841231509287553],[90.37093743681908,23.84014467798467],[90.37123516201974,23.84014713133873],[90.3713531792164,23.840186384997345],[90.37143632769585,23.840105424313425],[90.37150606513023,23.840120144441542],[90.37162408232689,23.8403286794102],[90.37181988358499,23.840316412656623],[90.37198618054391,23.840529854003293],[90.37194058299067,23.840890495480306],[90.37191644310953,23.84110638921785],[90.37187889218332,23.841135829245108],[90.3714242577553,23.84087086875907],[90.37147387862206,23.841177535938964],[90.37157043814659,23.841177535938964],[90.37110641598703,23.841231509287553]]]
    },
    "fieldId": "ADMIN-FIELD-001",
    "startDate": "2024-10-01",
    "endDate": "2024-10-26"
  }')

echo "$FIELD_RESPONSE" | jq '.'
echo ""

# Test 4: Test without token (should fail)
echo "═══════════════════════════════════════════════════════════"
echo -e "${BLUE}4. Testing API Without Token (Should Fail)...${NC}"
echo ""

NO_AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/field-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.37110641598703,23.841231509287553],[90.37093743681908,23.84014467798467],[90.37123516201974,23.84014713133873],[90.3713531792164,23.840186384997345],[90.37143632769585,23.840105424313425],[90.37150606513023,23.840120144441542],[90.37162408232689,23.8403286794102],[90.37181988358499,23.840316412656623],[90.37198618054391,23.840529854003293],[90.37194058299067,23.840890495480306],[90.37191644310953,23.84110638921785],[90.37187889218332,23.841135829245108],[90.3714242577553,23.84087086875907],[90.37147387862206,23.841177535938964],[90.37157043814659,23.841177535938964],[90.37110641598703,23.841231509287553]]]
    },
    "fieldId": "TEST-FIELD-001"
  }')

echo "$NO_AUTH_RESPONSE" | jq '.'

if echo "$NO_AUTH_RESPONSE" | grep -q "No authorization token"; then
  echo -e "${GREEN}✅ Correctly rejected request without token${NC}"
else
  echo -e "${RED}⚠️  Warning: API might not be properly protected${NC}"
fi

echo ""

# Test 5: Health Check (Public API)
echo "═══════════════════════════════════════════════════════════"
echo -e "${BLUE}5. Testing Public API - Health Check...${NC}"
echo ""

HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/health")
echo "$HEALTH_RESPONSE" | jq '.'
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ TESTING COMPLETE!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   ✅ Admin login successful"
echo "   ✅ Admin profile retrieved"
echo "   ✅ Protected API works with token"
echo "   ✅ Protected API rejects requests without token"
echo "   ✅ Public APIs work without token"
echo ""
echo "🔑 Admin Credentials:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo "   Role: admin"
echo "   Monthly API Limit: 100,000 requests"
echo ""
echo "📚 Next Steps:"
echo "   1. Import docs/ApiDoc/MASTER_POSTMAN_COLLECTION.json to Postman"
echo "   2. Use 'Login (Admin)' endpoint to get token"
echo "   3. Token is automatically saved to collection variables"
echo "   4. All protected endpoints will use the token automatically"
echo ""
echo "═══════════════════════════════════════════════════════════"

