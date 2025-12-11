/**
 * NDVI 2-Year Time Series Service
 * Generates 2-year NDVI time series data with field images
 *
 * Features:
 * - 2-year historical NDVI data
 * - Monthly and weekly intervals
 * - Field image generation with proper NDVI color visualization
 * - Statistics and trends
 * - Data export capabilities
 * - Cloud masking for cleaner data
 */

const NDVIColorVisualizationService = require('./ndviColorVisualizationService');

class NDVITwoYearTimeSeriesService {
  constructor(ee) {
    this.ee = ee;
    this.SENTINEL2_DATASET = 'COPERNICUS/S2_SR';
    this.CLOUD_FILTER = 30;

    // Initialize color visualization service
    this.colorVisualizationService = new NDVIColorVisualizationService(ee);

    // NDVI Visualization Parameters
    this.NDVI_VIS_PARAMS = {
      min: -1,
      max: 1,
      palette: ['#d73027', '#fc8d59', '#fee090', '#e0f3f8', '#91bfdb', '#4575b4']
    };

    // Field Visualization Parameters
    this.FIELD_VIS_PARAMS = {
      min: -1,
      max: 1,
      palette: ['#d73027', '#fc8d59', '#fee090', '#e0f3f8', '#91bfdb', '#4575b4']
    };
  }

