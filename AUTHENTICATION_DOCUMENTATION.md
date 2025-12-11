# 🔐 Authentication System Documentation

## Overview

This project implements a complete **JWT-based authentication system** with MongoDB integration. All API endpoints are protected with Bearer token authentication.

---

## 🎯 Features

✅ **User Registration** - Create new user accounts with validation  
✅ **User Login** - Authenticate and receive JWT tokens  
✅ **Protected APIs** - All endpoints require valid authentication  
✅ **MongoDB Integration** - User data and analysis results stored in database  
✅ **API Usage Tracking** - Monitor user API consumption  
✅ **Role-Based Access** - Support for admin, farmer, agronomist, viewer roles  
✅ **Token Expiration** - 7-day token validity (configurable)  

---

## 📋 User Model

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | String | Yes | Unique user identifier (UUID) |
| `email` | String | Yes | User email (unique, validated) |
| `password` | String | Yes | Hashed password (bcrypt) |
| `name` | String | Yes | Full name |
| `phone` | String | Yes | Phone number |
| `country` | String | Yes | Country name |
| `status` | String | No | active, inactive, suspended (default: active) |
| `role` | String | No | admin, farmer, agronomist, viewer (default: farmer) |
| `fields` | Array | No | Array of field IDs owned by user |
| `preferences` | Object | No | User preferences (notifications, language, units) |
| `last_login` | Date | No | Last login timestamp |
| `api_usage` | Object | No | API usage tracking |

### Password Requirements

- Minimum 6 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number

---

## 🔑 Authentication Endpoints

### 1. Register New User

**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Test123456",
  "phone": "+1234567890",
  "country": "USA",
  "status": "active"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": "user_93d8b80a-f676-43d5-8bef-ef949d9f1633",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "country": "USA",
      "status": "active",
      "role": "farmer",
      "created_at": "2025-10-28T18:04:17.685Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Test123456",
    "phone": "+1234567890",
    "country": "USA"
  }'
```

---

### 2. Login User

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Test123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": "user_93d8b80a-f676-43d5-8bef-ef949d9f1633",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "farmer",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Test123456"
  }'
```

---

### 3. Get User Profile (Protected)

**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <your_token_here>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "user_93d8b80a-f676-43d5-8bef-ef949d9f1633",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "country": "USA",
      "status": "active",
      "role": "farmer",
      "api_usage": {
        "total_requests": 10,
        "monthly_limit": 10000,
        "current_month_usage": 5
      }
    }
  }
}
```

**cURL Example:**
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Update User Profile (Protected)

**PUT** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <your_token_here>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+9876543210",
  "country": "Canada"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "user_id": "user_93d8b80a-f676-43d5-8bef-ef949d9f1633",
      "email": "john@example.com",
      "name": "John Updated",
      "phone": "+9876543210",
      "country": "Canada"
    }
  }
}
```

---

## 🛡️ Protected API Endpoints

All the following endpoints require authentication. Include the Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_token_here>
```

### Field Analysis APIs (All Protected)

- `POST /api/field-analysis` - Analyze field NDVI
- `POST /api/field-analysis/time-series` - Get time series data
- `POST /api/field-analysis/two-year-time-series` - Get 2-year trends
- `POST /api/field-analysis/field-image` - Generate field image
- `POST /api/field-analysis/update-field` - Update field data
- `POST /api/field-analysis/recalculate-ndvi` - Recalculate NDVI
- `POST /api/field-analysis/export-ndvi-image` - Export NDVI image
- `POST /api/field-analysis/ndvi-chart` - Generate NDVI chart
- `POST /api/field-analysis/flood-detection` - Detect floods
- `POST /api/field-analysis/flood-time-series` - Flood time series
- `POST /api/field-analysis/zone-image` - Generate zone map

### Crop Analysis APIs (All Protected)

- `POST /api/crop-analysis/track-growth` - Track crop growth
- `POST /api/crop-analysis/classify-crop` - Classify crop type
- `POST /api/crop-analysis/performance` - Analyze performance
- `POST /api/crop-analysis/estimate-yield` - Estimate yield
- `POST /api/crop-analysis/detect-stress` - Detect crop stress
- `POST /api/crop-analysis/predict-yield` - Predict yield
- `POST /api/crop-analysis/forecast-growth` - Forecast growth
- `POST /api/crop-analysis/crop-chart` - Generate crop chart

---

## 🔧 Environment Variables

Add these to your `.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/gee-agrovue

# JWT Configuration
JWT_SECRET=gee-agrovue-super-secret-key-change-in-production-2024
JWT_EXPIRES_IN=7d
```

---

## 📊 MongoDB Collections

### users
Stores user authentication and profile data

### fields
Stores field boundaries and metadata (linked to users via `user_id`)

### fieldanalyses
Stores NDVI analysis results (linked to users via `user_id`)

---

## ✅ Testing

Run the authentication test script:

```bash
chmod +x test-auth.sh
./test-auth.sh
```

This will test:
1. User registration
2. User login
3. Protected endpoint access (profile)
4. Protected API access (field analysis)

---

## 🚨 Error Responses

### 401 Unauthorized
```json
{
  "error": "No authorization token provided"
}
```

### 403 Forbidden
```json
{
  "error": "User account is not active"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

## 🔐 Security Features

✅ **Password Hashing** - bcrypt with salt rounds: 10  
✅ **Token Expiration** - 7-day validity  
✅ **Password Excluded** - Never returned in API responses  
✅ **User Status Check** - Only active users can access APIs  
✅ **Input Validation** - express-validator for all inputs  
✅ **API Usage Tracking** - Monitor and limit API consumption  

---

## 📝 Notes

- **Express Version**: Downgraded to Express 4.x for compatibility
- **Token Storage**: Store tokens securely on client side
- **Token Refresh**: Implement token refresh logic as needed
- **Rate Limiting**: Consider adding rate limiting for production
- **HTTPS**: Use HTTPS in production for secure token transmission

---

## 🎉 Status

✅ **FULLY IMPLEMENTED AND TESTED**

All authentication features are working correctly with MongoDB integration!

