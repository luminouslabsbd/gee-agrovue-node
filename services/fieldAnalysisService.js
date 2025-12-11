/**
 * Field Analysis Service
 * Handles NDVI analysis, statistics calculation, and crop health interpretation
 * for farm field boundaries using Google Earth Engine
 */

class FieldAnalysisService {
  constructor(ee) {
    this.ee = ee;
  }

  /**
   * Analyze NDVI data for a given field boundary (GeoJSON polygon)
   * @param {Object} fieldBoundary - GeoJSON polygon geometry
   * @param {String} fieldId - Unique field identifier
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Analysis results with NDVI statistics and health interpretation
   */
  async analyzeFieldNDVI(fieldBoundary, fieldId, startDate, endDate) {
    try {
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

      // Calculate NDVI: (NIR - RED) / (NIR + RED)
      // Sentinel-2: B8 = NIR, B4 = RED
      const ndviCollection = collection.map(image => {
        const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
        return image.addBands(ndvi);
      });

      // Get the most recent image
      const latestImage = ndviCollection.sort('system:time_start', false).first();
      const ndviImage = latestImage.select('NDVI');

      // Calculate statistics
      const stats = ndviImage.reduceRegion({
        reducer: this.ee.Reducer.mean()
          .combine(this.ee.Reducer.stdDev(), '', true)
          .combine(this.ee.Reducer.min(), '', true)
          .combine(this.ee.Reducer.max(), '', true)
          .combine(this.ee.Reducer.median(), '', true)
          .combine(this.ee.Reducer.percentile([25, 75]), '', true),
        geometry: geometry,
        scale: 10,
        maxPixels: 1e9
      });

      const statsInfo = stats.getInfo();
      const ndviStats = this._extractNDVIStats(statsInfo);

      // Get cloud cover percentage
      const cloudCover = latestImage.get('CLOUDY_PIXEL_PERCENTAGE').getInfo();

      // Get pixel count
      const pixelCount = ndviImage.reduceRegion({
        reducer: this.ee.Reducer.count(),
        geometry: geometry,
        scale: 10,
        maxPixels: 1e9
      }).getInfo();

      // Get acquisition date
      const acquisitionDate = new Date(latestImage.get('system:time_start').getInfo())
        .toISOString().split('T')[0];

      // Interpret health status
      const healthInterpretation = this._interpretHealth(ndviStats.mean);

      return {
        field_id: fieldId,
        date: new Date().toISOString().split('T')[0],
        ndvi: ndviStats,
        quality: {
          cloud_cover: cloudCover,
          pixel_count: pixelCount.NDVI || 0,
          data_source: 'Sentinel-2',
          acquisition_date: acquisitionDate,
          confidence: this._calculateConfidence(cloudCover, pixelCount.NDVI)
        },
        interpretation: healthInterpretation,
        hectares: this._calculateHectares(geometry)
      };
    } catch (error) {
      throw new Error(`Field analysis failed: ${error.message}`);
    }
  }

  /**
   * Convert GeoJSON polygon to Earth Engine geometry
   */
  _geoJsonToEEGeometry(geoJson) {
    if (geoJson.type === 'Polygon') {
      const coords = geoJson.coordinates[0]; // Outer ring
      return this.ee.Geometry.Polygon(coords);
    }
    throw new Error('Only Polygon geometries are supported');
  }

  /**
   * Extract NDVI statistics from Earth Engine results
   */
  _extractNDVIStats(statsInfo) {
    // Handle both flat format (NDVI_mean, NDVI_stdDev, etc.) and nested format
    const hasFlatFormat = statsInfo.NDVI_mean !== undefined;

    if (hasFlatFormat) {
      // Flat format from Earth Engine
      return {
        mean: parseFloat((statsInfo.NDVI_mean || 0).toFixed(2)),
        std: parseFloat((statsInfo.NDVI_stdDev || 0).toFixed(2)),
        min: parseFloat((statsInfo.NDVI_min || 0).toFixed(2)),
        max: parseFloat((statsInfo.NDVI_max || 0).toFixed(2)),
        median: parseFloat((statsInfo.NDVI_median || 0).toFixed(2)),
        p25: parseFloat((statsInfo.NDVI_p25 || 0).toFixed(2)),
        p75: parseFloat((statsInfo.NDVI_p75 || 0).toFixed(2))
      };
    } else {
      // Nested format
      const ndviKey = Object.keys(statsInfo).find(key => key.includes('NDVI'));
      const value = statsInfo[ndviKey] || {};

      return {
        mean: parseFloat((value.mean || 0).toFixed(2)),
        std: parseFloat((value.stdDev || 0).toFixed(2)),
        min: parseFloat((value.min || 0).toFixed(2)),
        max: parseFloat((value.max || 0).toFixed(2)),
        median: parseFloat((value.median || 0).toFixed(2)),
        p25: parseFloat((value.p25 || 0).toFixed(2)),
        p75: parseFloat((value.p75 || 0).toFixed(2))
      };
    }
  }

  /**
   * Interpret crop health based on NDVI value
   */
  _interpretHealth(ndviMean) {
    let healthStatus = 'Unknown';
    let healthScore = 0;
    const alerts = [];

    if (ndviMean < 0.3) {
      healthStatus = 'Poor';
      healthScore = 20;
      alerts.push('Very low vegetation index - possible crop stress or bare soil');
    } else if (ndviMean < 0.4) {
      healthStatus = 'Fair';
      healthScore = 40;
      alerts.push('Low vegetation index - monitor for potential issues');
    } else if (ndviMean < 0.5) {
      healthStatus = 'Good';
      healthScore = 60;
      alerts.push('Moderate vegetation index - normal growth');
    } else if (ndviMean < 0.7) {
      healthStatus = 'Healthy';
      healthScore = 85;
    } else {
      healthStatus = 'Very Healthy';
      healthScore = 95;
    }

    return {
      health_status: healthStatus,
      health_score: healthScore,
      alerts: alerts
    };
  }

  /**
   * Calculate confidence score based on cloud cover and pixel count
   */
  _calculateConfidence(cloudCover, pixelCount) {
    let confidence = 1.0;
    
    // Reduce confidence based on cloud cover
    confidence -= (cloudCover / 100) * 0.3;
    
    // Reduce confidence if pixel count is low
    if (pixelCount < 100) {
      confidence -= 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate field area in hectares
   */
  _calculateHectares(geometry) {
    try {
      const area = geometry.area({ maxError: 30 }).getInfo();
      // Convert square meters to hectares (1 hectare = 10,000 m²)
      return parseFloat((area / 10000).toFixed(2));
    } catch (error) {
      console.warn('Could not calculate area:', error);
      return 0;
    }
  }
}

module.exports = FieldAnalysisService;

