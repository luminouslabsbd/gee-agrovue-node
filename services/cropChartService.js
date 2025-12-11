/**
 * Crop Chart Service
 * Combines crop growth data with NDVI charts for comprehensive visualization
 * 
 * Features:
 * - Integrated crop growth and NDVI charts
 * - Growth stage annotations on charts
 * - Yield prediction overlay
 * - Stress event markers
 * - Comparative analysis charts
 * - Chart.js compatible format
 */

const CropGrowthTrackingService = require('./cropGrowthTrackingService');
const CropAnalyticsService = require('./cropAnalyticsService');
const CropPredictionService = require('./cropPredictionService');

class CropChartService {
  constructor(ee) {
    this.ee = ee;
    this.SENTINEL2_DATASET = 'COPERNICUS/S2_SR';
    this.CLOUD_FILTER = 30;
    
    // Initialize sub-services
    this.growthTrackingService = new CropGrowthTrackingService(ee);
    this.analyticsService = new CropAnalyticsService(ee);
    this.predictionService = new CropPredictionService(ee);
  }

  /**
   * Generate comprehensive crop chart with NDVI and crop data
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} cropType - Crop type
   * @param {String} plantingDate - Planting date (YYYY-MM-DD)
   * @param {String} currentDate - Current date (YYYY-MM-DD)
   * @param {Number} fieldArea - Field area in hectares
   * @returns {Promise<Object>} Comprehensive crop chart data
   */
  async generateCropChart(fieldBoundary, fieldId, cropType, plantingDate, currentDate, fieldArea) {
    try {
      console.log(`📊 Generating comprehensive crop chart for ${cropType} in field ${fieldId}`);
      
      // Get crop growth tracking data
      const growthData = await this.growthTrackingService.trackCropGrowth(
        fieldBoundary, fieldId, cropType, plantingDate, currentDate
      );
      
      // Get crop analytics
      const analyticsData = await this.analyticsService.analyzeCropPerformance(
        fieldBoundary, fieldId, cropType, plantingDate, currentDate, fieldArea
      );
      
      // Get crop predictions
      const predictionData = await this.predictionService.predictCropYield(
        fieldBoundary, fieldId, cropType, plantingDate, currentDate, fieldArea
      );
      
      // Generate chart configuration
      const chartConfig = this._generateChartConfig(growthData, analyticsData, predictionData);
      
      // Generate annotations for growth stages
      const annotations = this._generateAnnotations(growthData, analyticsData);
      
      // Generate summary statistics
      const summary = this._generateSummary(growthData, analyticsData, predictionData);
      
      return {
        success: true,
        field_id: fieldId,
        crop_type: cropType,
        planting_date: plantingDate,
        current_date: currentDate,
        field_area_hectares: fieldArea,
        chart_data: chartConfig.data,
        chart_options: chartConfig.options,
        annotations: annotations,
        summary: summary,
        growth_data: {
          current_stage: growthData.current_stage,
          days_since_planting: growthData.days_since_planting,
          harvest_estimate: growthData.harvest_estimate
        },
        performance: {
          productivity_score: analyticsData.productivity_score,
          yield_estimate: analyticsData.yield_estimate,
          stress_analysis: analyticsData.stress_analysis
        },
        predictions: {
          yield_prediction: predictionData.yield_prediction,
          harvest_prediction: predictionData.harvest_prediction,
          risk_assessment: predictionData.risk_assessment
        },
        metadata: {
          data_source: 'Sentinel-2',
          chart_type: 'comprehensive_crop_analysis',
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating crop chart:', error);
      throw new Error(`Crop chart generation failed: ${error.message}`);
    }
  }

  /**
   * Generate NDVI chart with crop growth overlay
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} cropType - Crop type
   * @param {String} plantingDate - Planting date
   * @param {String} currentDate - Current date
   * @returns {Promise<Object>} NDVI chart with crop overlay
   */
  async generateNDVICropChart(fieldBoundary, fieldId, cropType, plantingDate, currentDate) {
    try {
      console.log(`📈 Generating NDVI crop chart for ${cropType} in field ${fieldId}`);
      
      const growthData = await this.growthTrackingService.trackCropGrowth(
        fieldBoundary, fieldId, cropType, plantingDate, currentDate
      );
      
      // Generate chart data
      const chartData = {
        labels: growthData.ndvi_time_series.map(d => d.date),
        datasets: [
          {
            label: 'NDVI',
            data: growthData.ndvi_time_series.map(d => d.ndvi_mean),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Expected NDVI (Crop Model)',
            data: this._generateExpectedNDVI(growthData.phenology.crop_calendar, growthData.ndvi_time_series),
            borderColor: '#FF9800',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0
          }
        ]
      };
      
      // Add growth stage markers
      const stageMarkers = this._generateStageMarkers(growthData.phenology.phenological_events);
      
      return {
        success: true,
        field_id: fieldId,
        crop_type: cropType,
        chart_data: chartData,
        stage_markers: stageMarkers,
        current_stage: growthData.current_stage,
        metadata: {
          data_source: 'Sentinel-2',
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating NDVI crop chart:', error);
      throw new Error(`NDVI crop chart generation failed: ${error.message}`);
    }
  }

  /**
   * Generate yield prediction chart
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} cropType - Crop type
   * @param {String} plantingDate - Planting date
   * @param {String} currentDate - Current date
   * @param {Number} fieldArea - Field area in hectares
   * @returns {Promise<Object>} Yield prediction chart
   */
  async generateYieldPredictionChart(fieldBoundary, fieldId, cropType, plantingDate, currentDate, fieldArea) {
    try {
      console.log(`🌾 Generating yield prediction chart for ${cropType} in field ${fieldId}`);
      
      const predictionData = await this.predictionService.predictCropYield(
        fieldBoundary, fieldId, cropType, plantingDate, currentDate, fieldArea
      );
      
      // Generate forecast chart
      const chartData = {
        labels: predictionData.growth_forecast.forecast.map(d => d.date),
        datasets: [
          {
            label: 'Predicted NDVI',
            data: predictionData.growth_forecast.forecast.map(d => d.predicted_ndvi),
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Confidence Range (Upper)',
            data: predictionData.growth_forecast.forecast.map(d => 
              d.predicted_ndvi * 1.1
            ),
            borderColor: 'rgba(33, 150, 243, 0.3)',
            backgroundColor: 'transparent',
            borderDash: [2, 2],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'Confidence Range (Lower)',
            data: predictionData.growth_forecast.forecast.map(d => 
              d.predicted_ndvi * 0.9
            ),
            borderColor: 'rgba(33, 150, 243, 0.3)',
            backgroundColor: 'transparent',
            borderDash: [2, 2],
            fill: false,
            pointRadius: 0
          }
        ]
      };
      
      return {
        success: true,
        field_id: fieldId,
        crop_type: cropType,
        chart_data: chartData,
        yield_prediction: predictionData.yield_prediction,
        harvest_prediction: predictionData.harvest_prediction,
        risk_assessment: predictionData.risk_assessment,
        metadata: {
          data_source: 'Sentinel-2',
          prediction_method: 'NDVI-based growth modeling',
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating yield prediction chart:', error);
      throw new Error(`Yield prediction chart generation failed: ${error.message}`);
    }
  }

  /**
   * Generate chart configuration
   */
  _generateChartConfig(growthData, analyticsData, predictionData) {
    const ndviTimeSeries = growthData.ndvi_time_series;
    const forecast = predictionData.growth_forecast.forecast;
    
    // Combine historical and forecast data
    const allDates = [
      ...ndviTimeSeries.map(d => d.date),
      ...forecast.map(d => d.date)
    ];
    
    const historicalNDVI = ndviTimeSeries.map(d => d.ndvi_mean);
    const forecastNDVI = new Array(ndviTimeSeries.length).fill(null).concat(
      forecast.map(d => d.predicted_ndvi)
    );
    
    const data = {
      labels: allDates,
      datasets: [
        {
          label: 'Historical NDVI',
          data: [...historicalNDVI, ...new Array(forecast.length).fill(null)],
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 4
        },
        {
          label: 'Predicted NDVI',
          data: forecastNDVI,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: false,
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 3
        }
      ]
    };
    
    const options = {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: true,
          text: `Crop Growth Analysis - ${growthData.crop_type}`,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(3);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 0,
          max: 1,
          title: {
            display: true,
            text: 'NDVI'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      }
    };
    
    return { data, options };
  }

  /**
   * Generate annotations for growth stages
   */
  _generateAnnotations(growthData, analyticsData) {
    const annotations = [];

    // Add phenological events
    if (growthData.phenology && growthData.phenology.phenological_events) {
      growthData.phenology.phenological_events.forEach(event => {
        annotations.push({
          type: 'line',
          mode: 'vertical',
          scaleID: 'x',
          value: event.date,
          borderColor: '#FF9800',
          borderWidth: 2,
          borderDash: [5, 5],
          label: {
            content: event.event,
            enabled: true,
            position: 'top'
          }
        });
      });
    }

    // Add stress events
    if (analyticsData.stress_analysis && analyticsData.stress_analysis.events) {
      analyticsData.stress_analysis.events.forEach(event => {
        annotations.push({
          type: 'point',
          xValue: event.date,
          yValue: event.current_ndvi || 0.5,
          backgroundColor: event.severity === 'severe' ? '#F44336' : '#FF9800',
          radius: 8,
          label: {
            content: event.type,
            enabled: true
          }
        });
      });
    }

    return annotations;
  }

  /**
   * Generate summary statistics
   */
  _generateSummary(growthData, analyticsData, predictionData) {
    return {
      crop_health: {
        current_stage: growthData.current_stage.stage,
        health_score: growthData.growth_metrics?.health_score || null,
        vigor_percentage: growthData.growth_metrics?.vigor_percentage || null
      },
      performance: {
        productivity_score: analyticsData.productivity_score?.score || null,
        productivity_rating: analyticsData.productivity_score?.rating || null,
        stress_level: analyticsData.stress_analysis?.stress_level || 'Unknown'
      },
      predictions: {
        estimated_yield: predictionData.yield_prediction?.predicted_yield_per_hectare || null,
        yield_unit: predictionData.yield_prediction?.unit || 'tons/hectare',
        harvest_date: predictionData.harvest_prediction?.estimated_harvest_date || null,
        days_until_harvest: predictionData.harvest_prediction?.days_until_harvest || null,
        risk_level: predictionData.risk_assessment?.risk_level || 'Unknown'
      },
      recommendations: analyticsData.recommendations || []
    };
  }

  /**
   * Generate expected NDVI based on crop calendar
   */
  _generateExpectedNDVI(cropCalendar, ndviTimeSeries) {
    if (!cropCalendar || cropCalendar.length === 0) {
      return new Array(ndviTimeSeries.length).fill(null);
    }

    const expectedValues = [];

    ndviTimeSeries.forEach(point => {
      const date = point.date;

      // Find which stage this date falls into
      const stage = cropCalendar.find(s =>
        date >= s.start_date && date <= s.end_date
      );

      if (stage) {
        expectedValues.push(stage.expected_ndvi);
      } else {
        expectedValues.push(null);
      }
    });

    return expectedValues;
  }

  /**
   * Generate stage markers
   */
  _generateStageMarkers(phenologicalEvents) {
    if (!phenologicalEvents || phenologicalEvents.length === 0) {
      return [];
    }

    return phenologicalEvents.map(event => ({
      date: event.date,
      event: event.event,
      ndvi: event.ndvi,
      marker: {
        symbol: 'circle',
        size: 10,
        color: this._getStageColor(event.event)
      }
    }));
  }

  /**
   * Get color for growth stage
   */
  _getStageColor(stageName) {
    const colors = {
      'Emergence': '#8BC34A',
      'Peak Vegetation': '#4CAF50',
      'Senescence Start': '#FF9800',
      'Flowering': '#E91E63',
      'Maturity': '#FFC107'
    };

    return colors[stageName] || '#9E9E9E';
  }
}

module.exports = CropChartService;

