/**
 * Unit Tests for Field Analysis Service
 */

const FieldAnalysisService = require('../services/fieldAnalysisService');

// Mock Earth Engine object
const createMockEE = () => {
  return {
    Geometry: {
      Polygon: (coords) => ({
        area: (options) => ({
          getInfo: () => 50000 // 5 hectares
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
          getInfo: () => 1 // At least one image available
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
              if (prop === 'system:time_start') return 1697289600000; // 2023-10-14
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
                      NDVI_max: 0.85,
                      NDVI_median: 0.68,
                      NDVI_p25: 0.62,
                      NDVI_p75: 0.74
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
      median: () => ({
        combine: function() { return this; }
      }),
      percentile: (values) => ({
        combine: function() { return this; }
      }),
      count: () => ({})
    }
  };
};

// Test data
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

describe('FieldAnalysisService', () => {
  let service;
  let mockEE;

  beforeEach(() => {
    mockEE = createMockEE();
    service = new FieldAnalysisService(mockEE);
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
    test('should extract NDVI statistics correctly', () => {
      const statsInfo = {
        NDVI_mean: 0.68,
        NDVI_stdDev: 0.12,
        NDVI_min: 0.35,
        NDVI_max: 0.85,
        NDVI_median: 0.68,
        NDVI_p25: 0.62,
        NDVI_p75: 0.74
      };

      const stats = service._extractNDVIStats(statsInfo);

      expect(stats.mean).toBe(0.68);
      expect(stats.std).toBe(0.12);
      expect(stats.min).toBe(0.35);
      expect(stats.max).toBe(0.85);
      expect(stats.median).toBe(0.68);
      expect(stats.p25).toBe(0.62);
      expect(stats.p75).toBe(0.74);
    });
  });

  describe('_interpretHealth', () => {
    test('should interpret very low NDVI as Poor', () => {
      const result = service._interpretHealth(0.25);
      expect(result.health_status).toBe('Poor');
      expect(result.health_score).toBe(20);
      expect(result.alerts.length).toBeGreaterThan(0);
    });

    test('should interpret low NDVI as Fair', () => {
      const result = service._interpretHealth(0.35);
      expect(result.health_status).toBe('Fair');
      expect(result.health_score).toBe(40);
    });

    test('should interpret moderate NDVI as Good', () => {
      const result = service._interpretHealth(0.45);
      expect(result.health_status).toBe('Good');
      expect(result.health_score).toBe(60);
    });

    test('should interpret high NDVI as Healthy', () => {
      const result = service._interpretHealth(0.68);
      expect(result.health_status).toBe('Healthy');
      expect(result.health_score).toBe(85);
    });

    test('should interpret very high NDVI as Very Healthy', () => {
      const result = service._interpretHealth(0.75);
      expect(result.health_status).toBe('Very Healthy');
      expect(result.health_score).toBe(95);
    });
  });

  describe('_calculateConfidence', () => {
    test('should calculate confidence with no cloud cover', () => {
      const confidence = service._calculateConfidence(0, 1000);
      expect(confidence).toBeGreaterThan(0.9);
    });

    test('should reduce confidence with cloud cover', () => {
      const confidence = service._calculateConfidence(30, 1000);
      expect(confidence).toBeLessThan(0.95);
    });

    test('should reduce confidence with low pixel count', () => {
      const confidence = service._calculateConfidence(0, 50);
      expect(confidence).toBeLessThan(0.9);
    });

    test('should return value between 0 and 1', () => {
      const confidence = service._calculateConfidence(100, 0);
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('_calculateHectares', () => {
    test('should calculate hectares from geometry', () => {
      const mockGeometry = {
        area: (options) => ({
          getInfo: () => 50000 // 5 hectares
        })
      };
      const hectares = service._calculateHectares(mockGeometry);
      expect(hectares).toBe(5);
    });

    test('should return 0 on error', () => {
      const mockGeometry = {
        area: () => {
          throw new Error('Area calculation failed');
        }
      };
      const hectares = service._calculateHectares(mockGeometry);
      expect(hectares).toBe(0);
    });
  });

  describe('analyzeFieldNDVI', () => {
    test('should return analysis result with all required fields', async () => {
      const result = await service.analyzeFieldNDVI(
        testFieldBoundary,
        'NGR-KD-12345',
        '2025-10-01',
        '2025-10-15'
      );

      expect(result).toHaveProperty('field_id', 'NGR-KD-12345');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('ndvi');
      expect(result).toHaveProperty('quality');
      expect(result).toHaveProperty('interpretation');
      expect(result).toHaveProperty('hectares');
    });

    test('should have correct NDVI structure', async () => {
      const result = await service.analyzeFieldNDVI(
        testFieldBoundary,
        'NGR-KD-12345',
        '2025-10-01',
        '2025-10-15'
      );

      const ndvi = result.ndvi;
      expect(ndvi).toHaveProperty('mean');
      expect(ndvi).toHaveProperty('std');
      expect(ndvi).toHaveProperty('min');
      expect(ndvi).toHaveProperty('max');
      expect(ndvi).toHaveProperty('median');
      expect(ndvi).toHaveProperty('p25');
      expect(ndvi).toHaveProperty('p75');
    });

    test('should have correct quality structure', async () => {
      const result = await service.analyzeFieldNDVI(
        testFieldBoundary,
        'NGR-KD-12345',
        '2025-10-01',
        '2025-10-15'
      );

      const quality = result.quality;
      expect(quality).toHaveProperty('cloud_cover');
      expect(quality).toHaveProperty('pixel_count');
      expect(quality).toHaveProperty('data_source', 'Sentinel-2');
      expect(quality).toHaveProperty('acquisition_date');
      expect(quality).toHaveProperty('confidence');
    });

    test('should have correct interpretation structure', async () => {
      const result = await service.analyzeFieldNDVI(
        testFieldBoundary,
        'NGR-KD-12345',
        '2025-10-01',
        '2025-10-15'
      );

      const interpretation = result.interpretation;
      expect(interpretation).toHaveProperty('health_status');
      expect(interpretation).toHaveProperty('health_score');
      expect(interpretation).toHaveProperty('alerts');
    });
  });
});

