/**
 * NDVI Legend Service
 * Generates NDVI legend/scale information for visualization
 */

class NDVILegendService {
  constructor() {
    this.NDVI_SCALE = {
      poor: {
        range: '-1 to 0',
        label: 'Poor',
        color: '#d73027',
        description: 'No vegetation or water'
      },
      sparse: {
        range: '0 to 0.2',
        label: 'Sparse',
        color: '#fc8d59',
        description: 'Sparse vegetation'
      },
      bare: {
        range: '0.2 to 0.4',
        label: 'Bare',
        color: '#fee090',
        description: 'Bare soil or rock'
      },
      moderate: {
        range: '0.4 to 0.6',
        label: 'Moderate',
        color: '#e0f3f8',
        description: 'Moderate vegetation'
      },
      good: {
        range: '0.6 to 0.8',
        label: 'Good',
        color: '#91bfdb',
        description: 'Good vegetation'
      },
      excellent: {
        range: '0.8 to 1',
        label: 'Excellent',
        color: '#4575b4',
        description: 'Excellent vegetation'
      }
    };
  }

  /**
   * Get NDVI scale/legend
   * @returns {Object} NDVI scale with all categories
   */
  getNDVIScale() {
    return this.NDVI_SCALE;
  }

  /**
   * Get NDVI category for a given value
   * @param {Number} ndviValue - NDVI value (-1 to 1)
   * @returns {Object} NDVI category information
   */
  getNDVICategory(ndviValue) {
    if (ndviValue < 0) {
      return this.NDVI_SCALE.poor;
    } else if (ndviValue < 0.2) {
      return this.NDVI_SCALE.sparse;
    } else if (ndviValue < 0.4) {
      return this.NDVI_SCALE.bare;
    } else if (ndviValue < 0.6) {
      return this.NDVI_SCALE.moderate;
    } else if (ndviValue < 0.8) {
      return this.NDVI_SCALE.good;
    } else {
      return this.NDVI_SCALE.excellent;
    }
  }

  /**
   * Get color palette array for Earth Engine visualization
   * @returns {Array} Color palette in order
   */
  getColorPalette() {
    return [
      this.NDVI_SCALE.poor.color,
      this.NDVI_SCALE.sparse.color,
      this.NDVI_SCALE.bare.color,
      this.NDVI_SCALE.moderate.color,
      this.NDVI_SCALE.good.color,
      this.NDVI_SCALE.excellent.color
    ];
  }

  /**
   * Get legend HTML for web display
   * @returns {String} HTML legend
   */
  getLegendHTML() {
    let html = '<div class="ndvi-legend">';
    html += '<h3>NDVI Scale</h3>';
    html += '<div class="legend-items">';

    Object.values(this.NDVI_SCALE).forEach(item => {
      html += `
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${item.color}"></div>
          <div class="legend-info">
            <strong>${item.label}</strong>
            <span class="legend-range">${item.range}</span>
            <p class="legend-description">${item.description}</p>
          </div>
        </div>
      `;
    });

    html += '</div></div>';
    return html;
  }

  /**
   * Get legend CSS for web display
   * @returns {String} CSS styles
   */
  getLegendCSS() {
    return `
      .ndvi-legend {
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 15px;
        font-family: Arial, sans-serif;
        max-width: 300px;
      }

      .ndvi-legend h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
        color: #333;
      }

      .legend-items {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .legend-color {
        width: 30px;
        height: 20px;
        border: 1px solid #999;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .legend-info {
        flex: 1;
      }

      .legend-info strong {
        display: block;
        font-size: 13px;
        color: #333;
      }

      .legend-range {
        display: block;
        font-size: 11px;
        color: #666;
      }

      .legend-description {
        margin: 3px 0 0 0;
        font-size: 11px;
        color: #999;
      }
    `;
  }

  /**
   * Get legend as JSON for API response
   * @returns {Object} Legend data
   */
  getLegendJSON() {
    return {
      title: 'NDVI Scale',
      description: 'Normalized Difference Vegetation Index (NDVI) Classification',
      scale: this.NDVI_SCALE,
      palette: this.getColorPalette(),
      min: -1,
      max: 1,
      unit: 'NDVI Value'
    };
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

module.exports = NDVILegendService;

