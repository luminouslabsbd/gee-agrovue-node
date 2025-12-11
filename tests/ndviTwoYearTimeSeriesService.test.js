/**
 * Tests for NDVI 2-Year Time Series Service
 */

const NDVITwoYearTimeSeriesService = require('../services/ndviTwoYearTimeSeriesService');

describe('NDVITwoYearTimeSeriesService', () => {
  let service;
  let mockEE;

  beforeEach(() => {
    // Mock Earth Engine
    mockEE = {
      Geometry: {
        Polygon: jest.fn((coords) => ({
          coordinates: coords,
          type: 'Polygon'
        }))
      },
      ImageCollection: jest.fn(() => {
        const imageCollection = {
          filterBounds: jest.fn(function() { return this; }),
          filterDate: jest.fn(function() { return this; }),
          filter: jest.fn(function() { return this; }),
          map: jest.fn(function(fn) {
            this.mapFn = fn;
            return this;
          }),
          mean: jest.fn(function() {
            // Return an Image object with reduceRegion and getMapId
            return {
              reduceRegion: jest.fn(() => ({
                getInfo: jest.fn(() => ({
                  NDVI_mean: 0.35,
                  NDVI_stdDev: 0.05,
                  NDVI_min: 0.15,
                  NDVI_max: 0.55
                }))
              })),
              getMapId: jest.fn(() => ({
                mapid: 'test-map-id-123',
                token: 'test-token-xyz'
              }))
            };
          }),
          size: jest.fn(function() {
            return {
              getInfo: jest.fn(() => 1)
            };
          })
        };
        return imageCollection;
      }),
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

    service = new NDVITwoYearTimeSeriesService(mockEE);
  });

  describe('Initialization', () => {
    test('should initialize with Earth Engine instance', () => {
      expect(service).toBeDefined();
      expect(service.ee).toBe(mockEE);
    });

    test('should have correct NDVI visualization parameters', () => {
      expect(service.NDVI_VIS_PARAMS).toHaveProperty('min', -1);
      expect(service.NDVI_VIS_PARAMS).toHaveProperty('max', 1);
      expect(service.NDVI_VIS_PARAMS).toHaveProperty('palette');
    });
  });

  describe('Date Utilities', () => {
    test('should format date correctly', () => {
      const date = new Date('2025-01-15');
      const formatted = service.formatDate(date);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should add days to date', () => {
      const result = service.addDays('2025-01-01', 7);
      expect(result).toBe('2025-01-08');
    });

    test('should generate monthly intervals', () => {
      const dates = service.generateDateIntervals('2025-01-01', '2025-03-01', 'monthly');
      expect(dates.length).toBeGreaterThan(0);
      expect(dates[0]).toBe('2025-01-01');
    });

    test('should generate weekly intervals', () => {
      const dates = service.generateDateIntervals('2025-01-01', '2025-01-31', 'weekly');
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics Calculation', () => {
    test('should calculate mean correctly', () => {
      const values = [0.2, 0.3, 0.4];
      const mean = service.calculateMean(values);
      expect(mean).toBeCloseTo(0.3, 1);
    });

    test('should calculate standard deviation', () => {
      const values = [0.2, 0.3, 0.4];
      const stdDev = service.calculateStdDev(values);
      expect(stdDev).toBeGreaterThan(0);
    });
  });

  describe('Trend Calculation', () => {
    test('should identify improving trend', () => {
      const data = [
        { mean_ndvi: 0.2 },
        { mean_ndvi: 0.3 },
        { mean_ndvi: 0.4 }
      ];
      const trends = service.calculateTrends(data);
      expect(trends.trend).toBe('improving');
      expect(parseFloat(trends.change_percentage)).toBeGreaterThan(0);
    });

    test('should identify declining trend', () => {
      const data = [
        { mean_ndvi: 0.4 },
        { mean_ndvi: 0.3 },
        { mean_ndvi: 0.2 }
      ];
      const trends = service.calculateTrends(data);
      expect(trends.trend).toBe('declining');
      expect(parseFloat(trends.change_percentage)).toBeLessThan(0);
    });

    test('should identify stable trend', () => {
      const data = [
        { mean_ndvi: 0.3 },
        { mean_ndvi: 0.31 },
        { mean_ndvi: 0.3 }
      ];
      const trends = service.calculateTrends(data);
      expect(trends.trend).toBe('stable');
    });
  });

  describe('Two-Year Time Series Generation', () => {
    test('should generate 2-year time series', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const result = await service.generateTwoYearTimeSeries(fieldBoundary, 'TEST-FIELD-001', 'monthly');

      expect(result).toHaveProperty('field_id', 'TEST-FIELD-001');
      expect(result).toHaveProperty('time_series');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('metadata');
    });

    test('should include statistics in result', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const result = await service.generateTwoYearTimeSeries(fieldBoundary, 'TEST-FIELD-001', 'monthly');

      expect(result.statistics).toHaveProperty('overall_mean_ndvi');
      expect(result.statistics).toHaveProperty('overall_std_ndvi');
      expect(result.statistics).toHaveProperty('min_ndvi');
      expect(result.statistics).toHaveProperty('max_ndvi');
    });
  });

  describe('Field Image Generation', () => {
    test('should generate field image for specific date', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const result = await service.generateFieldImage(fieldBoundary, 'TEST-FIELD-001', '2025-01-15');

      expect(result).toHaveProperty('field_id', 'TEST-FIELD-001');
      expect(result).toHaveProperty('date', '2025-01-15');
      expect(result).toHaveProperty('map_id');
      expect(result).toHaveProperty('map_token');
      expect(result).toHaveProperty('map_url');
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('visualization');
    });

    test('should include NDVI statistics in field image', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const result = await service.generateFieldImage(fieldBoundary, 'TEST-FIELD-001', '2025-01-15');

      expect(result.statistics).toHaveProperty('mean_ndvi');
      expect(result.statistics).toHaveProperty('std_ndvi');
      expect(result.statistics).toHaveProperty('min_ndvi');
      expect(result.statistics).toHaveProperty('max_ndvi');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid boundary', async () => {
      const invalidBoundary = {
        type: 'Point',
        coordinates: [90.37, 23.84]
      };

      await expect(
        service.generateTwoYearTimeSeries(invalidBoundary, 'TEST-FIELD-001', 'monthly')
      ).rejects.toThrow();
    });
  });
});

