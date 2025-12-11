/**
 * Field Image Management Service
 * Manages image storage and replacement for field analysis
 * 
 * Features:
 * - Detect existing field images
 * - Delete old images when new analysis is performed
 * - Maintain field-based image index
 * - Support multiple analysis types (zone, time-series, ndvi-export)
 * - Automatic cleanup and storage optimization
 */

const fs = require('fs');
const path = require('path');

class FieldImageManagementService {
  constructor() {
    this.STORAGE_BASE = path.join(__dirname, '../public');
    this.ANALYSIS_TYPES = {
      ZONE_IMAGE: 'zone-image',
      TIME_SERIES: 'time-series',
      NDVI_EXPORT: 'ndvi-export'
    };
    
    this.STORAGE_PATHS = {
      'zone-image': path.join(this.STORAGE_BASE, 'zone-images'),
      'time-series': path.join(this.STORAGE_BASE, 'time-series-images'),
      'ndvi-export': path.join(this.STORAGE_BASE, 'ndvi-images')
    };
    
    this.initializeStorage();
  }

  /**
   * Initialize storage directories and indices
   */
  initializeStorage() {
    Object.values(this.STORAGE_PATHS).forEach(storagePath => {
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
      }
    });
  }

  /**
   * Get existing images for a field
   * @param {String} fieldId - Field identifier
   * @param {String} analysisType - Type of analysis (zone-image, time-series, ndvi-export)
   * @returns {Array} Array of existing image metadata
   */
  getExistingFieldImages(fieldId, analysisType) {
    try {
      const storagePath = this.STORAGE_PATHS[analysisType];
      const fieldIndexPath = path.join(storagePath, `${fieldId}_index.json`);

      if (!fs.existsSync(fieldIndexPath)) {
        return [];
      }

      const index = JSON.parse(fs.readFileSync(fieldIndexPath, 'utf8'));
      return index.images || [];
    } catch (error) {
      console.warn(`Could not read field images for ${fieldId}:`, error.message);
      return [];
    }
  }

  /**
   * Delete old images for a field
   * @param {String} fieldId - Field identifier
   * @param {String} analysisType - Type of analysis
   * @returns {Object} Deletion result
   */
  async deleteOldFieldImages(fieldId, analysisType) {
    try {
      const existingImages = this.getExistingFieldImages(fieldId, analysisType);
      const storagePath = this.STORAGE_PATHS[analysisType];
      let deletedCount = 0;

      for (const imageData of existingImages) {
        const imagePath = path.join(storagePath, imageData.image_id);
        
        if (fs.existsSync(imagePath)) {
          fs.rmSync(imagePath, { recursive: true, force: true });
          deletedCount++;
          console.log(`🗑️  Deleted old ${analysisType} image: ${imageData.image_id}`);
        }
      }

      return {
        success: true,
        deleted_count: deletedCount,
        field_id: fieldId,
        analysis_type: analysisType
      };
    } catch (error) {
      console.error(`Error deleting old images for ${fieldId}:`, error);
      throw new Error(`Failed to delete old images: ${error.message}`);
    }
  }

  /**
   * Store new field image metadata
   * @param {String} fieldId - Field identifier
   * @param {String} analysisType - Type of analysis
   * @param {Object} imageData - Image metadata
   * @returns {Object} Storage result
   */
  async storeNewFieldImage(fieldId, analysisType, imageData) {
    try {
      const storagePath = this.STORAGE_PATHS[analysisType];
      const fieldIndexPath = path.join(storagePath, `${fieldId}_index.json`);

      // Create field index if it doesn't exist
      let fieldIndex = { field_id: fieldId, analysis_type: analysisType, images: [] };
      
      if (fs.existsSync(fieldIndexPath)) {
        fieldIndex = JSON.parse(fs.readFileSync(fieldIndexPath, 'utf8'));
      }

      // Add new image to index
      fieldIndex.images = [{
        image_id: imageData.image_id,
        stored_at: new Date().toISOString(),
        ...imageData
      }];

      // Save updated index
      fs.writeFileSync(fieldIndexPath, JSON.stringify(fieldIndex, null, 2));

      console.log(`✅ Stored new ${analysisType} image for field ${fieldId}`);

      return {
        success: true,
        field_id: fieldId,
        analysis_type: analysisType,
        image_id: imageData.image_id
      };
    } catch (error) {
      console.error(`Error storing field image for ${fieldId}:`, error);
      throw new Error(`Failed to store field image: ${error.message}`);
    }
  }

  /**
   * Get latest image for a field
   * @param {String} fieldId - Field identifier
   * @param {String} analysisType - Type of analysis
   * @returns {Object} Latest image metadata or null
   */
  getLatestFieldImage(fieldId, analysisType) {
    try {
      const images = this.getExistingFieldImages(fieldId, analysisType);
      
      if (images.length === 0) {
        return null;
      }

      // Return the most recent image (should be only one after replacement)
      return images[0];
    } catch (error) {
      console.error(`Error getting latest image for ${fieldId}:`, error);
      return null;
    }
  }

  /**
   * Replace field images (delete old, store new)
   * @param {String} fieldId - Field identifier
   * @param {String} analysisType - Type of analysis
   * @param {Object} imageData - New image metadata
   * @returns {Object} Replacement result
   */
  async replaceFieldImages(fieldId, analysisType, imageData) {
    try {
      console.log(`🔄 Replacing images for field ${fieldId} (${analysisType})...`);

      // Delete old images
      const deleteResult = await this.deleteOldFieldImages(fieldId, analysisType);
      console.log(`✅ Deleted ${deleteResult.deleted_count} old images`);

      // Store new image
      const storeResult = await this.storeNewFieldImage(fieldId, analysisType, imageData);
      console.log(`✅ Stored new image: ${imageData.image_id}`);

      return {
        success: true,
        field_id: fieldId,
        analysis_type: analysisType,
        deleted_count: deleteResult.deleted_count,
        new_image_id: storeResult.image_id,
        replaced_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error replacing field images:`, error);
      throw new Error(`Failed to replace field images: ${error.message}`);
    }
  }

  /**
   * Get storage statistics for a field
   * @param {String} fieldId - Field identifier
   * @returns {Object} Storage statistics
   */
  getFieldStorageStats(fieldId) {
    try {
      const stats = {
        field_id: fieldId,
        analysis_types: {}
      };

      Object.entries(this.STORAGE_PATHS).forEach(([type, storagePath]) => {
        const fieldIndexPath = path.join(storagePath, `${fieldId}_index.json`);
        
        if (fs.existsSync(fieldIndexPath)) {
          const index = JSON.parse(fs.readFileSync(fieldIndexPath, 'utf8'));
          const images = index.images || [];
          
          let totalSize = 0;
          images.forEach(img => {
            const imagePath = path.join(storagePath, img.image_id);
            if (fs.existsSync(imagePath)) {
              const files = fs.readdirSync(imagePath);
              files.forEach(file => {
                const filePath = path.join(imagePath, file);
                const fileStats = fs.statSync(filePath);
                totalSize += fileStats.size;
              });
            }
          });

          stats.analysis_types[type] = {
            image_count: images.length,
            total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
            latest_image: images[0] || null
          };
        }
      });

      return stats;
    } catch (error) {
      console.error(`Error getting storage stats for ${fieldId}:`, error);
      return { error: error.message };
    }
  }

  /**
   * Clean up all images for a field
   * @param {String} fieldId - Field identifier
   * @returns {Object} Cleanup result
   */
  async cleanupFieldImages(fieldId) {
    try {
      let totalDeleted = 0;

      for (const [type, storagePath] of Object.entries(this.STORAGE_PATHS)) {
        const fieldIndexPath = path.join(storagePath, `${fieldId}_index.json`);
        
        if (fs.existsSync(fieldIndexPath)) {
          const deleteResult = await this.deleteOldFieldImages(fieldId, type);
          totalDeleted += deleteResult.deleted_count;
          
          // Delete field index
          fs.unlinkSync(fieldIndexPath);
        }
      }

      console.log(`✅ Cleaned up all images for field ${fieldId}`);

      return {
        success: true,
        field_id: fieldId,
        total_deleted: totalDeleted,
        cleaned_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error cleaning up field images:`, error);
      throw new Error(`Failed to cleanup field images: ${error.message}`);
    }
  }
}

module.exports = FieldImageManagementService;

