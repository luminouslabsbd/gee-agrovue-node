#!/bin/bash

echo "=== Testing Authentication System ==="
echo ""

# Test 1: Register a new user
echo "1. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Test123456",
    "phone": "+1234567890",
    "country": "USA"
  }')

echo "$REGISTER_RESPONSE"
echo ""

# Extract token from registration response
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed - no token received"
  echo ""
  
  # Try login instead
  echo "2. Testing User Login..."
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "john@example.com",
      "password": "Test123456"
    }')
  
  echo "$LOGIN_RESPONSE"
  echo ""
  
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -n "$TOKEN" ]; then
  echo "✅ Token received: ${TOKEN:0:50}..."
  echo ""
  
  # Test 3: Get user profile
  echo "3. Testing Protected Endpoint (Get Profile)..."
  curl -s -X GET http://localhost:3000/api/auth/me \
    -H "Authorization: Bearer $TOKEN"
  echo ""
  echo ""
  
  # Test 4: Test field analysis with token
  echo "4. Testing Protected API (Field Analysis)..."
  curl -s -X POST http://localhost:3000/api/field-analysis \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "fieldBoundary": {
        "type": "Polygon",
        "coordinates": [[[90.0, 23.0], [90.1, 23.0], [90.1, 23.1], [90.0, 23.1], [90.0, 23.0]]]
      },
      "fieldId": "test-field-001"
    }'
  echo ""
  echo ""
else
  echo "❌ No token received - authentication failed"
fi

echo "=== Test Complete ==="