  /**
   * Generate 2-year NDVI time series data
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} intervalType - 'monthly' or 'weekly'
   * @returns {Object} Time series data with statistics
   */
  async generateTwoYearTimeSeries(fieldBoundary, fieldId, intervalType = 'monthly') {
    try {
      // Validate boundary
      if (!fieldBoundary || fieldBoundary.type !== 'Polygon') {
        throw new Error('Invalid boundary: must be a GeoJSON Polygon');
      }

      // Calculate date range (2 years back from today)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);

      const startDateStr = this.formatDate(startDate);
      const endDateStr = this.formatDate(endDate);

      // Generate date intervals
      const dates = this.generateDateIntervals(startDateStr, endDateStr, intervalType);

      // Convert field boundary to GeoJSON
      const geometry = this.ee.Geometry.Polygon(fieldBoundary.coordinates[0]);

      // Fetch NDVI data for each date
      const timeSeriesData = [];

      for (const date of dates) {
        const nextDate = this.addDays(date, intervalType === 'monthly' ? 30 : 7);

        // Get Sentinel-2 image collection with cloud filtering
        const imageCollection = this.ee.ImageCollection(this.SENTINEL2_DATASET)
          .filterBounds(geometry)
          .filterDate(date, nextDate)
          .filter(this.ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', this.CLOUD_FILTER))
          .map(img => this.maskClouds(img));  // Apply cloud masking

        if (imageCollection.size().getInfo() > 0) {
          // Calculate NDVI with cloud masking
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

          const meanNdvi = stats.NDVI_mean || 0;

          // Calculate suitability metrics
          const suitability = this.calculateSuitability(meanNdvi);

          // Get thumbnail URL for the NDVI image with proper visualization
          // IMPORTANT: Clip the NDVI image to the field boundary before generating thumbnail
          const clippedNdvi = ndvi.clip(geometry);

          // Use color visualization service for proper NDVI color mapping
          // This ensures exact color mapping for each NDVI range
          const thumbUrl = this.colorVisualizationService.getColorMappedThumbURL(
            clippedNdvi,
            geometry,
            512
          );

          timeSeriesData.push({
            date: date,
            mean_ndvi: meanNdvi,
            std_ndvi: stats.NDVI_stdDev || 0,
            min_ndvi: stats.NDVI_min || 0,
            max_ndvi: stats.NDVI_max || 0,
            suitability_status: suitability.status,
            suitability_percentage: suitability.percentage,
            confidence_level: suitability.confidence,
            image_available: true,
            thumb_url: thumbUrl,  // Add thumbnail URL for downloading
            geometry: fieldBoundary,  // Add geometry for image generation
            ndvi_scale: {
              poor: { range: '-1 to 0', color: '#d73027' },
              sparse: { range: '0 to 0.2', color: '#fc8d59' },
              bare: { range: '0.2 to 0.4', color: '#fee090' },
              moderate: { range: '0.4 to 0.6', color: '#e0f3f8' },
              good: { range: '0.6 to 0.8', color: '#91bfdb' },
              excellent: { range: '0.8 to 1', color: '#4575b4' }
            }
          });
        }
      }

      // Calculate trends
      const trends = this.calculateTrends(timeSeriesData);

      return {
        field_id: fieldId,
        field_boundary: fieldBoundary,  // Include field boundary for image generation
        start_date: startDateStr,
        end_date: endDateStr,
        interval_type: intervalType,
        total_data_points: timeSeriesData.length,
        time_series: timeSeriesData,
        trends: trends,
        statistics: {
          overall_mean_ndvi: this.calculateMean(timeSeriesData.map(d => d.mean_ndvi)),
          overall_std_ndvi: this.calculateStdDev(timeSeriesData.map(d => d.mean_ndvi)),
          min_ndvi: Math.min(...timeSeriesData.map(d => d.min_ndvi)),
          max_ndvi: Math.max(...timeSeriesData.map(d => d.max_ndvi))
        },
        metadata: {
          data_source: 'Sentinel-2',
          spatial_resolution: '10m',
          cloud_filter: `< ${this.CLOUD_FILTER}%`,
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate 2-year time series: ${error.message}`);
    }
  }

  /**
   * Generate NDVI field image for specific date
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} date - Date string (YYYY-MM-DD)
   * @returns {Object} Field image with map URL and statistics
   */
  async generateFieldImage(fieldBoundary, fieldId, date) {
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

      if (imageCollection.size().getInfo() === 0) {
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

      // Get map ID for visualization
      const mapId = ndvi.getMapId(this.FIELD_VIS_PARAMS);

      return {
        field_id: fieldId,
        date: date,
        map_id: mapId.mapid,
        map_token: mapId.token,
        map_url: `https://earthengine.googleapis.com/map/${mapId.mapid}/{z}/{x}/{y}?token=${mapId.token}`,
        statistics: {
          mean_ndvi: stats.NDVI_mean || 0,
          std_ndvi: stats.NDVI_stdDev || 0,
          min_ndvi: stats.NDVI_min || 0,
          max_ndvi: stats.NDVI_max || 0
        },
        visualization: {
          palette: this.FIELD_VIS_PARAMS.palette,
          min: this.FIELD_VIS_PARAMS.min,
          max: this.FIELD_VIS_PARAMS.max
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate field image: ${error.message}`);
    }
  }

  /**
   * Generate date intervals
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @param {String} intervalType - 'monthly' or 'weekly'
   * @returns {Array} Array of date strings
   */
  generateDateIntervals(startDate, endDate, intervalType) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(this.formatDate(currentDate));
      
      if (intervalType === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }

    return dates;
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
    return this.formatDate(date);
  }

  /**
   * Format date to YYYY-MM-DD
   * @param {Date} date - Date object
   * @returns {String} Formatted date string
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculate trends
   * @param {Array} timeSeriesData - Time series data array
   * @returns {Object} Trend analysis
   */
  calculateTrends(timeSeriesData) {
    if (timeSeriesData.length < 2) {
      return { trend: 'insufficient_data', change_percentage: 0 };
    }

    const firstValue = timeSeriesData[0].mean_ndvi;
    const lastValue = timeSeriesData[timeSeriesData.length - 1].mean_ndvi;
    const changePercentage = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;

    let trend = 'stable';
    if (changePercentage > 5) trend = 'improving';
    if (changePercentage < -5) trend = 'declining';

    return {
      trend: trend,
      change_percentage: changePercentage.toFixed(2),
      first_value: firstValue.toFixed(4),
      last_value: lastValue.toFixed(4)
    };
  }

  /**
   * Calculate mean
   * @param {Array} values - Array of numbers
   * @returns {Number} Mean value
   */
  calculateMean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   * @param {Array} values - Array of numbers
   * @returns {Number} Standard deviation
   */
  calculateStdDev(values) {
    const mean = this.calculateMean(values);
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(this.calculateMean(squareDiffs));
  }

  /**
   * Mask clouds and cloud shadows in Sentinel-2 image
   * Uses SCL (Scene Classification Layer) band for Sentinel-2 Level 2A
   * @param {ee.Image} image - Sentinel-2 image
   * @returns {ee.Image} Cloud-masked image
   */
  maskClouds(image) {
    try {
      // For Sentinel-2 Level 2A, use SCL (Scene Classification Layer) band
      // SCL values: 0=No Data, 1=Saturated/Defective, 2=Dark Area Pixels, 3=Cloud Shadows,
      //             4=Vegetation, 5=Not Vegetated, 6=Water, 7=Unclassified, 8=Cloud Medium,
      //             9=Cloud High, 10=Thin Cirrus, 11=Snow/Ice

      const scl = image.select('SCL');

      // Create mask for valid pixels (exclude clouds, shadows, and snow)
      // Keep only: vegetation (4), not vegetated (5), water (6), unclassified (7)
      const mask = scl.eq(4)
        .or(scl.eq(5))
        .or(scl.eq(6))
        .or(scl.eq(7));

      // Apply the mask to all bands
      return image.updateMask(mask);
    } catch (error) {
      console.warn('Cloud masking error:', error);
      return image;  // Return original image if masking fails
    }
  }

  /**
   * Calculate suitability metrics based on NDVI value
   * @param {Number} ndviValue - NDVI value (-1 to 1)
   * @returns {Object} Suitability status, percentage, and confidence
   */
  calculateSuitability(ndviValue) {
    let status = 'Poor';
    let percentage = 0;
    let confidence = 'Low';

    if (ndviValue < 0) {
      status = 'Poor';
      percentage = 0;
      confidence = 'High';
    } else if (ndviValue < 0.2) {
      status = 'Sparse';
      percentage = Math.round(ndviValue * 100 / 0.2);
      confidence = 'High';
    } else if (ndviValue < 0.4) {
      status = 'Bare';
      percentage = Math.round((ndviValue - 0.2) * 100 / 0.2 + 20);
      confidence = 'High';
    } else if (ndviValue < 0.6) {
      status = 'Moderate';
      percentage = Math.round((ndviValue - 0.4) * 100 / 0.2 + 40);
      confidence = 'Very High';
    } else if (ndviValue < 0.8) {
      status = 'Good';
      percentage = Math.round((ndviValue - 0.6) * 100 / 0.2 + 60);
      confidence = 'Very High';
    } else {
      status = 'Excellent';
      percentage = Math.round((ndviValue - 0.8) * 100 / 0.2 + 80);
      confidence = 'Very High';
    }

    return {
      status,
      percentage: Math.min(100, Math.max(0, percentage)),
      confidence
    };
  }
}

module.exports = NDVITwoYearTimeSeriesService;

