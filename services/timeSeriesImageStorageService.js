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

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

class TimeSeriesImageStorageService {
  constructor(ee = null) {
    this.STORAGE_DIR = path.join(__dirname, "../public/time-series-images");
    this.METADATA_FILE = path.join(this.STORAGE_DIR, "metadata.json");
    this.ee = ee;
    this.initializeStorage();
  }

  /**
   * Initialize storage directory and metadata file
   */
  initializeStorage() {
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
      console.log(
        `✅ Time series image storage directory created: ${this.STORAGE_DIR}`
      );
    }

    if (!fs.existsSync(this.METADATA_FILE)) {
      fs.writeFileSync(
        this.METADATA_FILE,
        JSON.stringify({ series: [] }, null, 2)
      );
    }
  }

  /**
   * Save time series images and return with download URLs
   * @param {Object} timeSeriesData - Time series data from NDVITwoYearTimeSeriesService
   * @param {String} fieldId - Field identifier
   * @param {Object} fieldBoundary - GeoJSON polygon for the field
   * @returns {Object} Time series data with image download URLs
   */
  async saveTimeSeriesImages(timeSeriesData, fieldId, fieldBoundary = null) {
    try {
      // Use fieldId as directory name (no timestamp)
      const seriesDir = path.join(this.STORAGE_DIR, fieldId);

      // Delete old data if directory exists
      if (fs.existsSync(seriesDir)) {
        console.log(`🗑️  Removing old data for field ${fieldId}...`);
        fs.rmSync(seriesDir, { recursive: true, force: true });
        console.log(`✅ Old data deleted for field ${fieldId}`);
      }

      // Create series directory with fieldId as name
      fs.mkdirSync(seriesDir, { recursive: true });
      console.log(`✅ Created series directory: ${seriesDir}`);

      // Process time series data and save images
      const enhancedTimeSeries = [];

      for (let index = 0; index < timeSeriesData.time_series.length; index++) {
        const item = timeSeriesData.time_series[index];
        const pngFilename = `ndvi_${fieldId}_${item.date}_${index}.png`;
        const pngPath = path.join(seriesDir, pngFilename);

        // Download and save actual NDVI image from Earth Engine
        if (item.thumb_url) {
          try {
            await this.downloadImage(item.thumb_url, pngPath);
            console.log(`✅ Downloaded NDVI image for ${item.date}`);
          } catch (error) {
            console.error(
              `❌ Failed to download image for ${item.date}:`,
              error.message
            );
          }
        }

        // Return enhanced item with image URL (using fieldId as folder name)
        enhancedTimeSeries.push({
          date: item.date,
          mean_ndvi: item.mean_ndvi,
          std_ndvi: item.std_ndvi,
          min_ndvi: item.min_ndvi,
          max_ndvi: item.max_ndvi,
          suitability_status: item.suitability_status,
          suitability_percentage: item.suitability_percentage,
          confidence_level: item.confidence_level,
          image_url: `/time-series-images/${fieldId}/${pngFilename}`,
          image_available: item.image_available,
          stored_at: new Date().toISOString(),
        });
      }

      // Create series metadata
      const seriesMetadata = {
        field_id: fieldId,
        start_date: timeSeriesData.start_date,
        end_date: timeSeriesData.end_date,
        interval_type: timeSeriesData.interval_type,
        total_data_points: timeSeriesData.total_data_points,
        total_images: enhancedTimeSeries.length,
        storage_path: seriesDir,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save series metadata
      const seriesMetadataPath = path.join(seriesDir, "series_metadata.json");
      fs.writeFileSync(
        seriesMetadataPath,
        JSON.stringify(seriesMetadata, null, 2)
      );

      // Update global metadata index
      this.updateMetadataIndex(seriesMetadata);

      // Return enhanced time series data
      return {
        field_id: timeSeriesData.field_id,
        start_date: timeSeriesData.start_date,
        end_date: timeSeriesData.end_date,
        interval_type: timeSeriesData.interval_type,
        total_data_points: timeSeriesData.total_data_points,
        time_series: enhancedTimeSeries,
        trends: timeSeriesData.trends,
        statistics: timeSeriesData.statistics,
        metadata: timeSeriesData.metadata,
        storage_info: {
          field_id: fieldId,
          storage_path: `/time-series-images/${fieldId}`,
          total_images_stored: enhancedTimeSeries.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error saving time series images:", error);
      throw new Error(`Failed to save time series images: ${error.message}`);
    }
  }

  /**
   * Delete old series for a specific field (keep only latest)
   * @param {String} fieldId - Field identifier
   */
  async deleteOldSeriesForField(fieldId) {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, "utf8"));
      const fieldSeriesIndex = metadata.series.findIndex(
        (s) => s.field_id === fieldId
      );

      if (fieldSeriesIndex !== -1) {
        const oldSeries = metadata.series[fieldSeriesIndex];
        console.log(`🗑️  Found old series for field ${fieldId}. Updating...`);

        try {
          const seriesPath = oldSeries.storage_path;
          if (fs.existsSync(seriesPath)) {
            fs.rmSync(seriesPath, { recursive: true, force: true });
            console.log(`✅ Deleted old data for field ${fieldId}`);
          }
        } catch (e) {
          console.warn(
            `⚠️  Could not delete old data for field ${fieldId}`,
            e.message
          );
        }

        // Remove from metadata
        metadata.series.splice(fieldSeriesIndex, 1);
        fs.writeFileSync(this.METADATA_FILE, JSON.stringify(metadata, null, 2));
        console.log(`✅ Updated metadata for field ${fieldId}`);
      }
    } catch (error) {
      console.warn(
        `⚠️  Failed to delete old series for field ${fieldId}:`,
        error.message
      );
    }
  }

  /**
   * Update metadata index
   * @param {Object} seriesMetadata - Series metadata
   */
  updateMetadataIndex(seriesMetadata) {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, "utf8"));

      // Check if field already exists in metadata
      const existingIndex = metadata.series.findIndex(
        (s) => s.field_id === seriesMetadata.field_id
      );

      if (existingIndex !== -1) {
        // Update existing field metadata
        metadata.series[existingIndex] = seriesMetadata;
        console.log(`✅ Updated metadata for field ${seriesMetadata.field_id}`);
      } else {
        // Add new field metadata
        metadata.series.push(seriesMetadata);
        console.log(`✅ Added metadata for field ${seriesMetadata.field_id}`);
      }

      fs.writeFileSync(this.METADATA_FILE, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error("Failed to update metadata index:", error);
    }
  }

  /**
   * Get stored series metadata by fieldId
   * @param {String} fieldId - Field identifier
   * @returns {Object} Series metadata
   */
  getSeriesMetadata(fieldId) {
    try {
      const seriesPath = path.join(
        this.STORAGE_DIR,
        fieldId,
        "series_metadata.json"
      );
      if (!fs.existsSync(seriesPath)) {
        throw new Error(`Series not found for field: ${fieldId}`);
      }
      return JSON.parse(fs.readFileSync(seriesPath, "utf8"));
    } catch (error) {
      throw new Error(`Failed to get series metadata: ${error.message}`);
    }
  }

  /**
   * Download image from URL and save to file
   * @param {String} url - Image URL
   * @param {String} filepath - Path to save the image
   * @returns {Promise} Promise that resolves when download is complete
   */
  downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith("https") ? https : http;

      protocol
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(`Failed to download image: ${response.statusCode}`)
            );
            return;
          }

          const fileStream = fs.createWriteStream(filepath);
          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close();
            resolve();
          });

          fileStream.on("error", (err) => {
            fs.unlink(filepath, () => {}); // Delete the file if error
            reject(err);
          });
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  }

  /**
   * Create NDVI visualization as PNG
   * @param {String} pngPath - Path to save PNG file
   * @param {Number} ndviValue - NDVI value
   * @param {String} suitabilityStatus - Suitability status
   */
  createNDVIVisualization(pngPath, ndviValue, suitabilityStatus) {
    try {
      // Create visualization data
      const visualizationData = {
        type: "ndvi_visualization",
        ndvi_value: ndviValue,
        suitability_status: suitabilityStatus,
        color: this.getNDVIColor(ndviValue),
        created_at: new Date().toISOString(),
        note: "NDVI visualization data. For actual PNG images, integrate with canvas or sharp library.",
      };

      // Save visualization data as JSON
      const vizJsonPath = pngPath.replace(".png", "_viz.json");
      fs.writeFileSync(vizJsonPath, JSON.stringify(visualizationData, null, 2));

      // Create a simple text file as image placeholder
      const txtPath = pngPath.replace(".png", ".txt");
      const placeholderContent = `NDVI Visualization
Value: ${ndviValue.toFixed(4)}
Status: ${suitabilityStatus}
Color: ${this.getNDVIColor(ndviValue)}
Generated: ${new Date().toISOString()}`;
      fs.writeFileSync(txtPath, placeholderContent);

      console.log(
        `📊 Created visualization for NDVI: ${ndviValue.toFixed(
          4
        )} (${suitabilityStatus})`
      );
    } catch (error) {
      console.error("Error creating NDVI visualization:", error);
    }
  }

  /**
   * Get NDVI color based on value
   * @param {Number} ndviValue - NDVI value
   * @returns {String} Hex color code
   */
  getNDVIColor(ndviValue) {
    if (ndviValue < 0) return "#d73027"; // Red - Poor
    if (ndviValue < 0.2) return "#fc8d59"; // Orange - Sparse
    if (ndviValue < 0.4) return "#fee090"; // Yellow - Bare
    if (ndviValue < 0.6) return "#e0f3f8"; // Light Blue - Moderate
    if (ndviValue < 0.8) return "#91bfdb"; // Blue - Good
    return "#4575b4"; // Dark Blue - Excellent
  }

  /**
   * List all stored series
   * @param {String} fieldId - Optional field filter
   * @returns {Array} Array of series metadata
   */
  listStoredSeries(fieldId = null) {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, "utf8"));
      let series = metadata.series || [];

      if (fieldId) {
        series = series.filter((s) => s.field_id === fieldId);
      }

      return series;
    } catch (error) {
      console.error("Failed to list stored series:", error);
      return [];
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    try {
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, "utf8"));
      const series = metadata.series || [];

      let totalImages = 0;
      let totalSize = 0;

      series.forEach((s) => {
        if (fs.existsSync(s.storage_path)) {
          const files = fs.readdirSync(s.storage_path);
          totalImages += files.length;
          files.forEach((file) => {
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
        storage_path: this.STORAGE_DIR,
      };
    } catch (error) {
      console.error("Failed to get storage stats:", error);
      return { error: error.message };
    }
  }

  /**
   * Delete stored series by fieldId
   * @param {String} fieldId - Field identifier
   * @returns {Object} Deletion result
   */
  deleteStoredSeries(fieldId) {
    try {
      const seriesPath = path.join(this.STORAGE_DIR, fieldId);
      if (!fs.existsSync(seriesPath)) {
        throw new Error(`Series not found for field: ${fieldId}`);
      }

      fs.rmSync(seriesPath, { recursive: true, force: true });

      // Update metadata index
      const metadata = JSON.parse(fs.readFileSync(this.METADATA_FILE, "utf8"));
      metadata.series = metadata.series.filter((s) => s.field_id !== fieldId);
      fs.writeFileSync(this.METADATA_FILE, JSON.stringify(metadata, null, 2));

      return {
        success: true,
        message: `Series deleted for field: ${fieldId}`,
      };
    } catch (error) {
      throw new Error(`Failed to delete series: ${error.message}`);
    }
  }
}

module.exports = TimeSeriesImageStorageService;
