/**
 * Time Series Image Storage Service
 * Saves NDVI map images from time series data to server storage
 * Provides download URLs for each image
 * 
 * Features:
 * - Store time series images with metadata
 * - Generate download URLs
 * - Organize by field and date
 * - Auto-cleanup old images
 * - Track storage statistics
 */

const fs = require('fs');
const path = require('path');

class TimeSeriesImageStorageService {
  constructor() {
    this.STORAGE_DIR = path.join(__dirname, '../public/time-series-images');
    this.METADATA_FILE = path.join(this.STORAGE_DIR, 'metadata.json');
    this.initializeStorage();
  }

  /**
   * Initialize storage directory and metadata file
   */
  initializeStorage() {
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
      console.log(`✅ Time series image storage directory created: ${this.STORAGE_DIR}`);
    }

    if (!fs.existsSync(this.METADATA_FILE)) {
      fs.writeFileSync(this.METADATA_FILE, JSON.stringify({ series: [] }, null, 2));
    }
  }

  /**
   * Save time series images and return with download URLs
   * @param {Object} timeSeriesData - Time series data from NDVITwoYearTimeSeriesService
   * @param {String} fieldId - Field identifier
   * @returns {Object} Time series data with image download URLs
   */
  saveTimeSeriesImages(timeSeriesData, fieldId) {
    try {
      const timestamp = Date.now();
      const seriesId = `${fieldId}_${timestamp}`;
      const seriesDir = path.join(this.STORAGE_DIR, seriesId);

      // Create series directory
      if (!fs.existsSync(seriesDir)) {
        fs.mkdirSync(seriesDir, { recursive: true });
      }

      // Process time series data and save images
      const enhancedTimeSeries = timeSeriesData.time_series.map((item, index) => {
        const imageFilename = `ndvi_${fieldId}_${item.date}_${index}.json`;
        const imagePath = path.join(seriesDir, imageFilename);

        // Create image metadata
        const imageMetadata = {
          field_id: fieldId,
          date: item.date,
          filename: imageFilename,
          map_id: item.map_id,
          map_token: item.map_token || '',
          map_url: item.map_url,
          download_url: `/time-series-images/${seriesId}/${imageFilename}`,
          statistics: {
            mean_ndvi: item.mean_ndvi,
            std_ndvi: item.std_ndvi,
            min_ndvi: item.min_ndvi,
            max_ndvi: item.max_ndvi
          },
          image_available: item.image_available,
          token_available: !!item.map_token,
          stored_at: new Date().toISOString()
        };

        // Save image metadata to file
        fs.writeFileSync(imagePath, JSON.stringify(imageMetadata, null, 2));

        // Return enhanced item with download URL
        return {
          ...item,
          download_url: `/time-series-images/${seriesId}/${imageFilename}`,
          token_available: !!item.map_token,
          stored_at: new Date().toISOString()
        };
      });

      // Save field images with download URLs
      const enhancedFieldImages = timeSeriesData.field_images.map((item, index) => {
        const imageFilename = `field_ndvi_${fieldId}_${item.date}_${index}.json`;
        const imagePath = path.join(seriesDir, imageFilename);

        const imageMetadata = {
          field_id: fieldId,
          date: item.date,
          filename: imageFilename,
          map_id: item.map_id,
          map_token: item.map_token || '',
          map_url: item.map_url,
          download_url: `/time-series-images/${seriesId}/${imageFilename}`,
          token_available: !!item.map_token,
          stored_at: new Date().toISOString()
        };

        fs.writeFileSync(imagePath, JSON.stringify(imageMetadata, null, 2));

        return {
          ...item,
          download_url: `/time-series-images/${seriesId}/${imageFilename}`,
          token_available: !!item.map_token,
          stored_at: new Date().toISOString()
        };
      });

      // Create series metadata
      const seriesMetadata = {
        series_id: seriesId,
        field_id: fieldId,
        start_date: timeSeriesData.start_date,
        end_date: timeSeriesData.end_date,
        interval_type: timeSeriesData.interval_type,
        total_data_points: timeSeriesData.total_data_points,
        total_images: enhancedTimeSeries.length,
        storage_path: seriesDir,
        created_at: new Date().toISOString()
      };

      // Save series metadata
      const seriesMetadataPath = path.join(seriesDir, 'series_metadata.json');
      fs.writeFileSync(seriesMetadataPath, JSON.stringify(seriesMetadata, null, 2));

      // Update global metadata index
      this.updateMetadataIndex(seriesMetadata);

      // Return enhanced time series data
      return {
        ...timeSeriesData,
        time_series: enhancedTimeSeries,
        field_images: enhancedFieldImages,
        series_id: seriesId,
        storage_info: {
          series_id: seriesId,
          storage_path: `/time-series-images/${seriesId}`,
          total_images_stored: enhancedTimeSeries.length + enhancedFieldImages.length,
          created_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error saving time series images:', error);
      throw new Error(`Failed to save time series images: ${error.message}`);
    }
  }

  /**
   * Update metadata index
   * @param {Object} seriesMetadata - Series metadata
   */
  updateMetadataIndex(seriesMetadata) {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));

      // Add new series
      metadata.series.push(seriesMetadata);

      // Keep only last 50 series
      if (metadata.series.length > 50) {
        const toDelete = metadata.series.slice(0, metadata.series.length - 50);
        toDelete.forEach(series => {
          try {
            const seriesPath = series.storage_path;
            if (fs.existsSync(seriesPath)) {
              fs.rmSync(seriesPath, { recursive: true, force: true });
            }
          } catch (e) {
            console.warn(`Could not delete old series: ${series.series_id}`);
          }
        });
        metadata.series = metadata.series.slice(-50);
      }

      fs.writeFileSync(this.METADATA_FILE, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Failed to update metadata index:', error);
    }
  }

  /**
   * Get stored series metadata
   * @param {String} seriesId - Series identifier
   * @returns {Object} Series metadata
   */
  getSeriesMetadata(seriesId) {
    try {
      const seriesPath = path.join(this.STORAGE_DIR, seriesId, 'series_metadata.json');
      if (!fs.existsSync(seriesPath)) {
        throw new Error(`Series not found: ${seriesId}`);
      }
      return JSON.parse(fs.readFileSync(seriesPath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to get series metadata: ${error.message}`);
    }
  }

  /**
   * List all stored series
   * @param {String} fieldId - Optional field filter
   * @returns {Array} Array of series metadata
   */
  listStoredSeries(fieldId = null) {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));
      let series = metadata.series || [];

      if (fieldId) {
        series = series.filter(s => s.field_id === fieldId);
      }

      return series;
    } catch (error) {
      console.error('Failed to list stored series:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));
      const series = metadata.series || [];

      let totalImages = 0;
      let totalSize = 0;

      series.forEach(s => {
        if (fs.existsSync(s.storage_path)) {
          const files = fs.readdirSync(s.storage_path);
          totalImages += files.length;
          files.forEach(file => {
            const filePath = path.join(s.storage_path, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          });
        }
      });

      return {
        total_series: series.length,
        total_images: totalImages,
        total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
        storage_path: this.STORAGE_DIR
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Delete stored series
   * @param {String} seriesId - Series identifier
   * @returns {Object} Deletion result
   */
  deleteStoredSeries(seriesId) {
    try {
      const seriesPath = path.join(this.STORAGE_DIR, seriesId);
      if (!fs.existsSync(seriesPath)) {
        throw new Error(`Series not found: ${seriesId}`);
      }

      fs.rmSync(seriesPath, { recursive: true, force: true });

      // Update metadata index
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, 'utf8'));
      metadata.series = metadata.series.filter(s => s.series_id !== seriesId);
      fs.writeFileSync(this.METADATA_FILE, JSON.stringify(metadata, null, 2));

      return {
        success: true,
        message: `Series deleted: ${seriesId}`
      };
    } catch (error) {
      throw new Error(`Failed to delete series: ${error.message}`);
    }
  }
}

module.exports = TimeSeriesImageStorageService;

