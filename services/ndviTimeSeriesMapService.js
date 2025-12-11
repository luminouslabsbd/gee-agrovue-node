/**
 * NDVI Time Series Map Service
 * Generates NDVI maps and visualizations for time series data
 * Provides map tiles, images, and visualization links
 */

class NDVITimeSeriesMapService {
  constructor(ee) {
    this.ee = ee;
    this.VALID_INTERVALS = [5, 10, 15, 30];
    this.MAX_DATE_RANGE_DAYS = 730;
    this.DEFAULT_INTERVAL = 10;
    
    // Visualization parameters for NDVI
    this.NDVI_VIS_PARAMS = {
      min: -1,
      max: 1,
      palette: [
        '#d73027', // Red - Poor vegetation
        '#fc8d59', // Orange
        '#fee090', // Yellow
        '#e0f3f8', // Light blue
        '#91bfdb', // Blue
        '#4575b4'  // Dark blue - Good vegetation
      ]
    };
    
    // Alternative palette - Green scale
    this.NDVI_GREEN_PALETTE = {
      min: 0,
      max: 1,
      palette: [
        '#a50026', // Dark red
        '#d73027', // Red
        '#f46d43', // Orange
        '#fdae61', // Light orange
        '#fee090', // Yellow
        '#e0f3f8', // Light cyan
        '#abd9e9', // Cyan
        '#74add1', // Light blue
        '#4575b4', // Blue
        '#313695'  // Dark blue
      ]
    };
  }

  /**
   * Generate NDVI map for a specific date
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} date - Date (YYYY-MM-DD)
   * @returns {Promise<Object>} Map data with visualization URL
   */
  async generateNDVIMapForDate(fieldBoundary, fieldId, date) {
    try {
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      
      // Get Sentinel-2 image for the date
      const collection = this.ee.ImageCollection('COPERNICUS/S2_SR')
        .filterBounds(geometry)
        .filterDate(date, this._addDays(date, 1))
        .filter(this.ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
        .sort('CLOUDY_PIXEL_PERCENTAGE');

      const size = collection.size().getInfo();
      if (size === 0) {
        throw new Error(`No Sentinel-2 imagery available for ${date}`);
      }

      // Get the least cloudy image
      const image = collection.first();
      
      // Calculate NDVI
      const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
      
      // Get map ID for visualization
      const mapId = ndvi.getMapId(this.NDVI_VIS_PARAMS);
      
      // Get statistics
      const stats = ndvi.reduceRegion({
        reducer: this.ee.Reducer.mean()
          .combine(this.ee.Reducer.stdDev(), '', true)
          .combine(this.ee.Reducer.min(), '', true)
          .combine(this.ee.Reducer.max(), '', true),
        geometry: geometry,
        scale: 10
      }).getInfo();

      return {
        field_id: fieldId,
        date: date,
        map_id: mapId.mapid,
        map_token: mapId.token,
        map_url: `https://earthengine.googleapis.com/map/${mapId.mapid}/{z}/{x}/{y}?token=${mapId.token}`,
        statistics: {
          mean_ndvi: parseFloat((stats.NDVI || 0).toFixed(3)),
          std_ndvi: parseFloat((stats.NDVI_stdDev || 0).toFixed(3)),
          min_ndvi: parseFloat((stats.NDVI_min || 0).toFixed(3)),
          max_ndvi: parseFloat((stats.NDVI_max || 0).toFixed(3))
        },
        visualization: {
          palette: this.NDVI_VIS_PARAMS.palette,
          min: this.NDVI_VIS_PARAMS.min,
          max: this.NDVI_VIS_PARAMS.max
        }
      };
    } catch (error) {
      throw new Error(`Map generation failed for ${date}: ${error.message}`);
    }
  }

  /**
   * Generate time series maps for multiple dates
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} startDate - Start date
   * @param {String} endDate - End date
   * @param {Number} intervalDays - Interval in days
   * @returns {Promise<Object>} Time series maps with statistics
   */
  async generateTimeSeriesMaps(fieldBoundary, fieldId, startDate, endDate, intervalDays = 10) {
    try {
      this._validateDateRange(startDate, endDate);
      this._validateInterval(intervalDays);

      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      
      // Get all Sentinel-2 images
      const collection = this.ee.ImageCollection('COPERNICUS/S2_SR')
        .filterBounds(geometry)
        .filterDate(startDate, endDate)
        .filter(this.ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30));

      if (collection.size().getInfo() === 0) {
        throw new Error('No Sentinel-2 imagery available for the specified date range');
      }

      // Calculate NDVI for all images
      const ndviCollection = collection.map(image => {
        const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
        return image.addBands(ndvi);
      });

      // Generate time series points
      const dates = this._generateDateRange(startDate, endDate, intervalDays);
      const maps = [];

      for (const date of dates) {
        try {
          const mapData = await this.generateNDVIMapForDate(fieldBoundary, fieldId, date);
          maps.push(mapData);
        } catch (error) {
          console.warn(`Skipping ${date}: ${error.message}`);
        }
      }

      if (maps.length === 0) {
        throw new Error('No maps could be generated for the date range');
      }

      return {
        field_id: fieldId,
        start_date: startDate,
        end_date: endDate,
        interval_days: intervalDays,
        total_maps: maps.length,
        maps: maps,
        metadata: {
          data_source: 'Sentinel-2',
          spatial_resolution: '10m',
          cloud_filter: '< 30%',
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Time series maps generation failed: ${error.message}`);
    }
  }

  /**
   * Convert GeoJSON to Earth Engine geometry
   */
  _geoJsonToEEGeometry(geoJson) {
    if (geoJson.type === 'Polygon') {
      return this.ee.Geometry.Polygon(geoJson.coordinates);
    } else if (geoJson.type === 'Point') {
      return this.ee.Geometry.Point(geoJson.coordinates);
    }
    throw new Error('Unsupported geometry type');
  }

  /**
   * Validate date range
   */
  _validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    if (diffDays > this.MAX_DATE_RANGE_DAYS) {
      throw new Error(`Date range exceeds maximum of ${this.MAX_DATE_RANGE_DAYS} days`);
    }
    if (diffDays < 0) {
      throw new Error('Start date must be before end date');
    }
  }

  /**
   * Validate interval
   */
  _validateInterval(intervalDays) {
    if (!this.VALID_INTERVALS.includes(intervalDays)) {
      throw new Error(`Invalid interval. Must be one of: ${this.VALID_INTERVALS.join(', ')}`);
    }
  }

  /**
   * Generate date range
   */
  _generateDateRange(startDate, endDate, intervalDays) {
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current = new Date(current.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    }

    return dates;
  }

  /**
   * Add days to a date
   */
  _addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

module.exports = NDVITimeSeriesMapService;

