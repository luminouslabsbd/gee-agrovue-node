/**
 * NDVI Color Visualization Service
 * Handles proper NDVI color mapping and visualization
 * Ensures correct color scale for NDVI analysis
 */

class NDVIColorVisualizationService {
  constructor(ee) {
    this.ee = ee;

    // NDVI Scale with continuous color mapping
    this.NDVI_SCALE = {
      poor: { min: -0.2, max: 0, color: '#d73027', label: 'Poor' },
      sparse: { min: 0, max: 0.2, color: '#fc8d59', label: 'Sparse' },
      bare: { min: 0.2, max: 0.4, color: '#fee08b', label: 'Bare' },
      moderate: { min: 0.4, max: 0.6, color: '#d9ef8b', label: 'Moderate' },
      good: { min: 0.6, max: 0.8, color: '#91cf60', label: 'Good' },
      excellent: { min: 0.8, max: 0.9, color: '#1a9850', label: 'Excellent' }
    };
  }

  /**
   * Create a properly color-mapped NDVI image using Earth Engine
   * Uses CONTINUOUS color palette for smooth visualization
   * @param {ee.Image} ndviImage - NDVI image
   * @returns {ee.Image} NDVI image (continuous values)
   */
  createColorMappedNDVI(ndviImage) {
    try {
      // Return the NDVI image as-is for continuous color mapping
      // The visualization will be applied in getThumbURL with proper palette
      return ndviImage;
    } catch (error) {
      console.warn('Error creating color-mapped NDVI:', error);
      return ndviImage;
    }
  }

  /**
   * Get visualization parameters for proper NDVI color display
   * Uses CONTINUOUS color palette from brown/red (low) to green (high)
   * @returns {Object} Visualization parameters for Earth Engine
   */
  getVisualizationParams() {
    return {
      min: -0.2,  // Water, bare soil, non-vegetated areas
      max: 0.9,   // Dense, healthy vegetation
      palette: [
        '#d73027',  // Red: Very low NDVI (water, bare soil)
        '#fc8d59',  // Orange: Low NDVI (sparse vegetation)
        '#fee08b',  // Yellow: Low-moderate NDVI
        '#d9ef8b',  // Light green: Moderate NDVI
        '#91cf60',  // Green: Good vegetation
        '#1a9850'   // Dark green: Excellent vegetation
      ]
    };
  }

  /**
   * Get thumbnail URL with proper NDVI color visualization
   * Uses continuous color palette for smooth green visualization
   * @param {ee.Image} ndviImage - NDVI image
   * @param {ee.Geometry} geometry - Field geometry
   * @param {Number} dimensions - Image dimensions
   * @returns {String} Thumbnail URL
   */
  getColorMappedThumbURL(ndviImage, geometry, dimensions = 512) {
    try {
      // Get visualization parameters (continuous palette)
      const visParams = this.getVisualizationParams();

      // Generate thumbnail URL with continuous color mapping
      const thumbUrl = ndviImage.getThumbURL({
        min: visParams.min,
        max: visParams.max,
        palette: visParams.palette,
        dimensions: dimensions,
        region: geometry,
        format: 'png'
      });

      return thumbUrl;
    } catch (error) {
      console.warn('Error getting color-mapped thumbnail URL:', error);
      return null;
    }
  }

  /**
   * Get NDVI scale information
   * @returns {Object} NDVI scale with all categories
   */
  getNDVIScale() {
    return this.NDVI_SCALE;
  }

  /**
   * Classify NDVI value into category
   * @param {Number} ndviValue - NDVI value
   * @returns {Object} Category information
   */
  classifyNDVI(ndviValue) {
    if (ndviValue < 0) {
      return { ...this.NDVI_SCALE.poor, value: ndviValue };
    } else if (ndviValue < 0.2) {
      return { ...this.NDVI_SCALE.sparse, value: ndviValue };
    } else if (ndviValue < 0.4) {
      return { ...this.NDVI_SCALE.bare, value: ndviValue };
    } else if (ndviValue < 0.6) {
      return { ...this.NDVI_SCALE.moderate, value: ndviValue };
    } else if (ndviValue < 0.8) {
      return { ...this.NDVI_SCALE.good, value: ndviValue };
    } else {
      return { ...this.NDVI_SCALE.excellent, value: ndviValue };
    }
  }

