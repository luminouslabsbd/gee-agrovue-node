/**
 * Time Series Image Storage Service Tests
 */

const TimeSeriesImageStorageService = require('../services/timeSeriesImageStorageService');
const fs = require('fs');
const path = require('path');

describe('TimeSeriesImageStorageService', () => {
  let service;
  const testStorageDir = path.join(__dirname, '../public/time-series-images');

  beforeAll(() => {
    service = new TimeSeriesImageStorageService();
  });

  afterAll(() => {
    // Cleanup test files
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  describe('Initialization', () => {
    test('should initialize storage directory', () => {
      expect(fs.existsSync(testStorageDir)).toBe(true);
    });

    test('should create metadata file', () => {
      const metadataFile = path.join(testStorageDir, 'metadata.json');
      expect(fs.existsSync(metadataFile)).toBe(true);
    });

    test('should have valid metadata structure', () => {
      const metadataFile = path.join(testStorageDir, 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
      expect(metadata).toHaveProperty('series');
      expect(Array.isArray(metadata.series)).toBe(true);
    });
  });

  describe('Save Time Series Images', () => {
    test('should save time series images with download URLs', () => {
      const mockTimeSeriesData = {
        field_id: 'TEST-FIELD-001',
        start_date: '2023-10-26',
        end_date: '2025-10-26',
        interval_type: 'monthly',
        total_data_points: 3,
        time_series: [
          {
            date: '2023-10-26',
            mean_ndvi: 0.35,
            std_ndvi: 0.05,
            min_ndvi: 0.15,
            max_ndvi: 0.55,
            map_id: 'test-map-id-1',
            map_token: 'test-token-1',
            map_url: 'https://earthengine.googleapis.com/map/test-map-id-1/{z}/{x}/{y}?token=test-token-1',
            image_available: true
          },
          {
            date: '2023-11-26',
            mean_ndvi: 0.40,
            std_ndvi: 0.06,
            min_ndvi: 0.18,
            max_ndvi: 0.58,
            map_id: 'test-map-id-2',
            map_token: 'test-token-2',
            map_url: 'https://earthengine.googleapis.com/map/test-map-id-2/{z}/{x}/{y}?token=test-token-2',
            image_available: true
          },
          {
            date: '2023-12-26',
            mean_ndvi: 0.38,
            std_ndvi: 0.05,
            min_ndvi: 0.16,
            max_ndvi: 0.56,
            map_id: 'test-map-id-3',
            map_token: 'test-token-3',
            map_url: 'https://earthengine.googleapis.com/map/test-map-id-3/{z}/{x}/{y}?token=test-token-3',
            image_available: true
          }
        ],
        field_images: [
          {
            date: '2023-10-26',
            map_id: 'test-map-id-1',
            map_token: 'test-token-1',
            map_url: 'https://earthengine.googleapis.com/map/test-map-id-1/{z}/{x}/{y}?token=test-token-1'
          }
        ],
        trends: { trend: 'stable', change_percentage: 8.57 },
        statistics: {
          overall_mean_ndvi: 0.38,
          overall_std_ndvi: 0.02,
          min_ndvi: 0.15,
          max_ndvi: 0.58
        },
        metadata: {
          data_source: 'Sentinel-2',
          spatial_resolution: '10m',
          cloud_filter: '< 30%',
          generated_at: new Date().toISOString()
        }
      };

      const result = service.saveTimeSeriesImages(mockTimeSeriesData, 'TEST-FIELD-001');

      expect(result).toHaveProperty('series_id');
      expect(result).toHaveProperty('storage_info');
      expect(result.time_series.length).toBe(3);
      expect(result.time_series[0]).toHaveProperty('download_url');
      expect(result.time_series[0].download_url).toContain('/time-series-images/');
      expect(result.time_series[0]).toHaveProperty('token_available');
      expect(result.time_series[0]).toHaveProperty('stored_at');
    });

    test('should create series directory with images', () => {
      const mockTimeSeriesData = {
        field_id: 'TEST-FIELD-002',
        start_date: '2023-10-26',
        end_date: '2025-10-26',
        interval_type: 'monthly',
        total_data_points: 1,
        time_series: [
          {
            date: '2023-10-26',
            mean_ndvi: 0.35,
            std_ndvi: 0.05,
            min_ndvi: 0.15,
            max_ndvi: 0.55,
            map_id: 'test-map-id',
            map_token: 'test-token',
            map_url: 'https://earthengine.googleapis.com/map/test-map-id/{z}/{x}/{y}?token=test-token',
            image_available: true
          }
        ],
        field_images: [],
        trends: { trend: 'stable', change_percentage: 0 },
        statistics: {
          overall_mean_ndvi: 0.35,
          overall_std_ndvi: 0,
          min_ndvi: 0.15,
          max_ndvi: 0.55
        },
        metadata: {
          data_source: 'Sentinel-2',
          spatial_resolution: '10m',
          cloud_filter: '< 30%',
          generated_at: new Date().toISOString()
        }
      };

      const result = service.saveTimeSeriesImages(mockTimeSeriesData, 'TEST-FIELD-002');
      const seriesDir = path.join(testStorageDir, result.series_id);

      expect(fs.existsSync(seriesDir)).toBe(true);
      expect(fs.existsSync(path.join(seriesDir, 'series_metadata.json'))).toBe(true);
    });

    test('should handle empty map token gracefully', () => {
      const mockTimeSeriesData = {
        field_id: 'TEST-FIELD-003',
        start_date: '2023-10-26',
        end_date: '2025-10-26',
        interval_type: 'monthly',
        total_data_points: 1,
        time_series: [
          {
            date: '2023-10-26',
            mean_ndvi: 0.35,
            std_ndvi: 0.05,
            min_ndvi: 0.15,
            max_ndvi: 0.55,
            map_id: 'test-map-id',
            map_token: '',
            map_url: 'https://earthengine.googleapis.com/map/test-map-id/{z}/{x}/{y}?token=',
            image_available: true
          }
        ],
        field_images: [],
        trends: { trend: 'stable', change_percentage: 0 },
        statistics: {
          overall_mean_ndvi: 0.35,
          overall_std_ndvi: 0,
          min_ndvi: 0.15,
          max_ndvi: 0.55
        },
        metadata: {
          data_source: 'Sentinel-2',
          spatial_resolution: '10m',
          cloud_filter: '< 30%',
          generated_at: new Date().toISOString()
        }
      };

      const result = service.saveTimeSeriesImages(mockTimeSeriesData, 'TEST-FIELD-003');

      expect(result.time_series[0].token_available).toBe(false);
      expect(result.time_series[0]).toHaveProperty('download_url');
    });
  });

  describe('List Stored Series', () => {
    test('should list all stored series', () => {
      const series = service.listStoredSeries();
      expect(Array.isArray(series)).toBe(true);
      expect(series.length).toBeGreaterThan(0);
    });

    test('should filter series by fieldId', () => {
      const series = service.listStoredSeries('TEST-FIELD-001');
      expect(Array.isArray(series)).toBe(true);
      series.forEach(s => {
        expect(s.field_id).toBe('TEST-FIELD-001');
      });
    });
  });

  describe('Get Series Metadata', () => {
    test('should retrieve series metadata', () => {
      const allSeries = service.listStoredSeries();
      if (allSeries.length > 0) {
        const seriesId = allSeries[0].series_id;
        const metadata = service.getSeriesMetadata(seriesId);
        expect(metadata).toHaveProperty('series_id');
        expect(metadata).toHaveProperty('field_id');
        expect(metadata).toHaveProperty('start_date');
        expect(metadata).toHaveProperty('end_date');
      }
    });

    test('should throw error for non-existent series', () => {
      expect(() => {
        service.getSeriesMetadata('non-existent-series-id');
      }).toThrow();
    });
  });

  describe('Storage Statistics', () => {
    test('should return storage statistics', () => {
      const stats = service.getStorageStats();
      expect(stats).toHaveProperty('total_series');
      expect(stats).toHaveProperty('total_images');
      expect(stats).toHaveProperty('total_size_mb');
      expect(stats).toHaveProperty('storage_path');
      expect(stats.total_series).toBeGreaterThan(0);
    });
  });

  describe('Delete Series', () => {
    test('should delete stored series', () => {
      const mockTimeSeriesData = {
        field_id: 'TEST-FIELD-DELETE',
        start_date: '2023-10-26',
        end_date: '2025-10-26',
        interval_type: 'monthly',
        total_data_points: 1,
        time_series: [
          {
            date: '2023-10-26',
            mean_ndvi: 0.35,
            std_ndvi: 0.05,
            min_ndvi: 0.15,
            max_ndvi: 0.55,
            map_id: 'test-map-id',
            map_token: 'test-token',
            map_url: 'https://earthengine.googleapis.com/map/test-map-id/{z}/{x}/{y}?token=test-token',
            image_available: true
          }
        ],
        field_images: [],
        trends: { trend: 'stable', change_percentage: 0 },
        statistics: {
          overall_mean_ndvi: 0.35,
          overall_std_ndvi: 0,
          min_ndvi: 0.15,
          max_ndvi: 0.55
        },
        metadata: {
          data_source: 'Sentinel-2',
          spatial_resolution: '10m',
          cloud_filter: '< 30%',
          generated_at: new Date().toISOString()
        }
      };

      const result = service.saveTimeSeriesImages(mockTimeSeriesData, 'TEST-FIELD-DELETE');
      const seriesId = result.series_id;

      const deleteResult = service.deleteStoredSeries(seriesId);
      expect(deleteResult.success).toBe(true);

      expect(() => {
        service.getSeriesMetadata(seriesId);
      }).toThrow();
    });

    test('should throw error when deleting non-existent series', () => {
      expect(() => {
        service.deleteStoredSeries('non-existent-series-id');
      }).toThrow();
    });
  });
});

