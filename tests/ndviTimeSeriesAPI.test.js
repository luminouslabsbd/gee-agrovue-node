/**
 * NDVI Time Series API Integration Tests
 * Tests for the time series API endpoint
 */

const request = require('supertest');
const express = require('express');
const NDVITimeSeriesService = require('../services/ndviTimeSeriesService');

// Test field boundary
const testFieldBoundary = {
  type: 'Polygon',
  coordinates: [[
    [90.37110641598703, 23.841231509287553],
    [90.37093743681908, 23.84014467798467],
    [90.37123516201974, 23.84014713133873],
    [90.3713531792164, 23.840186384997345],
    [90.37110641598703, 23.841231509287553]
  ]]
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
      size: function() {
        return {
          getInfo: () => 1
        };
      },
      first: function() {
        return {
          select: (band) => ({
            reduceRegion: (config) => ({
              getInfo: () => ({
                NDVI_mean: 0.68,
                NDVI_stdDev: 0.12,
                NDVI_min: 0.35,
                NDVI_max: 0.85
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
          normalizedDifference: function(bands) {
            return {
              rename: function(name) {
                return {
                  reduceRegion: (config) => ({
                    getInfo: () => ({
                      NDVI_mean: 0.68,
                      NDVI_stdDev: 0.12,
                      NDVI_min: 0.35,
                      NDVI_max: 0.85
                    })
                  })
                };
              }
            };
          },
          addBands: function() { return this; }
        };
      }
    }),
    Filter: {
      lt: (prop, value) => ({})
    },
    Reducer: {
      mean: () => ({
        combine: function() { return this; }
      }),
      stdDev: () => ({
        combine: function() { return this; }
      }),
      min: () => ({
        combine: function() { return this; }
      }),
      max: () => ({
        combine: function() { return this; }
      }),
      count: () => ({})
    }
  };
};

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());

  const mockEE = createMockEE();
  const ndviTimeSeriesService = new NDVITimeSeriesService(mockEE);

  app.post('/api/field-analysis/time-series', async (req, res) => {
    try {
      const { fieldBoundary, fieldId, startDate, endDate, intervalDays } = req.body;

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
      const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const interval = intervalDays || 10;

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
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return app;
}

describe('NDVI Time Series API Endpoint', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/field-analysis/time-series', () => {
    test('should return 400 if fieldBoundary is missing', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series')
        .send({
          fieldId: 'NGR-KD-12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should return 400 if fieldId is missing', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series')
        .send({
          fieldBoundary: testFieldBoundary
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should return 400 for non-Polygon geometry', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series')
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

    test('should generate time series with valid input', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          intervalDays: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('field_id', 'NGR-KD-12345');
      expect(response.body.data).toHaveProperty('time_series');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('trends');
    });

    test('should have correct time series structure', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          intervalDays: 10
        });

      const data = response.body.data;
      expect(data.start_date).toBe('2025-01-01');
      expect(data.end_date).toBe('2025-12-31');
      expect(data.interval_days).toBe(10);
      expect(Array.isArray(data.time_series)).toBe(true);
    });

    test('should have correct statistics structure', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          intervalDays: 10
        });

      const stats = response.body.data.statistics;
      expect(stats).toHaveProperty('mean_ndvi');
      expect(stats).toHaveProperty('std_ndvi');
      expect(stats).toHaveProperty('min_ndvi');
      expect(stats).toHaveProperty('max_ndvi');
      expect(stats).toHaveProperty('data_points');
    });

    test('should have correct trends structure', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          intervalDays: 10
        });

      const trends = response.body.data.trends;
      expect(trends).toHaveProperty('trend');
      expect(trends).toHaveProperty('slope');
      expect(trends).toHaveProperty('r_squared');
      expect(trends).toHaveProperty('interpretation');
    });

    test('should have correct metadata structure', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          intervalDays: 10
        });

      const metadata = response.body.data.metadata;
      expect(metadata).toHaveProperty('data_source', 'Sentinel-2');
      expect(metadata).toHaveProperty('spatial_resolution', '10m');
      expect(metadata).toHaveProperty('cloud_filter', '< 30%');
      expect(metadata).toHaveProperty('generated_at');
    });

    test('should support different intervals', async () => {
      for (const interval of [5, 10, 15, 30]) {
        const response = await request(app)
          .post('/api/field-analysis/time-series')
          .send({
            fieldBoundary: testFieldBoundary,
            fieldId: 'NGR-KD-12345',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            intervalDays: interval
          });

        expect(response.status).toBe(200);
        expect(response.body.data.interval_days).toBe(interval);
      }
    });

    test('should reject invalid interval', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          intervalDays: 7
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid interval');
    });

    test('should reject date range exceeding 2 years', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series')
        .send({
          fieldBoundary: testFieldBoundary,
          fieldId: 'NGR-KD-12345',
          startDate: '2023-01-01',
          endDate: '2025-12-31',
          intervalDays: 10
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('exceeds maximum');
    });
  });
});

