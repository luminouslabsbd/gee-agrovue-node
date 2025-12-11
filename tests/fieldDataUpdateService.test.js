/**
 * Tests for Field Data Update Service
 */

const FieldDataUpdateService = require('../services/fieldDataUpdateService');

describe('FieldDataUpdateService', () => {
  let service;
  let mockEE;
  let mockNDVIService;

  beforeEach(() => {
    mockEE = {};
    
    mockNDVIService = {
      generateFieldImage: jest.fn(async (boundary, fieldId, date) => ({
        field_id: fieldId,
        date: date,
        map_id: 'test-map-id',
        map_token: 'test-token',
        map_url: 'https://example.com/map',
        statistics: {
          mean_ndvi: 0.35,
          std_ndvi: 0.05,
          min_ndvi: 0.15,
          max_ndvi: 0.55
        }
      }))
    };

    service = new FieldDataUpdateService(mockEE, mockNDVIService);
  });

  describe('Initialization', () => {
    test('should initialize with Earth Engine and NDVI service', () => {
      expect(service).toBeDefined();
      expect(service.ee).toBe(mockEE);
      expect(service.ndviService).toBe(mockNDVIService);
    });

    test('should have empty field data store', () => {
      expect(service.fieldDataStore.size).toBe(0);
    });

    test('should have empty change history', () => {
      expect(service.changeHistory.size).toBe(0);
    });
  });

  describe('Boundary Validation', () => {
    test('should validate valid polygon boundary', () => {
      const validBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      expect(() => service.validateBoundary(validBoundary)).not.toThrow();
    });

    test('should reject invalid geometry type', () => {
      const invalidBoundary = {
        type: 'Point',
        coordinates: [90.37, 23.84]
      };

      expect(() => service.validateBoundary(invalidBoundary)).toThrow('Invalid boundary: must be a GeoJSON Polygon');
    });

    test('should reject polygon with less than 3 points', () => {
      const invalidBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84]]]
      };

      expect(() => service.validateBoundary(invalidBoundary)).toThrow('Invalid boundary: polygon must have at least 3 points');
    });

    test('should reject unclosed polygon', () => {
      const invalidBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85]]]
      };

      expect(() => service.validateBoundary(invalidBoundary)).toThrow('Invalid boundary: polygon must be closed');
    });
  });

  describe('Area and Perimeter Calculation', () => {
    test('should calculate area of polygon', () => {
      const boundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const area = service.calculateArea(boundary);
      expect(area).toBeGreaterThan(0);
    });

    test('should calculate perimeter of polygon', () => {
      const boundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const perimeter = service.calculatePerimeter(boundary);
      expect(perimeter).toBeGreaterThan(0);
    });
  });

  describe('Update Field Boundary', () => {
    test('should update field boundary successfully', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      const result = await service.updateFieldBoundary('FIELD-001', fieldBoundary, { name: 'Test Field' });

      expect(result.success).toBe(true);
      expect(result.field_id).toBe('FIELD-001');
      expect(result.data).toHaveProperty('boundary');
      expect(result.data).toHaveProperty('metadata');
      expect(result.data).toHaveProperty('area_sqm');
      expect(result.data).toHaveProperty('perimeter_m');
    });

    test('should record change history', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      await service.updateFieldBoundary('FIELD-001', fieldBoundary);
      const history = service.getChangeHistory('FIELD-001');

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].change_type).toBe('boundary_update');
    });

    test('should reject invalid boundary', async () => {
      const invalidBoundary = {
        type: 'Point',
        coordinates: [90.37, 23.84]
      };

      await expect(
        service.updateFieldBoundary('FIELD-001', invalidBoundary)
      ).rejects.toThrow();
    });
  });

  describe('Update Field Metadata', () => {
    test('should update field metadata', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      await service.updateFieldBoundary('FIELD-001', fieldBoundary);
      const result = await service.updateFieldMetadata('FIELD-001', { crop: 'Rice', season: 'Monsoon' });

      expect(result.success).toBe(true);
      expect(result.data.metadata).toHaveProperty('crop', 'Rice');
      expect(result.data.metadata).toHaveProperty('season', 'Monsoon');
    });

    test('should throw error for non-existent field', async () => {
      await expect(
        service.updateFieldMetadata('NON-EXISTENT', { crop: 'Rice' })
      ).rejects.toThrow('Field NON-EXISTENT not found');
    });
  });

  describe('Recalculate NDVI', () => {
    test('should recalculate NDVI for field', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      await service.updateFieldBoundary('FIELD-001', fieldBoundary);
      const result = await service.recalculateNDVI('FIELD-001', '2025-01-15');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('map_id');
      expect(result.data).toHaveProperty('statistics');
    });

    test('should throw error for non-existent field', async () => {
      await expect(
        service.recalculateNDVI('NON-EXISTENT', '2025-01-15')
      ).rejects.toThrow('Field NON-EXISTENT not found');
    });
  });

  describe('Get Field Data', () => {
    test('should retrieve field data', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      await service.updateFieldBoundary('FIELD-001', fieldBoundary);
      const fieldData = service.getFieldData('FIELD-001');

      expect(fieldData).toHaveProperty('field_id', 'FIELD-001');
      expect(fieldData).toHaveProperty('boundary');
      expect(fieldData).toHaveProperty('metadata');
    });

    test('should throw error for non-existent field', () => {
      expect(() => service.getFieldData('NON-EXISTENT')).toThrow('Field NON-EXISTENT not found');
    });
  });

  describe('Change History', () => {
    test('should track change history', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      await service.updateFieldBoundary('FIELD-001', fieldBoundary);
      await service.updateFieldMetadata('FIELD-001', { crop: 'Rice' });

      const history = service.getChangeHistory('FIELD-001');

      expect(history.length).toBe(2);
      expect(history[0].change_type).toBe('boundary_update');
      expect(history[1].change_type).toBe('metadata_update');
    });
  });

  describe('Export Field Data', () => {
    test('should export field data with history', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      await service.updateFieldBoundary('FIELD-001', fieldBoundary);
      const exported = service.exportFieldData('FIELD-001');

      expect(exported).toHaveProperty('field_data');
      expect(exported).toHaveProperty('change_history');
      expect(exported).toHaveProperty('export_date');
    });
  });

  describe('Clear Field Data', () => {
    test('should clear field data', async () => {
      const fieldBoundary = {
        type: 'Polygon',
        coordinates: [[[90.37, 23.84], [90.38, 23.84], [90.38, 23.85], [90.37, 23.85], [90.37, 23.84]]]
      };

      await service.updateFieldBoundary('FIELD-001', fieldBoundary);
      service.clearFieldData('FIELD-001');

      expect(() => service.getFieldData('FIELD-001')).toThrow();
    });
  });
});

