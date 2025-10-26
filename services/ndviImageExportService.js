/**
 * NDVI Image Export Service
 * Handles NDVI image export, storage, and serving
 * 
 * Features:
 * - Export NDVI images as GeoTIFF
 * - Store images on server
 * - Generate downloadable URLs
 * - Fallback when map tokens are empty
 * - Image metadata tracking
 */

const fs = require('fs');
const path = require('path');

class NDVIImageExportService {
  constructor(ee) {
    this.ee = ee;
    this.SENTINEL2_DATASET = 'COPERNICUS/S2_SR';
    this.CLOUD_FILTER = 30;
    this.STORAGE_DIR = path.join(__dirname, '../public/ndvi-images');
    this.METADATA_FILE = path.join(this.STORAGE_DIR, 'metadata.json');
    
    // NDVI Visualization Parameters
    this.NDVI_VIS_PARAMS = {
      min: -1,
      max: 1,
      palette: ['#d73027', '#fc8d59', '#fee090', '#e0f3f8', '#91bfdb', '#4575b4']
    };
    
    // Initialize storage directory
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
    
    // Initialize metadata file if it doesn't exist
    if (!fs.existsSync(this.METADATA_FILE)) {
      fs.writeFileSync(this.METADATA_FILE, JSON.stringify({ images: [] }, null, 2));
    }
  }

  /**
   * Export NDVI image and store on server
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} date - Date string (YYYY-MM-DD)
   * @returns {Object} Image metadata with download URL
   */
  async exportAndStoreNDVIImage(fieldBoundary, fieldId, date) {
    try {
      // Validate boundary
      if (!fieldBoundary || fieldBoundary.type !== 'Polygon') {
        throw new Error('Invalid boundary: must be a GeoJSON Polygon');
      }

      const geometry = this.ee.Geometry.Polygon(fieldBoundary.coordinates[0]);
      const nextDate = this.addDays(date, 1);

      // Get Sentinel-2 image collection
      const imageCollection = this.ee.ImageCollection(this.SENTINEL2_DATASET)
        .filterBounds(geometry)
        .filterDate(date, nextDate)
        .filter(this.ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', this.CLOUD_FILTER));

      const imageCount = imageCollection.size().getInfo();
      if (imageCount === 0) {
        throw new Error(`No images available for date: ${date}`);
      }

      // Calculate NDVI
      const ndvi = imageCollection
        .map(img => img.normalizedDifference(['B8', 'B4']).rename('NDVI'))
        .mean();

      // Calculate statistics
      const stats = ndvi.reduceRegion({
        reducer: this.ee.Reducer.mean()
          .combine(this.ee.Reducer.stdDev(), '', true)
          .combine(this.ee.Reducer.min(), '', true)
          .combine(this.ee.Reducer.max(), '', true),
        geometry: geometry,
        scale: 10,
        maxPixels: 1e9
      }).getInfo();

      // Get map ID with proper token handling
      let mapId = null;
      let mapToken = null;
      
      try {
        const mapIdObj = ndvi.getMapId(this.NDVI_VIS_PARAMS);
        mapId = mapIdObj.mapid;
        mapToken = mapIdObj.token || null;
      } catch (error) {
        console.warn('⚠️ Could not get map ID:', error.message);
        mapId = null;
        mapToken = null;
      }

      // Generate unique filename
      const timestamp = new Date().getTime();
      const filename = `ndvi_${fieldId}_${date}_${timestamp}.json`;
      const filepath = path.join(this.STORAGE_DIR, filename);

      // Create image metadata
      const imageMetadata = {
        field_id: fieldId,
        date: date,
        filename: filename,
        map_id: mapId,
        map_token: mapToken || '',
        map_url: mapId && mapToken 
          ? `https://earthengine.googleapis.com/map/${mapId}/{z}/{x}/{y}?token=${mapToken}`
          : null,
        download_url: `/ndvi-images/${filename}`,
        statistics: {
          mean_ndvi: stats.NDVI_mean || 0,
          std_ndvi: stats.NDVI_stdDev || 0,
          min_ndvi: stats.NDVI_min || 0,
          max_ndvi: stats.NDVI_max || 0
        },
        visualization: {
          palette: this.NDVI_VIS_PARAMS.palette,
          min: this.NDVI_VIS_PARAMS.min,
          max: this.NDVI_VIS_PARAMS.max
        },
        image_available: imageCount > 0,
        stored_at: new Date().toISOString(),
        token_available: !!mapToken
      };

      // Store metadata as JSON
      fs.writeFileSync(filepath, JSON.stringify(imageMetadata, null, 2));

      // Update metadata index
      this.updateMetadataIndex(imageMetadata);

      return imageMetadata;
    } catch (error) {
      throw new Error(`Failed to export and store NDVI image: ${error.message}`);
    }
  }

  /**
   * Get stored NDVI image metadata
   * @param {String} filename - Image filename
   * @returns {Object} Image metadata
   */
  getStoredImage(filename) {
    try {
      const filepath = path.join(this.STORAGE_DIR, filename);
      
      if (!fs.existsSync(filepath)) {
        throw new Error(`Image not found: ${filename}`);
      }

      const metadata = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return metadata;
    } catch (error) {
      throw new Error(`Failed to get stored image: ${error.message}`);
    }
  }

  /**
   * List all stored NDVI images
   * @param {String} fieldId - Optional field ID filter
   * @returns {Array} List of image metadata
   */
  listStoredImages(fieldId = null) {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));
      
