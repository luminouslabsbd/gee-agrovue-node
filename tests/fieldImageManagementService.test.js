/**
 * Field Image Management Service Tests
 * Tests for image replacement, cleanup, and storage management
 */

const fs = require('fs');
const path = require('path');
const FieldImageManagementService = require('../services/fieldImageManagementService');

describe('FieldImageManagementService', () => {
  let service;
  const testFieldId = 'TEST-FIELD-001';
  const testAnalysisType = 'zone-image';
  const testImageData = {
    image_id: 'test_image_001',
    date: '2024-10-26',
    crop_type: 'rice'
  };

  beforeAll(() => {
    service = new FieldImageManagementService();
  });

  afterEach(() => {
    // Cleanup test data
    try {
      const storagePath = service.STORAGE_PATHS[testAnalysisType];
      const fieldIndexPath = path.join(storagePath, `${testFieldId}_index.json`);
      if (fs.existsSync(fieldIndexPath)) {
        fs.unlinkSync(fieldIndexPath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Storage Initialization', () => {
    test('should initialize storage directories', () => {
      Object.values(service.STORAGE_PATHS).forEach(storagePath => {
        expect(fs.existsSync(storagePath)).toBe(true);
      });
    });

    test('should have correct analysis types', () => {
      expect(service.ANALYSIS_TYPES.ZONE_IMAGE).toBe('zone-image');
      expect(service.ANALYSIS_TYPES.TIME_SERIES).toBe('time-series');
      expect(service.ANALYSIS_TYPES.NDVI_EXPORT).toBe('ndvi-export');
    });
  });

  describe('Image Storage', () => {
    test('should store new field image', async () => {
      const result = await service.storeNewFieldImage(
        testFieldId,
        testAnalysisType,
        testImageData
      );

      expect(result.success).toBe(true);
      expect(result.field_id).toBe(testFieldId);
      expect(result.image_id).toBe(testImageData.image_id);
    });

    test('should create field index file', async () => {
      await service.storeNewFieldImage(
        testFieldId,
        testAnalysisType,
        testImageData
      );

      const storagePath = service.STORAGE_PATHS[testAnalysisType];
      const fieldIndexPath = path.join(storagePath, `${testFieldId}_index.json`);
      
      expect(fs.existsSync(fieldIndexPath)).toBe(true);
    });

    test('should store image metadata in index', async () => {
      await service.storeNewFieldImage(
        testFieldId,
        testAnalysisType,
        testImageData
      );

      const images = service.getExistingFieldImages(testFieldId, testAnalysisType);
      
      expect(images.length).toBe(1);
      expect(images[0].image_id).toBe(testImageData.image_id);
      expect(images[0].date).toBe(testImageData.date);
    });
  });

  describe('Image Retrieval', () => {
    test('should get existing field images', async () => {
      await service.storeNewFieldImage(
        testFieldId,
        testAnalysisType,
        testImageData
      );

      const images = service.getExistingFieldImages(testFieldId, testAnalysisType);
      
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBeGreaterThan(0);
    });

    test('should return empty array for non-existent field', () => {
      const images = service.getExistingFieldImages(
        'NON-EXISTENT-FIELD',
        testAnalysisType
      );

      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBe(0);
    });

    test('should get latest field image', async () => {
      await service.storeNewFieldImage(
        testFieldId,
        testAnalysisType,
        testImageData
      );

      const latest = service.getLatestFieldImage(testFieldId, testAnalysisType);
      
      expect(latest).not.toBeNull();
      expect(latest.image_id).toBe(testImageData.image_id);
    });

    test('should return null for non-existent latest image', () => {
      const latest = service.getLatestFieldImage(
        'NON-EXISTENT-FIELD',
        testAnalysisType
      );

      expect(latest).toBeNull();
    });
  });

  describe('Image Replacement', () => {
    test('should replace field images', async () => {
      // Store first image
      await service.storeNewFieldImage(
        testFieldId,
        testAnalysisType,
        testImageData
      );

      // Store second image (replacement)
      const newImageData = {
        image_id: 'test_image_002',
        date: '2024-10-27',
        crop_type: 'wheat'
      };

      const result = await service.replaceFieldImages(
        testFieldId,
        testAnalysisType,
        newImageData
      );

      expect(result.success).toBe(true);
      expect(result.deleted_count).toBe(1);
      expect(result.new_image_id).toBe(newImageData.image_id);
    });

    test('should keep only latest image after replacement', async () => {
      // Store first image
      await service.storeNewFieldImage(
        testFieldId,
        testAnalysisType,
        testImageData
      );

      // Replace with second image
      const newImageData = {
        image_id: 'test_image_002',
        date: '2024-10-27',
        crop_type: 'wheat'
      };

      await service.replaceFieldImages(
        testFieldId,
        testAnalysisType,
        newImageData
      );

      const images = service.getExistingFieldImages(testFieldId, testAnalysisType);
      
      expect(images.length).toBe(1);
      expect(images[0].image_id).toBe(newImageData.image_id);
    });
  });

  describe('Storage Statistics', () => {
    test('should get field storage stats', async () => {
      await service.storeNewFieldImage(
        testFieldId,
        testAnalysisType,
        testImageData
      );

      const stats = service.getFieldStorageStats(testFieldId);
      
      expect(stats.field_id).toBe(testFieldId);
      expect(stats.analysis_types).toBeDefined();
    });

    test('should show zero stats for non-existent field', () => {
      const stats = service.getFieldStorageStats('NON-EXISTENT-FIELD');
      
      expect(stats.field_id).toBe('NON-EXISTENT-FIELD');
      expect(Object.keys(stats.analysis_types).length).toBe(0);
    });
  });

  describe('Cleanup Operations', () => {
    test('should cleanup all field images', async () => {
      // Store images for multiple analysis types
      await service.storeNewFieldImage(
        testFieldId,
        'zone-image',
        { image_id: 'zone_001', date: '2024-10-26' }
      );

      await service.storeNewFieldImage(
        testFieldId,
        'time-series',
        { image_id: 'series_001', date: '2024-10-26' }
      );

      const result = await service.cleanupFieldImages(testFieldId);
      
      expect(result.success).toBe(true);
      expect(result.total_deleted).toBeGreaterThan(0);
    });

    test('should remove field indices after cleanup', async () => {
      await service.storeNewFieldImage(
        testFieldId,
        testAnalysisType,
        testImageData
      );

      await service.cleanupFieldImages(testFieldId);

      const storagePath = service.STORAGE_PATHS[testAnalysisType];
      const fieldIndexPath = path.join(storagePath, `${testFieldId}_index.json`);
      
      expect(fs.existsSync(fieldIndexPath)).toBe(false);
    });
  });

  describe('Multiple Fields', () => {
    test('should handle multiple fields independently', async () => {
      const field1 = 'FIELD-001';
      const field2 = 'FIELD-002';

      await service.storeNewFieldImage(
        field1,
        testAnalysisType,
        { image_id: 'img_001', date: '2024-10-26' }
      );

      await service.storeNewFieldImage(
        field2,
        testAnalysisType,
        { image_id: 'img_002', date: '2024-10-26' }
      );

      const images1 = service.getExistingFieldImages(field1, testAnalysisType);
      const images2 = service.getExistingFieldImages(field2, testAnalysisType);

      expect(images1[0].image_id).toBe('img_001');
      expect(images2[0].image_id).toBe('img_002');
    });

    test('should replace images for one field without affecting others', async () => {
      const field1 = 'FIELD-001';
      const field2 = 'FIELD-002';

      // Store images for both fields
      await service.storeNewFieldImage(
        field1,
        testAnalysisType,
        { image_id: 'img_001', date: '2024-10-26' }
      );

      await service.storeNewFieldImage(
        field2,
        testAnalysisType,
        { image_id: 'img_002', date: '2024-10-26' }
      );

      // Replace field1 images
      await service.replaceFieldImages(
        field1,
        testAnalysisType,
        { image_id: 'img_001_new', date: '2024-10-27' }
      );

      const images1 = service.getExistingFieldImages(field1, testAnalysisType);
      const images2 = service.getExistingFieldImages(field2, testAnalysisType);

      expect(images1[0].image_id).toBe('img_001_new');
      expect(images2[0].image_id).toBe('img_002');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing storage paths gracefully', () => {
      const images = service.getExistingFieldImages(
        testFieldId,
        'invalid-type'
      );

      expect(Array.isArray(images)).toBe(true);
    });

    test('should handle corrupted index files', () => {
      const storagePath = service.STORAGE_PATHS[testAnalysisType];
      const fieldIndexPath = path.join(storagePath, `${testFieldId}_index.json`);
      
      // Create corrupted index
      fs.writeFileSync(fieldIndexPath, 'invalid json {');

      const images = service.getExistingFieldImages(testFieldId, testAnalysisType);
      
      expect(Array.isArray(images)).toBe(true);
    });
  });
});

