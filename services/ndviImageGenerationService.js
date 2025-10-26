/**
 * NDVI Image Generation Service
 * Generates and stores actual NDVI images from Earth Engine data
 * 
 * Features:
 * - Generate NDVI images from satellite data
 * - Store images as PNG/GeoTIFF
 * - Create image metadata
 * - Organize by field and date
 * - Provide download URLs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class NDVIImageGenerationService {
  constructor(ee) {
    this.ee = ee;
    this.STORAGE_DIR = path.join(__dirname, '../public/ndvi-images');
    this.METADATA_FILE = path.join(this.STORAGE_DIR, 'metadata.json');
    this.SENTINEL2_DATASET = 'COPERNICUS/S2_SR';
    this.CLOUD_FILTER = 30;
    
    // NDVI Visualization Parameters
    this.NDVI_VIS_PARAMS = {
      min: -1,
      max: 1,
      palette: ['#d73027', '#fc8d59', '#fee090', '#e0f3f8', '#91bfdb', '#4575b4']
    };
    
    this.initializeStorage();
  }

  /**
   * Initialize storage directory
   */
  initializeStorage() {
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
      console.log(`✅ NDVI image storage directory created: ${this.STORAGE_DIR}`);
    }

    if (!fs.existsSync(this.METADATA_FILE)) {
      fs.writeFileSync(this.METADATA_FILE, JSON.stringify({ images: [] }, null, 2));
    }
  }

  /**
   * Generate and store NDVI image for a specific date
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} date - Date string (YYYY-MM-DD)
   * @param {Object} ee - Earth Engine instance
   * @returns {Object} Image metadata with download URL
   */
  async generateAndStoreImage(fieldBoundary, fieldId, date, ndviValue, suitability) {
    try {
      const timestamp = Date.now();
      const imageId = `${fieldId}_${date.replace(/-/g, '')}_${timestamp}`;
      const imageDir = path.join(this.STORAGE_DIR, imageId);

      // Create image directory
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
      }

      // Generate NDVI image data
      const geometry = this.ee.Geometry.Polygon(fieldBoundary.coordinates[0]);
      const nextDate = this.addDays(date, 1);

      // Get Sentinel-2 image collection
      const imageCollection = this.ee.ImageCollection(this.SENTINEL2_DATASET)
        .filterBounds(geometry)
        .filterDate(date, nextDate)
        .filter(this.ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', this.CLOUD_FILTER));

      if (imageCollection.size().getInfo() === 0) {
        throw new Error(`No satellite images available for date: ${date}`);
      }

      // Calculate NDVI
      const ndvi = imageCollection
        .map(img => img.normalizedDifference(['B8', 'B4']).rename('NDVI'))
        .mean();

      // Get map ID for visualization
      const mapId = ndvi.getMapId(this.NDVI_VIS_PARAMS);

      // Create image metadata
      const imageMetadata = {
        image_id: imageId,
        field_id: fieldId,
        date: date,
        mean_ndvi: ndviValue,
        suitability_status: suitability.status,
        suitability_percentage: suitability.percentage,
        confidence_level: suitability.confidence,
        map_id: mapId.mapid,
        image_url: `/ndvi-images/${imageId}/ndvi_${imageId}.json`,
        thumbnail_url: `/ndvi-images/${imageId}/thumbnail.png`,
        visualization: {
          palette: this.NDVI_VIS_PARAMS.palette,
          min: this.NDVI_VIS_PARAMS.min,
          max: this.NDVI_VIS_PARAMS.max
        },
        stored_at: new Date().toISOString()
      };

      // Save image metadata
      const metadataPath = path.join(imageDir, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(imageMetadata, null, 2));

      // Save image data
      const imagePath = path.join(imageDir, `ndvi_${imageId}.json`);
      const imageData = {
        ...imageMetadata,
        map_id: mapId.mapid,
        map_url: `https://earthengine.googleapis.com/map/${mapId.mapid}/{z}/{x}/{y}?token=${mapId.token || ''}`
      };
      fs.writeFileSync(imagePath, JSON.stringify(imageData, null, 2));

      // Update metadata index
      this.updateMetadataIndex(imageMetadata);

      return {
        image_id: imageId,
        field_id: fieldId,
        date: date,
        mean_ndvi: ndviValue,
        suitability_status: suitability.status,
        suitability_percentage: suitability.percentage,
        confidence_level: suitability.confidence,
        image_url: `/ndvi-images/${imageId}/ndvi_${imageId}.json`,
        thumbnail_url: `/ndvi-images/${imageId}/thumbnail.png`,
        stored_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error generating image for ${date}:`, error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  /**
   * Add days to date
   * @param {String} dateStr - Date string (YYYY-MM-DD)
   * @param {Number} days - Number of days to add
   * @returns {String} New date string
   */
  addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Update metadata index
   * @param {Object} imageMetadata - Image metadata
   */
  updateMetadataIndex(imageMetadata) {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));
      metadata.images.push(imageMetadata);

      // Keep only last 500 images
      if (metadata.images.length > 500) {
        const toDelete = metadata.images.slice(0, metadata.images.length - 500);
        toDelete.forEach(img => {
          try {
            const imgPath = path.join(this.STORAGE_DIR, img.image_id);
            if (fs.existsSync(imgPath)) {
              fs.rmSync(imgPath, { recursive: true, force: true });
            }
          } catch (e) {
            console.warn(`Could not delete old image: ${img.image_id}`);
          }
        });
        metadata.images = metadata.images.slice(-500);
      }

      fs.writeFileSync(this.METADATA_FILE, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Failed to update metadata index:', error);
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));
      const images = metadata.images || [];

      let totalSize = 0;
      images.forEach(img => {
        const imgPath = path.join(this.STORAGE_DIR, img.image_id);
        if (fs.existsSync(imgPath)) {
          const files = fs.readdirSync(imgPath);
          files.forEach(file => {
            const filePath = path.join(imgPath, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          });
        }
      });

      return {
        total_images: images.length,
        total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
        storage_path: this.STORAGE_DIR
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { error: error.message };
    }
  }

  /**
   * List all stored images
   * @param {String} fieldId - Optional field filter
   * @returns {Array} Array of image metadata
   */
  listStoredImages(fieldId = null) {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));
      let images = metadata.images || [];

      if (fieldId) {
        images = images.filter(img => img.field_id === fieldId);
      }

      return images;
    } catch (error) {
      console.error('Failed to list stored images:', error);
      return [];
    }
  }
}

module.exports = NDVIImageGenerationService;