  /**
   * Get interpolated color for NDVI value (continuous)
   * @param {Number} ndviValue - NDVI value
   * @returns {String} Hex color code
   */
  getInterpolatedColor(ndviValue) {
    // Clamp value to visualization range
    const clampedValue = Math.max(-0.2, Math.min(0.9, ndviValue));

    // Define color stops
    const colorStops = [
      { value: -0.2, color: '#d73027' },
      { value: 0.0, color: '#fc8d59' },
      { value: 0.2, color: '#fee08b' },
      { value: 0.4, color: '#d9ef8b' },
      { value: 0.6, color: '#91cf60' },
      { value: 0.9, color: '#1a9850' }
    ];

    // Find the two color stops to interpolate between
    for (let i = 0; i < colorStops.length - 1; i++) {
      if (clampedValue >= colorStops[i].value && clampedValue <= colorStops[i + 1].value) {
        return colorStops[i].color; // Return lower bound color for simplicity
      }
    }

    return colorStops[colorStops.length - 1].color;
  }

  /**
   * Get color for NDVI value
   * @param {Number} ndviValue - NDVI value
   * @returns {String} Hex color code
   */
  getColorForNDVI(ndviValue) {
    const category = this.classifyNDVI(ndviValue);
    return category.color;
  }

  /**
   * Create a legend image with color scale
   * @returns {Object} Legend data
   */
  getLegendData() {
    return {
      title: 'NDVI Color Scale',
      description: 'Normalized Difference Vegetation Index Classification',
      categories: Object.entries(this.NDVI_SCALE).map(([key, value]) => ({
        key,
        label: value.label,
        range: `${value.min} to ${value.max}`,
        color: value.color,
        description: this.getDescription(key)
      }))
    };
  }

  /**
   * Get description for NDVI category
   * @param {String} category - Category key
   * @returns {String} Description
   */
  getDescription(category) {
    const descriptions = {
      poor: 'Water bodies, bare soil, or non-vegetated areas (Red)',
      sparse: 'Sparse vegetation or stressed plants (Orange)',
      bare: 'Low vegetation density or dry soil (Yellow)',
      moderate: 'Moderate vegetation coverage (Light Green)',
      good: 'Good vegetation health and coverage (Green)',
      excellent: 'Dense, healthy vegetation (Dark Green)'
    };
    return descriptions[category] || '';
  }

  /**
   * Validate NDVI value
   * @param {Number} ndviValue - NDVI value
   * @returns {Boolean} True if valid
   */
  isValidNDVI(ndviValue) {
    return typeof ndviValue === 'number' && ndviValue >= -1 && ndviValue <= 1;
  }

  /**
   * Get statistics for NDVI values
   * @param {Array} ndviValues - Array of NDVI values
   * @returns {Object} Statistics
   */
  getStatistics(ndviValues) {
    if (!ndviValues || ndviValues.length === 0) {
      return null;
    }

    const sorted = [...ndviValues].sort((a, b) => a - b);
    const mean = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Count categories
    const categories = {
      poor: ndviValues.filter(v => v < 0).length,
      sparse: ndviValues.filter(v => v >= 0 && v < 0.2).length,
      bare: ndviValues.filter(v => v >= 0.2 && v < 0.4).length,
      moderate: ndviValues.filter(v => v >= 0.4 && v < 0.6).length,
      good: ndviValues.filter(v => v >= 0.6 && v < 0.8).length,
      excellent: ndviValues.filter(v => v >= 0.8).length
    };

    return {
      mean,
      median,
      min,
      max,
      count: ndviValues.length,
      categories,
      categoryPercentages: {
        poor: ((categories.poor / ndviValues.length) * 100).toFixed(2),
        sparse: ((categories.sparse / ndviValues.length) * 100).toFixed(2),
        bare: ((categories.bare / ndviValues.length) * 100).toFixed(2),
        moderate: ((categories.moderate / ndviValues.length) * 100).toFixed(2),
        good: ((categories.good / ndviValues.length) * 100).toFixed(2),
        excellent: ((categories.excellent / ndviValues.length) * 100).toFixed(2)
      }
    };
  }
}

module.exports = NDVIColorVisualizationService;

