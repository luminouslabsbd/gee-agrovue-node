# Google Earth Engine Service Account Setup

## Overview

This document describes how the Google Earth Engine service account credentials have been integrated into the Node.js project.

## Credentials Information

**Project**: marine-pillar-465804-p5  
**Service Account Email**: imteaj@marine-pillar-465804-p5.iam.gserviceaccount.com  
**Authentication Method**: Private Key (Service Account)

## Files Modified/Created

### 1. `credentials.json` (NEW)
- Contains the service account credentials
- Automatically loaded by the server on startup
- Includes private key for authentication

### 2. `server.js` (MODIFIED)
- Added `initializeEarthEngine()` function
- Authenticates with Earth Engine using service account credentials
- Sets `eeInitialized` flag when ready
- Added `/api/ee-status` endpoint to check initialization status

**Key Changes**:
```javascript
// Load and authenticate with service account
ee.data.authenticateViaPrivateKey(
  credentials,
  () => {
    console.log('✅ Earth Engine authenticated with service account');
    ee.initialize(...);
  },
  (error) => {
    console.error('❌ Authentication error:', error);
  }
);
```

### 3. `public/app.js` (MODIFIED)
- Added `checkEarthEngineStatus()` function
- Polls `/api/ee-status` endpoint to verify initialization
- Updates UI with Earth Engine status
- Retries every 2 seconds until initialized

### 4. `.env` (MODIFIED)
- Added `GEE_PROJECT_ID` environment variable
- Added `GEE_SERVICE_ACCOUNT_EMAIL` environment variable

### 5. `README.md` (MODIFIED)
- Updated installation instructions
- Added service account credentials section
- Added security warnings
- Enhanced troubleshooting guide

## How It Works

### Server Startup Flow

1. **Load Credentials**
   ```
   credentials.json → Parse JSON → Load into memory
   ```

2. **Authenticate**
   ```
   Private Key → Google OAuth 2.0 → Access Token
   ```

3. **Initialize Earth Engine**
   ```
   Access Token → ee.initialize() → Ready for API calls
   ```

4. **Server Ready**
   ```
   All endpoints can now access Earth Engine datasets
   ```

### API Endpoints

#### `/api/health`
Returns server and Earth Engine status
```json
{
  "status": "ok",
  "message": "Server is running",
  "earthEngineInitialized": true
}
```

#### `/api/ee-status`
Returns Earth Engine initialization status
```json
{
  "initialized": true,
  "projectId": "marine-pillar-465804-p5",
  "message": "Earth Engine is ready"
}
```

#### `/api/ndvi`
Fetches NDVI (Vegetation Index) data
```json
{
  "success": true,
  "mapId": { ... },
  "message": "NDVI data retrieved successfully"
}
```

#### `/api/satellite`
Fetches Sentinel-2 satellite imagery
```json
{
  "success": true,
  "mapId": { ... },
  "message": "Satellite imagery retrieved successfully"
}
```

## Frontend Status Display

The frontend shows Earth Engine status in the info panel:
- **✓ Connected | 🌍 EE Ready** - Earth Engine is initialized
- **✓ Connected | ⏳ EE Initializing...** - Waiting for initialization
- **✗ Disconnected** - Server connection failed

## Testing

### Test Server Health
```bash
curl http://localhost:3000/api/health
```

### Test Earth Engine Status
```bash
curl http://localhost:3000/api/ee-status
```

### Test NDVI Data
```bash
curl http://localhost:3000/api/ndvi
```

### Test Satellite Data
```bash
curl http://localhost:3000/api/satellite
```

## Security Considerations

### ⚠️ Important Security Notes

1. **Credentials File**
   - `credentials.json` contains sensitive private key
   - Should be added to `.gitignore` in production
   - Never commit to version control
   - Restrict file permissions: `chmod 600 credentials.json`

2. **Environment Variables**
   - Consider moving credentials to environment variables
   - Use secure vaults (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Rotate credentials periodically

3. **API Rate Limiting**
   - Implement rate limiting for production
   - Monitor API usage
   - Set up billing alerts

4. **Access Control**
   - Restrict API endpoints to authorized users
   - Implement authentication/authorization
   - Use HTTPS in production

## Troubleshooting

### Server Won't Start
```
Error: ENOENT: no such file or directory, open 'credentials.json'
```
**Solution**: Ensure `credentials.json` exists in the project root

### Authentication Fails
```
Error: Request is missing required authentication credential
```
**Solution**: Verify credentials.json contains valid private key

### Earth Engine Not Initializing
```
⏳ EE Initializing... (stuck)
```
**Solution**: 
1. Check server logs for errors
2. Verify credentials are valid
3. Check internet connection
4. Restart the server

## Next Steps

1. **Production Deployment**
   - Move credentials to environment variables
   - Implement proper error handling
   - Add request logging and monitoring

2. **Feature Enhancement**
   - Add more Earth Engine datasets
   - Implement custom region selection
   - Add data export functionality

3. **Performance Optimization**
   - Cache Earth Engine responses
   - Implement request queuing
   - Add compression middleware

## References

- [Google Earth Engine Documentation](https://developers.google.com/earth-engine)
- [Earth Engine API Reference](https://developers.google.com/earth-engine/apidocs)
- [Service Account Authentication](https://developers.google.com/earth-engine/guides/service_account)
- [Node.js Earth Engine Library](https://github.com/google/earthengine-api)

