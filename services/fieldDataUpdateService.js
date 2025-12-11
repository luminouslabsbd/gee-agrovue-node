/**
 * Field Data Update Service
 * Handles field data updates and recalculation of NDVI
 * 
 * Features:
 * - Update field boundary
 * - Update field metadata
 * - Recalculate NDVI after updates
 * - Track change history
 * - Validate data changes
 */

class FieldDataUpdateService {
  constructor(ee, ndviService) {
    this.ee = ee;
    this.ndviService = ndviService;
    this.fieldDataStore = new Map(); // In-memory store for field data
    this.changeHistory = new Map(); // Track changes
  }

  /**
   * Update field boundary
   * @param {String} fieldId - Field identifier
   * @param {Object} newBoundary - New GeoJSON polygon
   * @param {Object} metadata - Field metadata
   * @returns {Object} Update result with validation
   */
  async updateFieldBoundary(fieldId, newBoundary, metadata = {}) {
    try {
      // Validate boundary
      this.validateBoundary(newBoundary);

      // Get old data
      const oldData = this.fieldDataStore.get(fieldId) || {};

      // Create new field data
      const newFieldData = {
        field_id: fieldId,
        boundary: newBoundary,
        metadata: {
          ...oldData.metadata,
          ...metadata,
          updated_at: new Date().toISOString()
        },
        area_sqm: this.calculateArea(newBoundary),
        perimeter_m: this.calculatePerimeter(newBoundary)
      };

      // Store updated data
      this.fieldDataStore.set(fieldId, newFieldData);

      // Record change
      this.recordChange(fieldId, 'boundary_update', oldData, newFieldData);

      return {
        success: true,
        field_id: fieldId,
        message: 'Field boundary updated successfully',
        data: newFieldData,
        changes: {
          area_changed: oldData.area_sqm !== newFieldData.area_sqm,
          old_area: oldData.area_sqm,
          new_area: newFieldData.area_sqm
        }
      };
    } catch (error) {
      throw new Error(`Failed to update field boundary: ${error.message}`);
    }
  }

  /**
   * Update field metadata
   * @param {String} fieldId - Field identifier
   * @param {Object} metadata - Metadata to update
   * @returns {Object} Update result
   */
  async updateFieldMetadata(fieldId, metadata) {
    try {
      const fieldData = this.fieldDataStore.get(fieldId);
      
      if (!fieldData) {
        throw new Error(`Field ${fieldId} not found`);
      }

      const oldMetadata = { ...fieldData.metadata };
      
      fieldData.metadata = {
        ...fieldData.metadata,
        ...metadata,
        updated_at: new Date().toISOString()
      };

      this.fieldDataStore.set(fieldId, fieldData);
      this.recordChange(fieldId, 'metadata_update', { metadata: oldMetadata }, { metadata: fieldData.metadata });

      return {
        success: true,
        field_id: fieldId,
        message: 'Field metadata updated successfully',
        data: fieldData,
        updated_fields: Object.keys(metadata)
      };
    } catch (error) {
      throw new Error(`Failed to update field metadata: ${error.message}`);
    }
  }

  /**
   * Recalculate NDVI after field update
   * @param {String} fieldId - Field identifier
   * @param {String} date - Date for NDVI calculation
   * @returns {Object} Recalculated NDVI data
   */
  async recalculateNDVI(fieldId, date) {
    try {
      const fieldData = this.fieldDataStore.get(fieldId);
      
      if (!fieldData) {
        throw new Error(`Field ${fieldId} not found`);
      }

      // Generate field image with new boundary
      const fieldImage = await this.ndviService.generateFieldImage(
        fieldData.boundary,
        fieldId,
        date
      );

      // Record recalculation
      this.recordChange(fieldId, 'ndvi_recalculation', { date }, fieldImage);

      return {
        success: true,
        field_id: fieldId,
        message: 'NDVI recalculated successfully',
        data: fieldImage
      };
    } catch (error) {
      throw new Error(`Failed to recalculate NDVI: ${error.message}`);
    }
  }

