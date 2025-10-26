const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const FieldAnalysisService = require('./services/fieldAnalysisService');
const NDVITimeSeriesService = require('./services/ndviTimeSeriesService');
const NDVITimeSeriesMapService = require('./services/ndviTimeSeriesMapService');
const NDVITwoYearTimeSeriesService = require('./services/ndviTwoYearTimeSeriesService');
const FieldDataUpdateService = require('./services/fieldDataUpdateService');

const app = express();
const PORT = process.env.PORT || 3000;

// Load Earth Engine credentials
let ee;
let eeInitialized = false;
let fieldAnalysisService;
let ndviTimeSeriesService;
let ndviTimeSeriesMapService;
let ndviTwoYearTimeSeriesService;
let fieldDataUpdateService;

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
            // Initialize field analysis service
            fieldAnalysisService = new FieldAnalysisService(ee);
            console.log('✅ Field Analysis Service initialized');
            // Initialize NDVI time series service
            ndviTimeSeriesService = new NDVITimeSeriesService(ee);
            console.log('✅ NDVI Time Series Service initialized');
            // Initialize NDVI time series map service
            ndviTimeSeriesMapService = new NDVITimeSeriesMapService(ee);
            console.log('✅ NDVI Time Series Map Service initialized');
            // Initialize NDVI 2-year time series service
            ndviTwoYearTimeSeriesService = new NDVITwoYearTimeSeriesService(ee);
            console.log('✅ NDVI 2-Year Time Series Service initialized');
            // Initialize field data update service
            fieldDataUpdateService = new FieldDataUpdateService(ee, ndviTwoYearTimeSeriesService);
            console.log('✅ Field Data Update Service initialized');
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

