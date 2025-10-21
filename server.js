const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load Earth Engine credentials
let ee;
let eeInitialized = false;

async function initializeEarthEngine() {
  try {
    ee = require('@google/earthengine');

    // Load service account credentials
    const credentialsPath = path.join(__dirname, 'credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    // Initialize Earth Engine with service account credentials
    ee.data.authenticateViaPrivateKey(
      credentials,
      () => {
        console.log('✅ Earth Engine authenticated with service account');

        // Initialize after authentication
        ee.initialize(
          null,
          null,
          () => {
            console.log('✅ Earth Engine initialized successfully');
            eeInitialized = true;
          },
          (error) => {
            console.error('❌ Earth Engine initialization error:', error);
          }
        );
      },
      (error) => {
        console.error('❌ Authentication error:', error);
      }
    );

  } catch (error) {
    console.error('Error initializing Earth Engine:', error);
  }
}

// Initialize Earth Engine on startup
initializeEarthEngine();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get Earth Engine data
app.get('/api/ndvi', async (req, res) => {
  try {
    if (!eeInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Earth Engine not initialized yet. Please try again in a moment.'
      });
    }

    // Example: Get NDVI data for a region
    const geometry = ee.Geometry.Rectangle([-120, 40, -119, 41]); // Example coordinates
    const dataset = ee.ImageCollection('MODIS/006/MOD13Q1')
      .filterBounds(geometry)
      .filterDate('2023-01-01', '2023-12-31')
      .select('NDVI');

    const ndvi = dataset.mean();

    // Get the data URL for visualization
    const visParams = {
      min: 0,
      max: 9000,
      palette: ['blue', 'white', 'green']
    };

    const mapId = ndvi.getMapId(visParams);

    res.json({
      success: true,
      mapId: mapId,
      message: 'NDVI data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching Earth Engine data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to get satellite imagery
app.get('/api/satellite', async (req, res) => {
  try {
    if (!eeInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Earth Engine not initialized yet. Please try again in a moment.'
      });
    }

    // Example: Get Sentinel-2 satellite imagery
    const geometry = ee.Geometry.Rectangle([-120, 40, -119, 41]);
    const dataset = ee.ImageCollection('COPERNICUS/S2_SR')
      .filterBounds(geometry)
      .filterDate('2023-06-01', '2023-08-31')
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
      .select(['B4', 'B3', 'B2']); // Red, Green, Blue bands

    const image = dataset.median();

    const visParams = {
      min: 0,
      max: 3000,
      gamma: 1.4
    };

    const mapId = image.getMapId(visParams);

    res.json({
      success: true,
      mapId: mapId,
      message: 'Satellite imagery retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching satellite data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    earthEngineInitialized: eeInitialized
  });
});

// Earth Engine status endpoint
app.get('/api/ee-status', (_, res) => {
  res.json({
    initialized: eeInitialized,
    projectId: 'marine-pillar-465804-p5',
    message: eeInitialized ? 'Earth Engine is ready' : 'Earth Engine is initializing...'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌍 Google Earth Engine Server running on http://localhost:${PORT}`);
  console.log(`📍 Open your browser and navigate to http://localhost:${PORT}`);
  console.log(`\n⚠️  Note: To use Earth Engine data, you need to authenticate first:`);
  console.log(`   Run: npx ee authenticate`);
});

