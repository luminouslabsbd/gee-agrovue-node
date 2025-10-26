/**
 * NDVI 2-Year Time Series Service
 * Generates 2-year NDVI time series data with field images
 * 
 * Features:
 * - 2-year historical NDVI data
 * - Monthly and weekly intervals
 * - Field image generation
 * - Statistics and trends
 * - Data export capabilities
 */

class NDVITwoYearTimeSeriesService {
  constructor(ee) {
    this.ee = ee;
    this.SENTINEL2_DATASET = 'COPERNICUS/S2_SR';
    this.CLOUD_FILTER = 30;
    
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
      const fieldImages = [];

      for (const date of dates) {
        const nextDate = this.addDays(date, intervalType === 'monthly' ? 30 : 7);
        
        // Get Sentinel-2 image collection
        const imageCollection = this.ee.ImageCollection(this.SENTINEL2_DATASET)
          .filterBounds(geometry)
          .filterDate(date, nextDate)
          .filter(this.ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', this.CLOUD_FILTER));

        if (imageCollection.size().getInfo() > 0) {
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
          const mapId = ndvi.getMapId(this.NDVI_VIS_PARAMS);

          timeSeriesData.push({
            date: date,
            mean_ndvi: stats.NDVI_mean || 0,
            std_ndvi: stats.NDVI_stdDev || 0,
            min_ndvi: stats.NDVI_min || 0,
            max_ndvi: stats.NDVI_max || 0,
            map_id: mapId.mapid,
            map_token: mapId.token,
            map_url: `https://earthengine.googleapis.com/map/${mapId.mapid}/{z}/{x}/{y}?token=${mapId.token}`,
            image_available: true
          });

          fieldImages.push({
            date: date,
            map_id: mapId.mapid,
            map_token: mapId.token,
            map_url: `https://earthengine.googleapis.com/map/${mapId.mapid}/{z}/{x}/{y}?token=${mapId.token}`
          });
        }
      }

      // Calculate trends
      const trends = this.calculateTrends(timeSeriesData);

      return {
        field_id: fieldId,
        start_date: startDateStr,
        end_date: endDateStr,
        interval_type: intervalType,
        total_data_points: timeSeriesData.length,
        time_series: timeSeriesData,
        field_images: fieldImages,
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
}

module.exports = NDVITwoYearTimeSeriesService;