// NDVI Time Series Map endpoint - Generate NDVI maps for time series
// ⚠️ IMPORTANT: This MUST come BEFORE /api/field-analysis to avoid route shadowing
app.post('/api/field-analysis/time-series-map', async (req, res) => {
  try {
    if (!eeInitialized || !ndviTimeSeriesMapService) {
      return res.status(503).json({
        success: false,
        error: 'Earth Engine not initialized yet. Please try again in a moment.'
      });
    }

    const { fieldBoundary, fieldId, startDate, endDate, intervalDays } = req.body;

    // Validate input
    if (!fieldBoundary || !fieldId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fieldBoundary and fieldId'
      });
    }

    if (fieldBoundary.type !== 'Polygon') {
      return res.status(400).json({
        success: false,
        error: 'Only Polygon geometries are supported'
      });
    }

    // Set default dates if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const interval = intervalDays || 10;

    console.log(`🗺️  Generating time series maps for field ${fieldId} from ${start} to ${end} with ${interval}-day intervals`);

    // Generate time series maps
    const mapsResult = await ndviTimeSeriesMapService.generateTimeSeriesMaps(
      fieldBoundary,
      fieldId,
      start,
      end,
      interval
    );

    res.json({
      success: true,
      data: mapsResult,
      message: 'Time series maps generated successfully'
    });

  } catch (error) {
    console.error('Error generating time series maps:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// NDVI Time Series endpoint - Generate historical NDVI trends
// ⚠️ IMPORTANT: This MUST come BEFORE /api/field-analysis to avoid route shadowing
app.post('/api/field-analysis/time-series', async (req, res) => {
  try {
    if (!eeInitialized || !ndviTimeSeriesService) {
      return res.status(503).json({
        success: false,
        error: 'Earth Engine not initialized yet. Please try again in a moment.'
      });
    }

    const { fieldBoundary, fieldId, startDate, endDate, intervalDays } = req.body;

    // Validate input
    if (!fieldBoundary || !fieldId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fieldBoundary and fieldId'
      });
    }

    if (fieldBoundary.type !== 'Polygon') {
      return res.status(400).json({
        success: false,
        error: 'Only Polygon geometries are supported'
      });
    }

    // Set default dates if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const interval = intervalDays || 10; // Default to 10 days

    console.log(`📈 Generating time series for field ${fieldId} from ${start} to ${end} with ${interval}-day intervals`);

    // Generate time series
    const timeSeriesResult = await ndviTimeSeriesService.generateTimeSeries(
      fieldBoundary,
      fieldId,
      start,
      end,
      interval
    );

    res.json({
      success: true,
      data: timeSeriesResult,
      message: 'Time series generated successfully'
    });

  } catch (error) {
    console.error('Error generating time series:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Field Analysis endpoint - Analyze NDVI for farm field boundaries
app.post('/api/field-analysis', async (req, res) => {
  try {
    if (!eeInitialized || !fieldAnalysisService) {
      return res.status(503).json({
        success: false,
        error: 'Earth Engine not initialized yet. Please try again in a moment.'
      });
    }

    const { fieldBoundary, fieldId, startDate, endDate } = req.body;

    // Validate input
    if (!fieldBoundary || !fieldId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fieldBoundary and fieldId'
      });
    }

    if (fieldBoundary.type !== 'Polygon') {
      return res.status(400).json({
        success: false,
        error: 'Only Polygon geometries are supported'
      });
    }

    // Set default dates if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`📊 Analyzing field ${fieldId} from ${start} to ${end}`);

    // Perform analysis
    const analysisResult = await fieldAnalysisService.analyzeFieldNDVI(
      fieldBoundary,
      fieldId,
      start,
      end
    );

    res.json({
      success: true,
      data: analysisResult,
      message: 'Field analysis completed successfully'
    });

  } catch (error) {
    console.error('Error analyzing field:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 2-Year NDVI Time Series endpoint
app.post('/api/field-analysis/two-year-time-series', async (req, res) => {
  try {
    if (!eeInitialized || !ndviTwoYearTimeSeriesService) {
      return res.status(503).json({
        success: false,
        error: 'Earth Engine not initialized yet. Please try again in a moment.'
      });
    }

    const { fieldBoundary, fieldId, intervalType } = req.body;

    // Validate input
    if (!fieldBoundary || !fieldId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fieldBoundary and fieldId'
      });
    }

    if (fieldBoundary.type !== 'Polygon') {
      return res.status(400).json({
        success: false,
        error: 'Only Polygon geometries are supported'
      });
    }

    const interval = intervalType || 'monthly'; // Default to monthly

    console.log(`📊 Generating 2-year time series for field ${fieldId} with ${interval} intervals`);

    // Generate 2-year time series
    const timeSeriesResult = await ndviTwoYearTimeSeriesService.generateTwoYearTimeSeries(
      fieldBoundary,
      fieldId,
      interval
    );

    res.json({
      success: true,
      data: timeSeriesResult,
      message: '2-year time series generated successfully'
    });

  } catch (error) {
    console.error('Error generating 2-year time series:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// NDVI Field Image endpoint
app.post('/api/field-analysis/field-image', async (req, res) => {
  try {
    if (!eeInitialized || !ndviTwoYearTimeSeriesService) {
      return res.status(503).json({
        success: false,
        error: 'Earth Engine not initialized yet. Please try again in a moment.'
      });
    }

    const { fieldBoundary, fieldId, date } = req.body;

    // Validate input
    if (!fieldBoundary || !fieldId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fieldBoundary, fieldId, and date'
      });
    }

    if (fieldBoundary.type !== 'Polygon') {
      return res.status(400).json({
        success: false,
        error: 'Only Polygon geometries are supported'
      });
    }

    console.log(`🖼️  Generating field image for field ${fieldId} on ${date}`);

    // Generate field image
    const fieldImage = await ndviTwoYearTimeSeriesService.generateFieldImage(
      fieldBoundary,
      fieldId,
      date
    );

    res.json({
      success: true,
      data: fieldImage,
      message: 'Field image generated successfully'
    });

  } catch (error) {
    console.error('Error generating field image:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update Field Data endpoint
app.post('/api/field-analysis/update-field', async (req, res) => {
  try {
    if (!eeInitialized || !fieldDataUpdateService) {
      return res.status(503).json({
        success: false,
        error: 'Earth Engine not initialized yet. Please try again in a moment.'
      });
    }

    const { fieldId, newBoundary, metadata } = req.body;

    // Validate input
    if (!fieldId || !newBoundary) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fieldId and newBoundary'
      });
    }

    console.log(`✏️  Updating field ${fieldId}`);

    // Update field boundary
    const updateResult = await fieldDataUpdateService.updateFieldBoundary(
      fieldId,
      newBoundary,
      metadata
    );

    res.json({
      success: true,
      data: updateResult,
      message: 'Field updated successfully'
    });

  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Recalculate NDVI endpoint
app.post('/api/field-analysis/recalculate-ndvi', async (req, res) => {
  try {
    if (!eeInitialized || !fieldDataUpdateService) {
      return res.status(503).json({
        success: false,
        error: 'Earth Engine not initialized yet. Please try again in a moment.'
      });
    }

    const { fieldId, date } = req.body;

    // Validate input
    if (!fieldId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fieldId and date'
      });
    }

    console.log(`🔄 Recalculating NDVI for field ${fieldId} on ${date}`);

    // Recalculate NDVI
    const recalculateResult = await fieldDataUpdateService.recalculateNDVI(
      fieldId,
      date
    );

    res.json({
      success: true,
      data: recalculateResult,
      message: 'NDVI recalculated successfully'
    });

  } catch (error) {
    console.error('Error recalculating NDVI:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Field Data endpoint
app.get('/api/field-analysis/field-data/:fieldId', (req, res) => {
  try {
    if (!fieldDataUpdateService) {
      return res.status(503).json({
        success: false,
        error: 'Field Data Update Service not initialized'
      });
    }

    const { fieldId } = req.params;
    const fieldData = fieldDataUpdateService.getFieldData(fieldId);

    res.json({
      success: true,
      data: fieldData,
      message: 'Field data retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving field data:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Get Change History endpoint
app.get('/api/field-analysis/change-history/:fieldId', (req, res) => {
  try {
    if (!fieldDataUpdateService) {
      return res.status(503).json({
        success: false,
        error: 'Field Data Update Service not initialized'
      });
    }

    const { fieldId } = req.params;
    const history = fieldDataUpdateService.getChangeHistory(fieldId);

    res.json({
      success: true,
      data: history,
      message: 'Change history retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving change history:', error);
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

