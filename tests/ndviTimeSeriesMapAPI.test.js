/**
 * NDVI Time Series Map API Integration Tests
 * Tests for the /api/field-analysis/time-series-map endpoint
 */

const request = require('supertest');
const express = require('express');
const NDVITimeSeriesMapService = require('../services/ndviTimeSeriesMapService');

describe('NDVI Time Series Map API Endpoint', () => {
  let app;
  let mockEE;
  let ndviTimeSeriesMapService;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock Earth Engine
    mockEE = {
      Geometry: {
        Polygon: jest.fn((coords) => ({
          type: 'Polygon',
          coordinates: coords
        }))
      },
      ImageCollection: jest.fn(() => ({
        filterBounds: jest.fn(function() { return this; }),
        filterDate: jest.fn(function() { return this; }),
        filter: jest.fn(function() { return this; }),
        sort: jest.fn(function() { return this; }),
        size: jest.fn(() => ({
          getInfo: jest.fn(() => 5)
        })),
        first: jest.fn(() => ({
          normalizedDifference: jest.fn(() => ({
            rename: jest.fn(() => ({
              getMapId: jest.fn(() => ({
                mapid: 'test-map-id',
                token: 'test-token'
              })),
              reduceRegion: jest.fn(() => ({
                getInfo: jest.fn(() => ({
                  NDVI: 0.45,
                  NDVI_stdDev: 0.08,
                  NDVI_min: 0.25,
                  NDVI_max: 0.65
                }))
              }))
            }))
          })),
          addBands: jest.fn(function() { return this; })
        })),
        map: jest.fn(function() { return this; })
      })),
      Filter: {
        lt: jest.fn(() => ({}))
      },
      Reducer: {
        mean: jest.fn(() => ({
          combine: jest.fn(function() { return this; })
        })),
        stdDev: jest.fn(() => ({
          combine: jest.fn(function() { return this; })
        })),
        min: jest.fn(() => ({
          combine: jest.fn(function() { return this; })
        })),
        max: jest.fn(() => ({
          combine: jest.fn(function() { return this; })
        }))
      }
    };

    ndviTimeSeriesMapService = new NDVITimeSeriesMapService(mockEE);

    // Setup endpoint
    app.post('/api/field-analysis/time-series-map', async (req, res) => {
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
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  });

  describe('Request Validation', () => {
    test('should reject missing fieldBoundary', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldId: 'TEST-001'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should reject missing fieldId', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should reject non-Polygon geometry', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Point',
            coordinates: [90.37, 23.84]
          },
          fieldId: 'TEST-001'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only Polygon geometries are supported');
    });
  });

  describe('Successful Requests', () => {
    test('should accept valid request with all fields', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          },
          fieldId: 'TEST-001',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          intervalDays: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should use default dates if not provided', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          },
          fieldId: 'TEST-001'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should use default interval if not provided', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          },
          fieldId: 'TEST-001',
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Response Structure', () => {
    test('should return correct response structure', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          },
          fieldId: 'TEST-001',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          intervalDays: 10
        });

      expect(response.body.success).toBe(true);
      expect(response.body.data.field_id).toBe('TEST-001');
      expect(response.body.data.start_date).toBe('2025-01-01');
      expect(response.body.data.end_date).toBe('2025-01-31');
      expect(response.body.data.interval_days).toBe(10);
      expect(response.body.data.maps).toBeDefined();
      expect(Array.isArray(response.body.data.maps)).toBe(true);
    });

    test('should include metadata in response', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          },
          fieldId: 'TEST-001',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          intervalDays: 10
        });

      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.metadata.data_source).toBe('Sentinel-2');
      expect(response.body.data.metadata.spatial_resolution).toBe('10m');
      expect(response.body.data.metadata.cloud_filter).toBe('< 30%');
      expect(response.body.data.metadata.generated_at).toBeDefined();
    });

    test('should include map details in each map object', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          },
          fieldId: 'TEST-001',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          intervalDays: 10
        });

      if (response.body.data.maps.length > 0) {
        const map = response.body.data.maps[0];
        expect(map.field_id).toBeDefined();
        expect(map.date).toBeDefined();
        expect(map.map_id).toBeDefined();
        expect(map.map_token).toBeDefined();
        expect(map.map_url).toBeDefined();
        expect(map.statistics).toBeDefined();
        expect(map.visualization).toBeDefined();
      }
    });
  });

  describe('Different Intervals', () => {
    test('should support 5-day interval', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          },
          fieldId: 'TEST-001',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          intervalDays: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should support 10-day interval', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          },
          fieldId: 'TEST-001',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          intervalDays: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should support 15-day interval', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          },
          fieldId: 'TEST-001',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          intervalDays: 15
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should support 30-day interval', async () => {
      const response = await request(app)
        .post('/api/field-analysis/time-series-map')
        .send({
          fieldBoundary: {
            type: 'Polygon',
            coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
          },
          fieldId: 'TEST-001',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          intervalDays: 30
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

