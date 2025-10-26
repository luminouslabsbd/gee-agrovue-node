/**
 * NDVI Time Series Map Service Tests
 * Tests for map generation and visualization
 */

const NDVITimeSeriesMapService = require('../services/ndviTimeSeriesMapService');

describe('NDVITimeSeriesMapService', () => {
  let service;
  let mockEE;

  beforeEach(() => {
    // Mock Earth Engine
    mockEE = {
      Geometry: {
        Polygon: jest.fn((coords) => ({
          type: 'Polygon',
          coordinates: coords
        })),
        Point: jest.fn((coords) => ({
          type: 'Point',
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
                mapid: 'test-map-id-123',
                token: 'test-token-xyz'
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
        map: jest.fn(function(fn) {
          return this;
        })
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

    service = new NDVITimeSeriesMapService(mockEE);
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(service.VALID_INTERVALS).toEqual([5, 10, 15, 30]);
      expect(service.MAX_DATE_RANGE_DAYS).toBe(730);
      expect(service.DEFAULT_INTERVAL).toBe(10);
    });

    test('should have NDVI visualization parameters', () => {
      expect(service.NDVI_VIS_PARAMS).toBeDefined();
      expect(service.NDVI_VIS_PARAMS.min).toBe(-1);
      expect(service.NDVI_VIS_PARAMS.max).toBe(1);
      expect(service.NDVI_VIS_PARAMS.palette).toBeDefined();
    });
  });

  describe('Date Range Validation', () => {
    test('should accept valid date range', () => {
      expect(() => {
        service._validateDateRange('2025-01-01', '2025-12-31');
      }).not.toThrow();
    });

    test('should reject date range exceeding 2 years', () => {
      expect(() => {
        service._validateDateRange('2023-01-01', '2025-12-31');
      }).toThrow('Date range exceeds maximum of 730 days');
    });

    test('should reject when start date is after end date', () => {
      expect(() => {
        service._validateDateRange('2025-12-31', '2025-01-01');
      }).toThrow('Start date must be before end date');
    });
  });

  describe('Interval Validation', () => {
    test('should accept valid intervals', () => {
      [5, 10, 15, 30].forEach(interval => {
        expect(() => {
          service._validateInterval(interval);
        }).not.toThrow();
      });
    });

    test('should reject invalid intervals', () => {
      expect(() => {
        service._validateInterval(7);
      }).toThrow('Invalid interval. Must be one of: 5, 10, 15, 30');
    });
  });

  describe('GeoJSON to EE Geometry Conversion', () => {
    test('should convert Polygon GeoJSON to EE geometry', () => {
      const geoJson = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const geometry = service._geoJsonToEEGeometry(geoJson);
      expect(mockEE.Geometry.Polygon).toHaveBeenCalled();
    });

    test('should convert Point GeoJSON to EE geometry', () => {
      const geoJson = {
        type: 'Point',
        coordinates: [90.37, 23.84]
      };

      const geometry = service._geoJsonToEEGeometry(geoJson);
      expect(mockEE.Geometry.Point).toHaveBeenCalled();
    });

    test('should reject unsupported geometry types', () => {
      const geoJson = {
        type: 'LineString',
        coordinates: [[90.37, 23.84], [90.38, 23.85]]
      };

      expect(() => {
        service._geoJsonToEEGeometry(geoJson);
      }).toThrow('Unsupported geometry type');
    });
  });

  describe('Date Range Generation', () => {
    test('should generate correct date range with 10-day interval', () => {
      const dates = service._generateDateRange('2025-01-01', '2025-01-31', 10);
      expect(dates.length).toBeGreaterThan(0);
      expect(dates[0]).toBe('2025-01-01');
    });

    test('should generate correct date range with 5-day interval', () => {
      const dates = service._generateDateRange('2025-01-01', '2025-01-31', 5);
      expect(dates.length).toBeGreaterThan(0);
    });

    test('should generate correct date range with 30-day interval', () => {
      const dates = service._generateDateRange('2025-01-01', '2025-12-31', 30);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('Date Utilities', () => {
    test('should add days to date correctly', () => {
      const result = service._addDays('2025-01-01', 5);
      expect(result).toBe('2025-01-06');
    });

    test('should handle month boundaries', () => {
      const result = service._addDays('2025-01-28', 5);
      expect(result).toBe('2025-02-02');
    });
  });

  describe('NDVI Map Generation', () => {
    test('should generate NDVI map for a specific date', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const result = await service.generateNDVIMapForDate(fieldBoundary, 'TEST-001', '2025-01-10');

      expect(result).toBeDefined();
      expect(result.field_id).toBe('TEST-001');
      expect(result.date).toBe('2025-01-10');
      expect(result.map_id).toBeDefined();
      expect(result.map_token).toBeDefined();
      expect(result.map_url).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.visualization).toBeDefined();
    });

    test('should include correct statistics in map response', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const result = await service.generateNDVIMapForDate(fieldBoundary, 'TEST-001', '2025-01-10');

      expect(result.statistics.mean_ndvi).toBe(0.45);
      expect(result.statistics.std_ndvi).toBe(0.08);
      expect(result.statistics.min_ndvi).toBe(0.25);
      expect(result.statistics.max_ndvi).toBe(0.65);
    });

    test('should include visualization parameters', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const result = await service.generateNDVIMapForDate(fieldBoundary, 'TEST-001', '2025-01-10');

      expect(result.visualization.palette).toBeDefined();
      expect(result.visualization.min).toBe(-1);
      expect(result.visualization.max).toBe(1);
    });
  });

  describe('Time Series Maps Generation', () => {
    test('should generate time series maps', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const result = await service.generateTimeSeriesMaps(
        fieldBoundary,
        'TEST-001',
        '2025-01-01',
        '2025-01-31',
        10
      );

      expect(result).toBeDefined();
      expect(result.field_id).toBe('TEST-001');
      expect(result.start_date).toBe('2025-01-01');
      expect(result.end_date).toBe('2025-01-31');
      expect(result.interval_days).toBe(10);
      expect(result.maps).toBeDefined();
      expect(Array.isArray(result.maps)).toBe(true);
    });

    test('should include metadata in response', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const result = await service.generateTimeSeriesMaps(
        fieldBoundary,
        'TEST-001',
        '2025-01-01',
        '2025-01-31',
        10
      );

      expect(result.metadata).toBeDefined();
      expect(result.metadata.data_source).toBe('Sentinel-2');
      expect(result.metadata.spatial_resolution).toBe('10m');
      expect(result.metadata.cloud_filter).toBe('< 30%');
      expect(result.metadata.generated_at).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing Sentinel-2 data', async () => {
      mockEE.ImageCollection = jest.fn(() => ({
        filterBounds: jest.fn(function() { return this; }),
        filterDate: jest.fn(function() { return this; }),
        filter: jest.fn(function() { return this; }),
        size: jest.fn(() => ({
          getInfo: jest.fn(() => 0)
        }))
      }));

      service = new NDVITimeSeriesMapService(mockEE);

      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      await expect(
        service.generateNDVIMapForDate(fieldBoundary, 'TEST-001', '2025-01-10')
      ).rejects.toThrow();
    });
  });
});

