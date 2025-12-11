/**
 * NDVI Chart Service
 * Generates comprehensive NDVI time series chart data with water, vegetation, and soil analysis
 * 
 * Features:
 * - Time series NDVI data with classification
 * - Water body detection (NDVI < 0)
 * - Vegetation analysis (NDVI 0 - 1)
 * - Soil/bare land detection (NDVI 0 - 0.2)
 * - Chart-ready data format
 * - Statistical analysis
 * - Trend detection
 */

class NDVIChartService {
  constructor(ee) {
    this.ee = ee;
    this.SENTINEL2_DATASET = 'COPERNICUS/S2_SR';
    this.CLOUD_FILTER = 30;
    
    // Classification thresholds
    this.THRESHOLDS = {
      water: { min: -1, max: 0, label: 'Water', color: '#0000FF' },
      soil: { min: 0, max: 0.2, label: 'Bare Soil', color: '#8B4513' },
      sparse_veg: { min: 0.2, max: 0.4, label: 'Sparse Vegetation', color: '#FFD700' },
      moderate_veg: { min: 0.4, max: 0.6, label: 'Moderate Vegetation', color: '#90EE90' },
      good_veg: { min: 0.6, max: 0.8, label: 'Good Vegetation', color: '#32CD32' },
      excellent_veg: { min: 0.8, max: 1, label: 'Excellent Vegetation', color: '#006400' }
    };
  }

  /**
   * Generate NDVI chart data for a field
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @param {String} interval - Interval type ('daily', 'weekly', 'monthly')
   * @returns {Promise<Object>} Chart data with water, vegetation, and soil analysis
   */
  async generateNDVIChart(fieldBoundary, fieldId, startDate, endDate, interval = 'monthly') {
    try {
      console.log(`📊 Generating NDVI chart for field ${fieldId} from ${startDate} to ${endDate}`);
      
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      const intervalDays = this._getIntervalDays(interval);
      
      // Generate time series data
      const timeSeriesData = await this._generateTimeSeriesData(
        geometry,
        startDate,
        endDate,
        intervalDays
      );
      
      // Classify each data point
      const classifiedData = this._classifyTimeSeriesData(timeSeriesData);
      
      // Calculate statistics
      const statistics = this._calculateStatistics(classifiedData);
      
      // Generate chart configuration
      const chartConfig = this._generateChartConfig(classifiedData, statistics);
      
      // Calculate area percentages
      const areaAnalysis = await this._calculateAreaPercentages(geometry, startDate, endDate);
      
      return {
        success: true,
        field_id: fieldId,
        date_range: {
          start: startDate,
          end: endDate,
          interval: interval,
          interval_days: intervalDays
        },
        chart_data: {
          labels: classifiedData.map(d => d.date),
          datasets: [
            {
              label: 'NDVI',
              data: classifiedData.map(d => d.ndvi),
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Water %',
              data: classifiedData.map(d => d.water_percentage),
              borderColor: '#0000FF',
              backgroundColor: 'rgba(0, 0, 255, 0.1)',
              fill: false,
              yAxisID: 'percentage'
            },
            {
              label: 'Vegetation %',
              data: classifiedData.map(d => d.vegetation_percentage),
              borderColor: '#32CD32',
              backgroundColor: 'rgba(50, 205, 50, 0.1)',
              fill: false,
              yAxisID: 'percentage'
            },
            {
              label: 'Soil %',
              data: classifiedData.map(d => d.soil_percentage),
              borderColor: '#8B4513',
              backgroundColor: 'rgba(139, 69, 19, 0.1)',
              fill: false,
              yAxisID: 'percentage'
            }
          ]
        },
        time_series: classifiedData,
        statistics: statistics,
        area_analysis: areaAnalysis,
        chart_config: chartConfig,
        metadata: {
          data_source: 'Sentinel-2',
          spatial_resolution: '10m',
          cloud_filter: `< ${this.CLOUD_FILTER}%`,
          generated_at: new Date().toISOString(),
          total_data_points: classifiedData.length
        }
      };
    } catch (error) {
      console.error('Error generating NDVI chart:', error);
      throw new Error(`NDVI chart generation failed: ${error.message}`);
    }
  }

