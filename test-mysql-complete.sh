#!/bin/bash

echo "========================================="
echo "🧪 MySQL Integration Test Suite"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
  local name=$1
  local method=$2
  local url=$3
  local data=$4
  local headers=$5
  
  echo -n "Testing: $name... "
  
  if [ "$method" = "POST" ]; then
    response=$(curl -s -X POST "$url" -H "Content-Type: application/json" $headers -d "$data")
  else
    response=$(curl -s -X GET "$url" $headers)
  fi
  
  if echo "$response" | grep -q '"success":true\|"status":"ok"'; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Response: $response"
    ((TESTS_FAILED++))
    return 1
  fi
}

echo "1️⃣  Testing Server Health..."
test_endpoint "Health Check" "GET" "http://localhost:3000/api/health"

echo ""
echo "2️⃣  Testing Authentication..."

# Register new user
echo -n "Registering test user... "
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test@123456",
    "phone": "+1234567890",
    "country": "Bangladesh"
  }')

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ PASSED${NC}"
  ((TESTS_PASSED++))
  TEST_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
  # User might already exist, try login
  echo -e "${YELLOW}⚠️  User exists, trying login...${NC}"
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "Test@123456"
    }')
  
  if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Login PASSED${NC}"
    ((TESTS_PASSED++))
    TEST_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
  fi
fi

# Admin login
echo -n "Admin login... "
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@agrovue.com",
    "password": "Admin@123456"
  }')

if echo "$ADMIN_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ PASSED${NC}"
  ((TESTS_PASSED++))
  ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $ADMIN_RESPONSE"
  ((TESTS_FAILED++))
fi

echo ""
echo "3️⃣  Testing Protected Endpoints..."

if [ -n "$ADMIN_TOKEN" ]; then
  # Test get profile
  test_endpoint "Get Profile" "GET" "http://localhost:3000/api/auth/me" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'"
  
  # Test field analysis
  echo -n "Field Analysis... "
  ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:3000/api/field-analysis \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "fieldBoundary": {
        "type": "Polygon",
        "coordinates": [[[90.371,23.841],[90.370,23.840],[90.371,23.840],[90.371,23.841]]]
      },
      "fieldId": "TEST-MYSQL-001"
    }')
  
  if echo "$ANALYSIS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
    
    # Check if saved to database
    if echo "$ANALYSIS_RESPONSE" | grep -q '"saved_to_db":true'; then
      echo -e "   ${GREEN}✅ Data saved to MySQL${NC}"
    else
      echo -e "   ${YELLOW}⚠️  Data not saved to MySQL${NC}"
    fi
  else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Response: $ANALYSIS_RESPONSE"
    ((TESTS_FAILED++))
  fi
else
  echo -e "${RED}❌ Skipping protected endpoint tests (no token)${NC}"
  ((TESTS_FAILED+=2))
fi

echo ""
echo "4️⃣  Testing Unauthorized Access..."
echo -n "Access without token... "
UNAUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/field-analysis \
  -H "Content-Type: application/json" \
  -d '{"fieldBoundary":{"type":"Polygon","coordinates":[[[90,23],[90,24],[91,24],[90,23]]]},"fieldId":"TEST"}')

if echo "$UNAUTH_RESPONSE" | grep -q '"error"'; then
  echo -e "${GREEN}✅ PASSED (correctly rejected)${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ FAILED (should be rejected)${NC}"
  ((TESTS_FAILED++))
fi

echo ""
echo "========================================="
echo "📊 Test Results"
echo "========================================="
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo "========================================="

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed${NC}"
  exit 1
fi