  /**
   * Get field data
   * @param {String} fieldId - Field identifier
   * @returns {Object} Field data
   */
  getFieldData(fieldId) {
    const fieldData = this.fieldDataStore.get(fieldId);
    
    if (!fieldData) {
      throw new Error(`Field ${fieldId} not found`);
    }

    return fieldData;
  }

  /**
   * Get change history
   * @param {String} fieldId - Field identifier
   * @returns {Array} Change history
   */
  getChangeHistory(fieldId) {
    return this.changeHistory.get(fieldId) || [];
  }

  /**
   * Record change
   * @param {String} fieldId - Field identifier
   * @param {String} changeType - Type of change
   * @param {Object} oldData - Old data
   * @param {Object} newData - New data
   */
  recordChange(fieldId, changeType, oldData, newData) {
    const history = this.changeHistory.get(fieldId) || [];
    
    history.push({
      timestamp: new Date().toISOString(),
      change_type: changeType,
      old_data: oldData,
      new_data: newData
    });

    this.changeHistory.set(fieldId, history);
  }

  /**
   * Validate boundary
   * @param {Object} boundary - GeoJSON polygon
   */
  validateBoundary(boundary) {
    if (!boundary || boundary.type !== 'Polygon') {
      throw new Error('Invalid boundary: must be a GeoJSON Polygon');
    }

    if (!boundary.coordinates || boundary.coordinates.length === 0) {
      throw new Error('Invalid boundary: coordinates are required');
    }

    if (boundary.coordinates[0].length < 3) {
      throw new Error('Invalid boundary: polygon must have at least 3 points');
    }

    // Check if first and last points are the same (closed polygon)
    const coords = boundary.coordinates[0];
    const first = coords[0];
    const last = coords[coords.length - 1];

    if (first[0] !== last[0] || first[1] !== last[1]) {
      throw new Error('Invalid boundary: polygon must be closed (first and last points must be the same)');
    }
  }

  /**
   * Calculate area of polygon (simplified)
   * @param {Object} boundary - GeoJSON polygon
   * @returns {Number} Area in square meters
   */
  calculateArea(boundary) {
    // Simplified calculation - in production use proper GIS library
    const coords = boundary.coordinates[0];
    let area = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const x1 = coords[i][0];
      const y1 = coords[i][1];
      const x2 = coords[i + 1][0];
      const y2 = coords[i + 1][1];

      area += (x2 - x1) * (y2 + y1);
    }

    // Convert to approximate square meters (rough estimate)
    return Math.abs(area) * 111000 * 111000 / 2;
  }

  /**
   * Calculate perimeter of polygon (simplified)
   * @param {Object} boundary - GeoJSON polygon
   * @returns {Number} Perimeter in meters
   */
  calculatePerimeter(boundary) {
    // Simplified calculation - in production use proper GIS library
    const coords = boundary.coordinates[0];
    let perimeter = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const x1 = coords[i][0];
      const y1 = coords[i][1];
      const x2 = coords[i + 1][0];
      const y2 = coords[i + 1][1];

      const dx = x2 - x1;
      const dy = y2 - y1;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    // Convert to approximate meters
    return perimeter * 111000;
  }

  /**
   * Export field data
   * @param {String} fieldId - Field identifier
   * @returns {Object} Exported field data
   */
  exportFieldData(fieldId) {
    const fieldData = this.getFieldData(fieldId);
    const history = this.getChangeHistory(fieldId);

    return {
      field_data: fieldData,
      change_history: history,
      export_date: new Date().toISOString()
    };
  }

  /**
   * Clear field data
   * @param {String} fieldId - Field identifier
   */
  clearFieldData(fieldId) {
    this.fieldDataStore.delete(fieldId);
    this.changeHistory.delete(fieldId);
  }
}

module.exports = FieldDataUpdateService;

