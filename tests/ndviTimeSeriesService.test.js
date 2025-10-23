/**
 * NDVI Time Series Service Tests
 * Tests for time series generation, validation, and trend analysis
 */

const NDVITimeSeriesService = require('../services/ndviTimeSeriesService');

// Test field boundary (Bangladesh)
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

// Mock Earth Engine object
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

describe('NDVITimeSeriesService', () => {
  let service;
  let mockEE;

  beforeEach(() => {
    mockEE = createMockEE();
    service = new NDVITimeSeriesService(mockEE);
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(service.VALID_INTERVALS).toEqual([5, 10, 15, 30]);
      expect(service.MAX_DATE_RANGE_DAYS).toBe(730);
      expect(service.DEFAULT_INTERVAL).toBe(10);
    });
  });

  describe('_validateDateRange', () => {
    test('should accept valid date range', () => {
      expect(() => {
        service._validateDateRange('2025-01-01', '2025-12-31');
      }).not.toThrow();
    });

    test('should reject if start date is after end date', () => {
      expect(() => {
        service._validateDateRange('2025-12-31', '2025-01-01');
      }).toThrow('Start date must be before end date');
    });

    test('should reject if date range exceeds 2 years', () => {
      expect(() => {
        service._validateDateRange('2023-01-01', '2025-12-31');
      }).toThrow('Date range exceeds maximum of 730 days');
    });

    test('should reject exactly 2 years (730 days)', () => {
      expect(() => {
        service._validateDateRange('2023-01-01', '2025-01-01');
      }).toThrow('Date range exceeds maximum');
    });

    test('should accept less than 2 years', () => {
      expect(() => {
        service._validateDateRange('2025-01-01', '2025-12-31');
      }).not.toThrow();
    });
  });

  describe('_validateInterval', () => {
    test('should accept valid intervals', () => {
      [5, 10, 15, 30].forEach(interval => {
        expect(() => {
          service._validateInterval(interval);
        }).not.toThrow();
      });
    });

    test('should reject invalid intervals', () => {
      [3, 7, 12, 20, 45].forEach(interval => {
        expect(() => {
          service._validateInterval(interval);
        }).toThrow('Invalid interval');
      });
    });
  });

  describe('_geoJsonToEEGeometry', () => {
    test('should convert valid Polygon GeoJSON to EE geometry', () => {
      const geometry = service._geoJsonToEEGeometry(testFieldBoundary);
      expect(geometry).toBeDefined();
    });

    test('should throw error for non-Polygon geometry', () => {
      const invalidGeometry = {
        type: 'Point',
        coordinates: [90.37, 23.84]
      };
      expect(() => {
        service._geoJsonToEEGeometry(invalidGeometry);
      }).toThrow('Only Polygon geometries are supported');
    });
  });

  describe('_extractNDVIStats', () => {
    test('should extract NDVI statistics from flat format', () => {
      const statsInfo = {
        NDVI_mean: 0.68,
        NDVI_stdDev: 0.12,
        NDVI_min: 0.35,
        NDVI_max: 0.85
      };

      const stats = service._extractNDVIStats(statsInfo);

      expect(stats.mean).toBe(0.68);
      expect(stats.std).toBe(0.12);
      expect(stats.min).toBe(0.35);
      expect(stats.max).toBe(0.85);
    });
  });

  describe('_assessDataQuality', () => {
    test('should return Poor for high cloud cover', () => {
      const quality = service._assessDataQuality(35, 0.1);
      expect(quality).toBe('Poor');
    });

    test('should return Fair for moderate cloud cover', () => {
      const quality = service._assessDataQuality(20, 0.1);
      expect(quality).toBe('Fair');
    });

    test('should return Fair for high variability', () => {
      const quality = service._assessDataQuality(10, 0.25);
      expect(quality).toBe('Fair');
    });

    test('should return Good for low cloud cover and variability', () => {
      const quality = service._assessDataQuality(5, 0.1);
      expect(quality).toBe('Good');
    });
  });

  describe('_calculateTimeSeriesStatistics', () => {
    test('should calculate statistics for time series data', () => {
      const timeSeries = [
        { date: '2025-01-01', ndvi_mean: 0.5 },
        { date: '2025-01-11', ndvi_mean: 0.6 },
        { date: '2025-01-21', ndvi_mean: 0.7 }
      ];

      const stats = service._calculateTimeSeriesStatistics(timeSeries);

      expect(stats.mean_ndvi).toBe(0.6);
      expect(stats.min_ndvi).toBe(0.5);
      expect(stats.max_ndvi).toBe(0.7);
      expect(stats.data_points).toBe(3);
    });

    test('should return null for empty time series', () => {
      const stats = service._calculateTimeSeriesStatistics([]);
      expect(stats).toBeNull();
    });
  });

  describe('_detectTrends', () => {
    test('should detect improving trend', () => {
      const timeSeries = [
        { date: '2025-01-01', ndvi_mean: 0.4 },
        { date: '2025-01-11', ndvi_mean: 0.5 },
        { date: '2025-01-21', ndvi_mean: 0.6 },
        { date: '2025-01-31', ndvi_mean: 0.7 }
      ];

      const trends = service._detectTrends(timeSeries);

      expect(trends.trend).toBe('improving');
      expect(trends.slope).toBeGreaterThan(0);
    });

    test('should detect declining trend', () => {
      const timeSeries = [
        { date: '2025-01-01', ndvi_mean: 0.7 },
        { date: '2025-01-11', ndvi_mean: 0.6 },
        { date: '2025-01-21', ndvi_mean: 0.5 },
        { date: '2025-01-31', ndvi_mean: 0.4 }
      ];

      const trends = service._detectTrends(timeSeries);

      expect(trends.trend).toBe('declining');
      expect(trends.slope).toBeLessThan(0);
    });

    test('should detect stable trend', () => {
      const timeSeries = [
        { date: '2025-01-01', ndvi_mean: 0.6 },
        { date: '2025-01-11', ndvi_mean: 0.6 },
        { date: '2025-01-21', ndvi_mean: 0.6 }
      ];

      const trends = service._detectTrends(timeSeries);

      expect(trends.trend).toBe('stable');
    });

    test('should return insufficient_data for single point', () => {
      const timeSeries = [
        { date: '2025-01-01', ndvi_mean: 0.6 }
      ];

      const trends = service._detectTrends(timeSeries);

      expect(trends.trend).toBe('insufficient_data');
    });
  });

  describe('_interpretTrend', () => {
    test('should interpret improving trend', () => {
      const interpretation = service._interpretTrend('improving', 0.05);
      expect(interpretation).toContain('improving');
      expect(interpretation).toContain('0.0500');
    });

    test('should interpret declining trend', () => {
      const interpretation = service._interpretTrend('declining', -0.05);
      expect(interpretation).toContain('declining');
      expect(interpretation).toContain('0.0500');
    });

    test('should interpret stable trend', () => {
      const interpretation = service._interpretTrend('stable', 0);
      expect(interpretation).toContain('stable');
    });
  });

  describe('generateTimeSeries', () => {
    test('should generate time series with all required fields', async () => {
      const result = await service.generateTimeSeries(
        testFieldBoundary,
        'NGR-KD-12345',
        '2025-01-01',
        '2025-12-31',
        10
      );

      expect(result).toHaveProperty('field_id', 'NGR-KD-12345');
      expect(result).toHaveProperty('start_date', '2025-01-01');
      expect(result).toHaveProperty('end_date', '2025-12-31');
      expect(result).toHaveProperty('interval_days', 10);
      expect(result).toHaveProperty('time_series');
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('metadata');
    });

    test('should reject invalid date range', async () => {
      await expect(
        service.generateTimeSeries(
          testFieldBoundary,
          'NGR-KD-12345',
          '2023-01-01',
          '2025-12-31',
          10
        )
      ).rejects.toThrow('Date range exceeds maximum');
    });

    test('should reject invalid interval', async () => {
      await expect(
        service.generateTimeSeries(
          testFieldBoundary,
          'NGR-KD-12345',
          '2025-01-01',
          '2025-12-31',
          7
        )
      ).rejects.toThrow('Invalid interval');
    });

    test('should use default interval if not provided', async () => {
      const result = await service.generateTimeSeries(
        testFieldBoundary,
        'NGR-KD-12345',
        '2025-01-01',
        '2025-12-31'
      );

      expect(result.interval_days).toBe(10);
    });
  });
});