  /**
   * Generate time series data points
   */
  async _generateTimeSeriesData(geometry, startDate, endDate, intervalDays) {
    const dates = this._generateDateRange(startDate, endDate, intervalDays);
    const timeSeriesData = [];
    
    for (const date of dates) {
      try {
        const nextDate = this._addDays(date, intervalDays);
        
        // Get Sentinel-2 image collection
        const collection = this.ee.ImageCollection(this.SENTINEL2_DATASET)
          .filterBounds(geometry)
          .filterDate(date, nextDate)
          .filter(this.ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', this.CLOUD_FILTER))
          .map(img => this._maskClouds(img));
        
        const size = collection.size().getInfo();
        if (size === 0) {
          console.warn(`No imagery for ${date}`);
          continue;
        }
        
        // Calculate NDVI
        const ndviCollection = collection.map(img => 
          img.normalizedDifference(['B8', 'B4']).rename('NDVI')
        );
        
        const ndvi = ndviCollection.mean();
        
        // Get statistics
        const stats = ndvi.reduceRegion({
          reducer: this.ee.Reducer.mean()
            .combine(this.ee.Reducer.stdDev(), '', true)
            .combine(this.ee.Reducer.min(), '', true)
            .combine(this.ee.Reducer.max(), '', true),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9
        }).getInfo();
        
        if (stats.NDVI_mean !== null) {
          timeSeriesData.push({
            date: date,
            ndvi: parseFloat(stats.NDVI_mean.toFixed(4)),
            ndvi_std: parseFloat((stats.NDVI_stdDev || 0).toFixed(4)),
            ndvi_min: parseFloat((stats.NDVI_min || 0).toFixed(4)),
            ndvi_max: parseFloat((stats.NDVI_max || 0).toFixed(4)),
            image_count: size
          });
        }
      } catch (error) {
        console.warn(`Error processing ${date}:`, error.message);
      }
    }
    
    return timeSeriesData;
  }

  /**
   * Classify time series data into water, vegetation, and soil
   */
  _classifyTimeSeriesData(timeSeriesData) {
    return timeSeriesData.map(point => {
      const ndvi = point.ndvi;
      
      // Classify based on NDVI value
      let classification = 'unknown';
      let water_percentage = 0;
      let soil_percentage = 0;
      let vegetation_percentage = 0;
      
      if (ndvi < 0) {
        classification = 'water';
        water_percentage = 100;
      } else if (ndvi < 0.2) {
        classification = 'soil';
        soil_percentage = 100;
      } else if (ndvi < 0.4) {
        classification = 'sparse_vegetation';
        vegetation_percentage = 50;
        soil_percentage = 50;
      } else if (ndvi < 0.6) {
        classification = 'moderate_vegetation';
        vegetation_percentage = 75;
        soil_percentage = 25;
      } else if (ndvi < 0.8) {
        classification = 'good_vegetation';
        vegetation_percentage = 90;
        soil_percentage = 10;
      } else {
        classification = 'excellent_vegetation';
        vegetation_percentage = 100;
      }
      
      return {
        ...point,
        classification: classification,
        classification_label: this._getClassificationLabel(classification),
        water_percentage: water_percentage,
        vegetation_percentage: vegetation_percentage,
        soil_percentage: soil_percentage,
        color: this._getClassificationColor(classification)
      };
    });
  }

  /**
   * Calculate statistics from classified data
   */
  _calculateStatistics(classifiedData) {
    if (classifiedData.length === 0) {
      return null;
    }
    
    const ndviValues = classifiedData.map(d => d.ndvi);
    const waterPercentages = classifiedData.map(d => d.water_percentage);
    const vegPercentages = classifiedData.map(d => d.vegetation_percentage);
    const soilPercentages = classifiedData.map(d => d.soil_percentage);
    
    return {
      ndvi: {
        mean: this._mean(ndviValues),
        std: this._std(ndviValues),
        min: Math.min(...ndviValues),
        max: Math.max(...ndviValues),
        median: this._median(ndviValues)
      },
      water: {
        mean_percentage: this._mean(waterPercentages),
        max_percentage: Math.max(...waterPercentages),
        occurrences: waterPercentages.filter(p => p > 0).length
      },
      vegetation: {
        mean_percentage: this._mean(vegPercentages),
        max_percentage: Math.max(...vegPercentages),
        min_percentage: Math.min(...vegPercentages)
      },
      soil: {
        mean_percentage: this._mean(soilPercentages),
        max_percentage: Math.max(...soilPercentages),
        min_percentage: Math.min(...soilPercentages)
      },
      trend: this._calculateTrend(ndviValues)
    };
  }

  /**
   * Calculate area percentages for water, vegetation, and soil
   */
  async _calculateAreaPercentages(geometry, startDate, endDate) {
    try {
      // Get recent imagery
      const collection = this.ee.ImageCollection(this.SENTINEL2_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, endDate)
        .filter(this.ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', this.CLOUD_FILTER))
        .map(img => this._maskClouds(img));

      if (collection.size().getInfo() === 0) {
        return null;
      }

      // Calculate NDVI
      const ndvi = collection.map(img =>
        img.normalizedDifference(['B8', 'B4']).rename('NDVI')
      ).mean();

      // Create classification masks
      const water = ndvi.lt(0);
      const soil = ndvi.gte(0).and(ndvi.lt(0.2));
      const vegetation = ndvi.gte(0.2);

      // Calculate pixel counts
      const waterStats = water.reduceRegion({
        reducer: this.ee.Reducer.sum(),
        geometry: geometry,
        scale: 10,
        maxPixels: 1e9
      }).getInfo();

      const soilStats = soil.reduceRegion({
        reducer: this.ee.Reducer.sum(),
        geometry: geometry,
        scale: 10,
        maxPixels: 1e9
      }).getInfo();

      const vegStats = vegetation.reduceRegion({
        reducer: this.ee.Reducer.sum(),
        geometry: geometry,
        scale: 10,
        maxPixels: 1e9
      }).getInfo();

      const totalPixels = (waterStats.NDVI || 0) + (soilStats.NDVI || 0) + (vegStats.NDVI || 0);

      if (totalPixels === 0) {
        return null;
      }

      return {
        water: {
          pixels: waterStats.NDVI || 0,
          percentage: parseFloat(((waterStats.NDVI || 0) / totalPixels * 100).toFixed(2)),
          area_hectares: parseFloat(((waterStats.NDVI || 0) * 100 / 10000).toFixed(4))
        },
        soil: {
          pixels: soilStats.NDVI || 0,
          percentage: parseFloat(((soilStats.NDVI || 0) / totalPixels * 100).toFixed(2)),
          area_hectares: parseFloat(((soilStats.NDVI || 0) * 100 / 10000).toFixed(4))
        },
        vegetation: {
          pixels: vegStats.NDVI || 0,
          percentage: parseFloat(((vegStats.NDVI || 0) / totalPixels * 100).toFixed(2)),
          area_hectares: parseFloat(((vegStats.NDVI || 0) * 100 / 10000).toFixed(4))
        },
        total_pixels: totalPixels,
        total_area_hectares: parseFloat((totalPixels * 100 / 10000).toFixed(4))
      };
    } catch (error) {
      console.warn('Error calculating area percentages:', error);
      return null;
    }
  }

  /**
   * Generate chart configuration for frontend
   */
  _generateChartConfig(classifiedData, statistics) {
    return {
      type: 'line',
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: true,
            text: 'NDVI Time Series - Water, Vegetation & Soil Analysis'
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(4);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'NDVI Value'
            },
            min: -0.2,
            max: 1.0
          },
          percentage: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Percentage (%)'
            },
            min: 0,
            max: 100,
            grid: {
              drawOnChartArea: false
            }
          }
        }
      },
      color_legend: Object.entries(this.THRESHOLDS).map(([key, value]) => ({
        category: key,
        label: value.label,
        color: value.color,
        range: `${value.min} to ${value.max}`
      }))
    };
  }

  /**
   * Cloud masking using SCL band
   */
  _maskClouds(image) {
    try {
      const scl = image.select('SCL');
      const mask = scl.eq(4).or(scl.eq(5)).or(scl.eq(6)).or(scl.eq(7));
      return image.updateMask(mask);
    } catch (error) {
      return image;
    }
  }

  /**
   * Helper methods
   */
  _geoJsonToEEGeometry(geoJson) {
    if (geoJson.type === 'Polygon') {
      return this.ee.Geometry.Polygon(geoJson.coordinates);
    } else if (geoJson.type === 'MultiPolygon') {
      return this.ee.Geometry.MultiPolygon(geoJson.coordinates);
    }
    throw new Error('Unsupported geometry type');
  }

  _getIntervalDays(interval) {
    const intervals = {
      'daily': 1,
      'weekly': 7,
      'biweekly': 14,
      'monthly': 30,
      'quarterly': 90
    };
    return intervals[interval] || 30;
  }

  _generateDateRange(startDate, endDate, intervalDays) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    return dates;
  }

  _addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  _getClassificationLabel(classification) {
    const labels = {
      'water': 'Water Body',
      'soil': 'Bare Soil',
      'sparse_vegetation': 'Sparse Vegetation',
      'moderate_vegetation': 'Moderate Vegetation',
      'good_vegetation': 'Good Vegetation',
      'excellent_vegetation': 'Excellent Vegetation'
    };
    return labels[classification] || 'Unknown';
  }

  _getClassificationColor(classification) {
    const colors = {
      'water': '#0000FF',
      'soil': '#8B4513',
      'sparse_vegetation': '#FFD700',
      'moderate_vegetation': '#90EE90',
      'good_vegetation': '#32CD32',
      'excellent_vegetation': '#006400'
    };
    return colors[classification] || '#CCCCCC';
  }

  _mean(arr) {
    return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(4));
  }

  _std(arr) {
    const mean = this._mean(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return parseFloat(Math.sqrt(variance).toFixed(4));
  }

  _median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  _calculateTrend(values) {
    if (values.length < 2) return 'insufficient_data';

    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = this._mean(values);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = numerator / denominator;

    if (slope > 0.01) return 'improving';
    if (slope < -0.01) return 'declining';
    return 'stable';
  }
}

module.exports = NDVIChartService;
