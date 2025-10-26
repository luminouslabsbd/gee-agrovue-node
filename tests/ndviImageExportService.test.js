/**
 * Tests for NDVI Image Export Service
 */

const NDVIImageExportService = require('../services/ndviImageExportService');
const fs = require('fs');
const path = require('path');

describe('NDVIImageExportService', () => {
  let service;
  let mockEE;

  beforeAll(() => {
    // Mock Earth Engine object
    mockEE = {
      Geometry: {
        Polygon: jest.fn((coords) => ({
          type: 'Polygon',
          coordinates: coords
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
        lt: jest.fn((field, value) => ({
          type: 'Filter',
          field: field,
          value: value
        }))
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

    service = new NDVIImageExportService(mockEE);
  });

  afterAll(() => {
    // Clean up storage directory
    const storageDir = path.join(__dirname, '../public/ndvi-images');
    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(storageDir, file));
      });
      fs.rmdirSync(storageDir);
    }
  });

  describe('Initialization', () => {
    test('should initialize with Earth Engine object', () => {
      expect(service).toBeDefined();
      expect(service.ee).toBeDefined();
    });

    test('should create storage directory', () => {
      const storageDir = path.join(__dirname, '../public/ndvi-images');
      expect(fs.existsSync(storageDir)).toBe(true);
    });

    test('should create metadata file', () => {
      const metadataFile = path.join(__dirname, '../public/ndvi-images/metadata.json');
      expect(fs.existsSync(metadataFile)).toBe(true);
    });
  });

  describe('Export and Store NDVI Image', () => {
    test('should export and store NDVI image successfully', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37110641598703, 23.841231509287553],
                       [90.37093743681908, 23.84014467798467],
                       [90.37123516201974, 23.84],
                       [90.3713531792164, 23.840186384997345],
                       [90.37110641598703, 23.841231509287553]]]
      };

      const result = await service.exportAndStoreNDVIImage(
        fieldBoundary,
        'NGR-KD-12345',
        '2023-10-26'
      );

      expect(result).toBeDefined();
      expect(result.field_id).toBe('NGR-KD-12345');
      expect(result.date).toBe('2023-10-26');
      expect(result.filename).toBeDefined();
      expect(result.download_url).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.statistics.mean_ndvi).toBe(0.35);
    });

    test('should handle invalid boundary', async () => {
      const invalidBoundary = {
        type: 'Point',
        coordinates: [90.37, 23.84]
      };

      await expect(
        service.exportAndStoreNDVIImage(invalidBoundary, 'NGR-KD-12345', '2023-10-26')
      ).rejects.toThrow('Invalid boundary');
    });

    test('should store image metadata as JSON file', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37110641598703, 23.841231509287553],
                       [90.37093743681908, 23.84014467798467],
                       [90.37123516201974, 23.84],
                       [90.3713531792164, 23.840186384997345],
                       [90.37110641598703, 23.841231509287553]]]
      };

      const result = await service.exportAndStoreNDVIImage(
        fieldBoundary,
        'NGR-KD-12345',
        '2023-10-26'
      );

      const filepath = path.join(service.STORAGE_DIR, result.filename);
      expect(fs.existsSync(filepath)).toBe(true);

      const metadata = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      expect(metadata.field_id).toBe('NGR-KD-12345');
      expect(metadata.date).toBe('2023-10-26');
    });
  });

  describe('Get Stored Image', () => {
    test('should retrieve stored image metadata', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37110641598703, 23.841231509287553],
                       [90.37093743681908, 23.84014467798467],
                       [90.37123516201974, 23.84],
                       [90.3713531792164, 23.840186384997345],
                       [90.37110641598703, 23.841231509287553]]]
      };

      const result = await service.exportAndStoreNDVIImage(
        fieldBoundary,
        'NGR-KD-12345',
        '2023-10-26'
      );

      const retrieved = service.getStoredImage(result.filename);
      expect(retrieved).toBeDefined();
      expect(retrieved.field_id).toBe('NGR-KD-12345');
    });

    test('should throw error for non-existent image', () => {
      expect(() => {
        service.getStoredImage('non-existent-file.json');
      }).toThrow('Image not found');
    });
  });

  describe('List Stored Images', () => {
    test('should list all stored images', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37110641598703, 23.841231509287553],
                       [90.37093743681908, 23.84014467798467],
                       [90.37123516201974, 23.84],
                       [90.3713531792164, 23.840186384997345],
                       [90.37110641598703, 23.841231509287553]]]
      };

      await service.exportAndStoreNDVIImage(
        fieldBoundary,
        'NGR-KD-12345',
        '2023-10-26'
      );

      const images = service.listStoredImages();
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBeGreaterThan(0);
    });

    test('should filter images by field ID', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37110641598703, 23.841231509287553],
                       [90.37093743681908, 23.84014467798467],
                       [90.37123516201974, 23.84],
                       [90.3713531792164, 23.840186384997345],
                       [90.37110641598703, 23.841231509287553]]]
      };

      await service.exportAndStoreNDVIImage(
        fieldBoundary,
        'NGR-KD-12345',
        '2023-10-26'
      );

      const images = service.listStoredImages('NGR-KD-12345');
      expect(Array.isArray(images)).toBe(true);
      images.forEach(img => {
        expect(img.field_id).toBe('NGR-KD-12345');
      });
    });
  });

  describe('Storage Statistics', () => {
    test('should get storage statistics', async () => {
      const stats = service.getStorageStats();
      expect(stats).toBeDefined();
      expect(stats.total_images).toBeDefined();
      expect(stats.total_files).toBeDefined();
      expect(stats.total_size_mb).toBeDefined();
      expect(stats.storage_path).toBeDefined();
    });
  });

  describe('Add Days Utility', () => {
    test('should add days to date string', () => {
      const result = service.addDays('2023-10-26', 1);
      expect(result).toBe('2023-10-27');
    });

    test('should handle month boundary', () => {
      const result = service.addDays('2023-10-31', 1);
      expect(result).toBe('2023-11-01');
    });

    test('should handle year boundary', () => {
      const result = service.addDays('2023-12-31', 1);
      expect(result).toBe('2024-01-01');
    });
  });
});