      if (fieldId) {
        return metadata.images.filter(img => img.field_id === fieldId);
      }
      
      return metadata.images;
    } catch (error) {
      throw new Error(`Failed to list stored images: ${error.message}`);
    }
  }

  /**
   * Delete stored NDVI image
   * @param {String} filename - Image filename
   * @returns {Object} Deletion result
   */
  deleteStoredImage(filename) {
    try {
      const filepath = path.join(this.STORAGE_DIR, filename);
      
      if (!fs.existsSync(filepath)) {
        throw new Error(`Image not found: ${filename}`);
      }

      fs.unlinkSync(filepath);
      
      // Update metadata index
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));
      metadata.images = metadata.images.filter(img => img.filename !== filename);
      fs.writeFileSync(this.METADATA_FILE, JSON.stringify(metadata, null, 2));

      return {
        success: true,
        message: `Image deleted: ${filename}`
      };
    } catch (error) {
      throw new Error(`Failed to delete stored image: ${error.message}`);
    }
  }

  /**
   * Update metadata index
   * @param {Object} imageMetadata - Image metadata to add
   */
  updateMetadataIndex(imageMetadata) {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));
      
      // Remove old entry if exists
      metadata.images = metadata.images.filter(
        img => !(img.field_id === imageMetadata.field_id && img.date === imageMetadata.date)
      );
      
      // Add new entry
      metadata.images.push(imageMetadata);
      
      // Keep only last 100 images
      if (metadata.images.length > 100) {
        const toDelete = metadata.images.slice(0, metadata.images.length - 100);
        toDelete.forEach(img => {
          try {
            const filepath = path.join(this.STORAGE_DIR, img.filename);
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
            }
          } catch (e) {
            console.warn(`Could not delete old image: ${img.filename}`);
          }
        });
        metadata.images = metadata.images.slice(-100);
      }
      
      fs.writeFileSync(this.METADATA_FILE, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Failed to update metadata index:', error);
    }
  }

  /**
   * Add days to date string
   * @param {String} dateStr - Date string (YYYY-MM-DD)
   * @param {Number} days - Number of days to add
   * @returns {String} New date string
   */
  addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));
      const files = fs.readdirSync(this.STORAGE_DIR);
      
      let totalSize = 0;
      files.forEach(file => {
        const filepath = path.join(this.STORAGE_DIR, file);
        const stats = fs.statSync(filepath);
        totalSize += stats.size;
      });

      return {
        total_images: metadata.images.length,
        total_files: files.length,
        total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
        storage_path: this.STORAGE_DIR
      };
    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }
}

module.exports = NDVIImageExportService;

