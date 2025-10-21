/**
 * Integration Tests for Field Analysis API Endpoint
 */

const request = require('supertest');
const express = require('express');
const FieldAnalysisService = require('../services/fieldAnalysisService');

// Create a test app
const createTestApp = (eeInitialized, fieldAnalysisService) => {
  const app = express();
  app.use(express.json());

  // Mock middleware to set initialization status
  app.use((req, res, next) => {
    req.eeInitialized = eeInitialized;
    req.fieldAnalysisService = fieldAnalysisService;
    next();
  });

  // Field Analysis endpoint
  app.post('/api/field-analysis', async (req, res) => {
    try {
      if (!req.eeInitialized || !req.fieldAnalysisService) {
        return res.status(503).json({
          success: false,
          error: 'Earth Engine not initialized yet. Please try again in a moment.'
        });
      }

      const { fieldBoundary, fieldId, startDate, endDate } = req.body;

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

      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const analysisResult = await req.fieldAnalysisService.analyzeFieldNDVI(
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
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return app;
};

// Mock Earth Engine
const createMockEE = () => {
  return {
    Geometry: {
      Polygon: (coords) => ({
        area: (options) => ({
          getInfo: () => 50000
        })
      })
    },
    ImageCollection: (name) => ({
      filterBounds: function() { return this; },
      filterDate: function() { return this; },
      filter: function() { return this; },
      map: function(fn) { return this; },
      sort: function() { return this; },
      size: function() { return { getInfo: () => 1 }; },
      first: function() {
        return {
          select: (band) => ({
            reduceRegion: (config) => ({
              getInfo: () => ({
                NDVI_mean: 0.68,
                NDVI_stdDev: 0.12,
                NDVI_min: 0.35,
                NDVI_max: 0.85,
                NDVI_median: 0.68,
                NDVI_p25: 0.62,
                NDVI_p75: 0.74
              })
            })
          }),
          get: (prop) => ({
            getInfo: () => {
              if (prop === 'CLOUDY_PIXEL_PERCENTAGE') return 8.5;
              if (prop === 'system:time_start') return 1697289600000;
              return null;
            }
          }),
          addBands: function() { return this; }
        };
      }
    }),
    Filter: {
      lt: (prop, value) => ({})
    },
    Reducer: {
      mean: () => ({ combine: function() { return this; } }),
      stdDev: () => ({ combine: function() { return this; } }),
      min: () => ({ combine: function() { return this; } }),
      max: () => ({ combine: function() { return this; } }),
      median: () => ({ combine: function() { return this; } }),
      percentile: (values) => ({ combine: function() { return this; } }),
      count: () => ({})
    }
  };
};

const testFieldBoundary = {
  type: 'Polygon',
  coordinates: [[
    [90.37110641598703, 23.841231509287553],
    [90.37093743681908, 23.84014467798467],
    [90.37123516201974, 23.84014713133873],
    [90.3713531792164, 23.840186384997345],
    [90.37143632769585, 23.840105424313425],
    [90.37150606513023, 23.840120144441542],
    [90.37162408232689, 23.8403286794102],
    [90.37181988358499, 23.840316412656623],
    [90.37198618054391, 23.840529854003293],
    [90.37194058299067, 23.840890495480306],
    [90.37191644310953, 23.84110638921785],
    [90.37187889218332, 23.841135829245108],
    [90.3714242577553, 23.84087086875907],
    [90.37147387862206, 23.841177535938964],
    [90.37157043814659, 23.841177535938964],
    [90.37110641598703, 23.841231509287553]
  ]]
};

describe('Field Analysis API Endpoint', () => {
  let app;
  let mockEE;
  let fieldAnalysisService;

  beforeEach(() => {
    mockEE = createMockEE();
    fieldAnalysisService = new FieldAnalysisService(mockEE);
    app = createTestApp(true, fieldAnalysisService);
  });

  describe('POST /api/field-analysis', () => {
    test('should return 503 when Earth Engine not initialized', async () => {
      const uninitializedApp = createTestApp(false, null);
      const response = await request(uninitializedApp)
        .post('/api/field-analysis')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345'
        });

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not initialized');
    });

    test('should return 400 when fieldBoundary is missing', async () => {
      const response = await request(app)
        .post('/api/field-analysis')
        .send({
          fieldId: 'NGR-KD-12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should return 400 when fieldId is missing', async () => {
      const response = await request(app)
        .post('/api/field-analysis')
        .send({
          fieldBoundary: testFieldBoundary
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should return 400 for non-Polygon geometry', async () => {
      const response = await request(app)
        .post('/api/field-analysis')
        .send({
          fieldBoundary: {
            type: 'Point',
            coordinates: [90.37, 23.84]
          },
          fieldId: 'NGR-KD-12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only Polygon geometries are supported');
    });

    test('should return 200 with analysis data for valid request', async () => {
      const response = await request(app)
        .post('/api/field-analysis')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345',
          startDate: '2025-10-01',
          endDate: '2025-10-15'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toContain('successfully');
    });

    test('should return correct data structure', async () => {
      const response = await request(app)
        .post('/api/field-analysis')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345'
        });

      const data = response.body.data;
      expect(data.field_id).toBe('NGR-KD-12345');
      expect(data.date).toBeDefined();
      expect(data.ndvi).toBeDefined();
      expect(data.quality).toBeDefined();
      expect(data.interpretation).toBeDefined();
      expect(data.hectares).toBeDefined();
    });

    test('should have correct NDVI statistics', async () => {
      const response = await request(app)
        .post('/api/field-analysis')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345'
        });

      const ndvi = response.body.data.ndvi;
      expect(ndvi.mean).toBe(0.68);
      expect(ndvi.std).toBe(0.12);
      expect(ndvi.min).toBe(0.35);
      expect(ndvi.max).toBe(0.85);
      expect(ndvi.median).toBe(0.68);
      expect(ndvi.p25).toBe(0.62);
      expect(ndvi.p75).toBe(0.74);
    });

    test('should have correct quality information', async () => {
      const response = await request(app)
        .post('/api/field-analysis')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345'
        });

      const quality = response.body.data.quality;
      expect(quality.cloud_cover).toBe(8.5);
      expect(quality.data_source).toBe('Sentinel-2');
      expect(quality.confidence).toBeGreaterThan(0);
      expect(quality.confidence).toBeLessThanOrEqual(1);
    });

    test('should have correct health interpretation', async () => {
      const response = await request(app)
        .post('/api/field-analysis')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345'
        });

      const interpretation = response.body.data.interpretation;
      expect(interpretation.health_status).toBe('Healthy');
      expect(interpretation.health_score).toBe(85);
      expect(Array.isArray(interpretation.alerts)).toBe(true);
    });
  });
});

