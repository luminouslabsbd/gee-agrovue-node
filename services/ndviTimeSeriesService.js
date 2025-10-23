/**
 * NDVI Time Series Service
 * Generates historical NDVI trends for crop health analysis and yield prediction
 * Supports configurable intervals: 5, 10, 15, 30 days
 * Max date range: 2 years (prevents excessive computation)
 */

class NDVITimeSeriesService {
  constructor(ee) {
    this.ee = ee;
    this.VALID_INTERVALS = [5, 10, 15, 30];
    this.MAX_DATE_RANGE_DAYS = 730; // 2 years
    this.DEFAULT_INTERVAL = 10; // Aligns with Sentinel-2 revisit time
  }

  /**
   * Generate NDVI time series for a field
   * @param {Object} fieldBoundary - GeoJSON polygon geometry
   * @param {String} fieldId - Unique field identifier
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @param {Number} intervalDays - Interval in days (5, 10, 15, 30)
   * @returns {Promise<Object>} Time series data with statistics and trends
   */
  async generateTimeSeries(fieldBoundary, fieldId, startDate, endDate, intervalDays = this.DEFAULT_INTERVAL) {
    try {
      // Validate inputs
      this._validateDateRange(startDate, endDate);
      this._validateInterval(intervalDays);

      // Convert GeoJSON to Earth Engine geometry
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);

      // Get Sentinel-2 imagery for the date range
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

      // Generate time series data points
      const timeSeries = this._generateTimeSeriesPoints(
        ndviCollection,
        geometry,
        startDate,
        endDate,
        intervalDays
      );

      // Calculate statistics
      const statistics = this._calculateTimeSeriesStatistics(timeSeries);

      // Detect trends
      const trends = this._detectTrends(timeSeries);

      return {
        field_id: fieldId,
        start_date: startDate,
        end_date: endDate,
        interval_days: intervalDays,
        data_points: timeSeries.length,
        time_series: timeSeries,
        statistics: statistics,
        trends: trends,
        metadata: {
          data_source: 'Sentinel-2',
          spatial_resolution: '10m',
          cloud_filter: '< 30%',
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Time series generation failed: ${error.message}`);
    }
  }

  /**
   * Validate date range (max 2 years)
   */
  _validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new Error('Start date must be before end date');
    }

    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays >= this.MAX_DATE_RANGE_DAYS) {
      throw new Error(`Date range exceeds maximum of ${this.MAX_DATE_RANGE_DAYS} days (2 years)`);
    }
  }

  /**
   * Validate interval (must be 5, 10, 15, or 30 days)
   */
  _validateInterval(intervalDays) {
    if (!this.VALID_INTERVALS.includes(intervalDays)) {
      throw new Error(`Invalid interval. Must be one of: ${this.VALID_INTERVALS.join(', ')}`);
    }
  }

  /**
   * Convert GeoJSON polygon to Earth Engine geometry
   */
  _geoJsonToEEGeometry(geoJson) {
    if (geoJson.type === 'Polygon') {
      const coords = geoJson.coordinates[0];
      return this.ee.Geometry.Polygon(coords);
    }
    throw new Error('Only Polygon geometries are supported');
  }

  /**
   * Generate time series data points at specified intervals
   */
  _generateTimeSeriesPoints(ndviCollection, geometry, startDate, endDate, intervalDays) {
    const timeSeries = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let currentDate = new Date(start);

    while (currentDate <= end) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + intervalDays);

      const dateStr = currentDate.toISOString().split('T')[0];
      const nextDateStr = nextDate.toISOString().split('T')[0];

      // Filter images for this interval
      const intervalCollection = ndviCollection
        .filterDate(dateStr, nextDateStr)
        .sort('system:time_start', false);

      const size = intervalCollection.size().getInfo();

      if (size > 0) {
        // Get the most recent image in this interval
        const image = intervalCollection.first();
        const ndviImage = image.select('NDVI');

        // Calculate statistics for this interval
        const stats = ndviImage.reduceRegion({
          reducer: this.ee.Reducer.mean()
            .combine(this.ee.Reducer.stdDev(), '', true)
            .combine(this.ee.Reducer.min(), '', true)
            .combine(this.ee.Reducer.max(), '', true),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9
        }).getInfo();

        const ndviStats = this._extractNDVIStats(stats);
        const cloudCover = image.get('CLOUDY_PIXEL_PERCENTAGE').getInfo();
        const acquisitionDate = new Date(image.get('system:time_start').getInfo())
          .toISOString().split('T')[0];

        timeSeries.push({
          date: acquisitionDate,
          ndvi_mean: ndviStats.mean,
          ndvi_std: ndviStats.std,
          ndvi_min: ndviStats.min,
          ndvi_max: ndviStats.max,
          cloud_cover: cloudCover,
          data_quality: this._assessDataQuality(cloudCover, ndviStats.std)
        });
      }

      currentDate = nextDate;
    }

    return timeSeries;
  }

  /**
   * Extract NDVI statistics from Earth Engine results
   */
  _extractNDVIStats(statsInfo) {
    const hasFlatFormat = statsInfo.NDVI_mean !== undefined;

    if (hasFlatFormat) {
      return {
        mean: parseFloat((statsInfo.NDVI_mean || 0).toFixed(2)),
        std: parseFloat((statsInfo.NDVI_stdDev || 0).toFixed(2)),
        min: parseFloat((statsInfo.NDVI_min || 0).toFixed(2)),
        max: parseFloat((statsInfo.NDVI_max || 0).toFixed(2))
      };
    } else {
      const ndviKey = Object.keys(statsInfo).find(key => key.includes('NDVI'));
      const value = statsInfo[ndviKey] || {};

      return {
        mean: parseFloat((value.mean || 0).toFixed(2)),
        std: parseFloat((value.stdDev || 0).toFixed(2)),
        min: parseFloat((value.min || 0).toFixed(2)),
        max: parseFloat((value.max || 0).toFixed(2))
      };
    }
  }

  /**
   * Assess data quality based on cloud cover and variability
   */
  _assessDataQuality(cloudCover, stdDev) {
    if (cloudCover > 30) return 'Poor';
    if (cloudCover > 15) return 'Fair';
    if (stdDev > 0.2) return 'Fair';
    return 'Good';
  }

  /**
   * Calculate time series statistics
   */
  _calculateTimeSeriesStatistics(timeSeries) {
    if (timeSeries.length === 0) {
      return null;
    }

    const ndviValues = timeSeries.map(d => d.ndvi_mean);
    const mean = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
    const variance = ndviValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ndviValues.length;
    const std = Math.sqrt(variance);

    return {
      mean_ndvi: parseFloat(mean.toFixed(2)),
      std_ndvi: parseFloat(std.toFixed(2)),
      min_ndvi: parseFloat(Math.min(...ndviValues).toFixed(2)),
      max_ndvi: parseFloat(Math.max(...ndviValues).toFixed(2)),
      data_points: timeSeries.length,
      date_range_days: timeSeries.length > 1 ? 
        Math.floor((new Date(timeSeries[timeSeries.length - 1].date) - new Date(timeSeries[0].date)) / (1000 * 60 * 60 * 24)) : 0
    };
  }

  /**
   * Detect trends in time series data
   */
  _detectTrends(timeSeries) {
    if (timeSeries.length < 2) {
      return { trend: 'insufficient_data', slope: 0, r_squared: 0 };
    }

    const n = timeSeries.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = timeSeries.map(d => d.ndvi_mean);

    // Calculate linear regression
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;

    const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R-squared
    const yPred = x.map(xi => intercept + slope * xi);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

    // Determine trend direction
    let trendDirection = 'stable';
    if (slope > 0.01) trendDirection = 'improving';
    else if (slope < -0.01) trendDirection = 'declining';

    return {
      trend: trendDirection,
      slope: parseFloat(slope.toFixed(4)),
      r_squared: parseFloat(rSquared.toFixed(3)),
      interpretation: this._interpretTrend(trendDirection, slope)
    };
  }

  /**
   * Interpret trend for user-friendly message
   */
  _interpretTrend(trendDirection, slope) {
    const slopeStr = Math.abs(slope).toFixed(4);
    
    if (trendDirection === 'improving') {
      return `Vegetation health is improving at a rate of ${slopeStr} NDVI units per interval`;
    } else if (trendDirection === 'declining') {
      return `Vegetation health is declining at a rate of ${slopeStr} NDVI units per interval`;
    } else {
      return 'Vegetation health is stable with minimal change';
    }
  }
}

module.exports = NDVITimeSeriesService;

