/**
 * Crop Analytics Service
 * Provides comprehensive crop performance analytics, yield estimation, and stress detection
 * 
 * Features:
 * - Crop performance metrics and scoring
 * - Yield estimation based on NDVI patterns
 * - Stress detection and severity assessment
 * - Comparative analysis (field vs regional benchmarks)
 * - Seasonal performance tracking
 * - Economic impact analysis
 */

class CropAnalyticsService {
  constructor(ee) {
    this.ee = ee;
    this.SENTINEL2_DATASET = 'COPERNICUS/S2_SR';
    this.CLOUD_FILTER = 30;
    
    // Yield estimation models (NDVI-based regression coefficients)
    // Based on research: Yield = a + b * Peak_NDVI + c * Integrated_NDVI
    this.YIELD_MODELS = {
      rice: {
        name: 'Rice',
        unit: 'tons/hectare',
        baseline_yield: 3.5,
        ndvi_coefficient: 8.5,
        integrated_coefficient: 0.15,
        typical_range: { min: 2.5, max: 7.0 }
      },
      wheat: {
        name: 'Wheat',
        unit: 'tons/hectare',
        baseline_yield: 2.8,
        ndvi_coefficient: 6.5,
        integrated_coefficient: 0.12,
        typical_range: { min: 2.0, max: 5.5 }
      },
      maize: {
        name: 'Maize/Corn',
        unit: 'tons/hectare',
        baseline_yield: 4.5,
        ndvi_coefficient: 10.0,
        integrated_coefficient: 0.18,
        typical_range: { min: 3.0, max: 9.0 }
      },
      cotton: {
        name: 'Cotton',
        unit: 'tons/hectare',
        baseline_yield: 1.5,
        ndvi_coefficient: 3.5,
        integrated_coefficient: 0.08,
        typical_range: { min: 1.0, max: 3.0 }
      },
      soybean: {
        name: 'Soybean',
        unit: 'tons/hectare',
        baseline_yield: 2.0,
        ndvi_coefficient: 5.0,
        integrated_coefficient: 0.10,
        typical_range: { min: 1.5, max: 4.0 }
      }
    };
    
    // Stress detection thresholds
    this.STRESS_THRESHOLDS = {
      drought: { ndvi_drop: 0.15, duration_days: 14 },
      nutrient: { ndvi_below: 0.4, duration_days: 21 },
      pest_disease: { sudden_drop: 0.20, recovery_days: 7 },
      waterlogging: { ndvi_below: 0.35, after_rain: true }
    };
  }

  /**
   * Analyze crop performance for a field
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} cropType - Crop type
   * @param {String} startDate - Season start date (YYYY-MM-DD)
   * @param {String} endDate - Season end date (YYYY-MM-DD)
   * @param {Number} fieldArea - Field area in hectares
   * @returns {Promise<Object>} Crop performance analytics
   */
  async analyzeCropPerformance(fieldBoundary, fieldId, cropType, startDate, endDate, fieldArea) {
    try {
      console.log(`📊 Analyzing crop performance for ${cropType} in field ${fieldId}`);
      
      // Validate crop type
      if (!this.YIELD_MODELS[cropType.toLowerCase()]) {
        throw new Error(`Unsupported crop type: ${cropType}`);
      }
      
      const crop = this.YIELD_MODELS[cropType.toLowerCase()];
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      
      // Get NDVI time series
      const ndviTimeSeries = await this._getNDVITimeSeries(geometry, startDate, endDate);
      
      // Calculate performance metrics
      const performanceMetrics = this._calculatePerformanceMetrics(ndviTimeSeries, crop);
      
      // Estimate yield
      const yieldEstimate = this._estimateYield(ndviTimeSeries, crop, fieldArea);
      
      // Detect stress events
      const stressAnalysis = this._detectStressEvents(ndviTimeSeries);
      
      // Calculate productivity score
      const productivityScore = this._calculateProductivityScore(performanceMetrics, yieldEstimate, stressAnalysis);
      
      // Generate recommendations
      const recommendations = this._generateRecommendations(performanceMetrics, stressAnalysis, yieldEstimate);
      
      return {
        success: true,
        field_id: fieldId,
        crop_type: crop.name,
        season: { start: startDate, end: endDate },
        field_area_hectares: fieldArea,
        performance_metrics: performanceMetrics,
        yield_estimate: yieldEstimate,
        stress_analysis: stressAnalysis,
        productivity_score: productivityScore,
        recommendations: recommendations,
        metadata: {
          data_source: 'Sentinel-2',
          analysis_method: 'NDVI-based regression',
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error analyzing crop performance:', error);
      throw new Error(`Crop performance analysis failed: ${error.message}`);
    }
  }

  /**
   * Estimate crop yield
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} cropType - Crop type
   * @param {String} startDate - Season start date
   * @param {String} endDate - Season end date
   * @param {Number} fieldArea - Field area in hectares
   * @returns {Promise<Object>} Yield estimation
   */
  async estimateYield(fieldBoundary, fieldId, cropType, startDate, endDate, fieldArea) {
    try {
      console.log(`🌾 Estimating yield for ${cropType} in field ${fieldId}`);
      
      if (!this.YIELD_MODELS[cropType.toLowerCase()]) {
        throw new Error(`Unsupported crop type: ${cropType}`);
      }
      
      const crop = this.YIELD_MODELS[cropType.toLowerCase()];
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      const ndviTimeSeries = await this._getNDVITimeSeries(geometry, startDate, endDate);
      
      const yieldEstimate = this._estimateYield(ndviTimeSeries, crop, fieldArea);
      
      return {
        success: true,
        field_id: fieldId,
        crop_type: crop.name,
        field_area_hectares: fieldArea,
        yield_estimate: yieldEstimate,
        metadata: {
          data_source: 'Sentinel-2',
          estimation_method: 'NDVI-based regression',
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error estimating yield:', error);
      throw new Error(`Yield estimation failed: ${error.message}`);
    }
  }

  /**
   * Detect crop stress events
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} startDate - Analysis start date
   * @param {String} endDate - Analysis end date
   * @returns {Promise<Object>} Stress detection results
   */
  async detectStress(fieldBoundary, fieldId, startDate, endDate) {
    try {
      console.log(`🔍 Detecting stress events for field ${fieldId}`);
      
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      const ndviTimeSeries = await this._getNDVITimeSeries(geometry, startDate, endDate);
      
      const stressAnalysis = this._detectStressEvents(ndviTimeSeries);
      
      return {
        success: true,
        field_id: fieldId,
        date_range: { start: startDate, end: endDate },
        stress_analysis: stressAnalysis,
        metadata: {
          data_source: 'Sentinel-2',
          detection_method: 'NDVI pattern analysis',
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error detecting stress:', error);
      throw new Error(`Stress detection failed: ${error.message}`);
    }
  }

  /**
   * Get NDVI time series
   */
  async _getNDVITimeSeries(geometry, startDate, endDate) {
    const dates = this._generateDateRange(startDate, endDate, 10);
    const timeSeries = [];
    
    for (const date of dates) {
      const nextDate = this._addDays(date, 10);
      
      const collection = this.ee.ImageCollection(this.SENTINEL2_DATASET)
        .filterBounds(geometry)
        .filterDate(date, nextDate)
        .filter(this.ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', this.CLOUD_FILTER));
      
      if (collection.size().getInfo() > 0) {
        const ndvi = collection
          .map(img => img.normalizedDifference(['B8', 'B4']).rename('NDVI'))
          .mean();
        
        const stats = ndvi.reduceRegion({
          reducer: this.ee.Reducer.mean()
            .combine(this.ee.Reducer.stdDev(), '', true)
            .combine(this.ee.Reducer.min(), '', true)
            .combine(this.ee.Reducer.max(), '', true),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9
        }).getInfo();
        
        timeSeries.push({
          date: date,
          ndvi_mean: stats.NDVI_mean || 0,
          ndvi_std: stats.NDVI_stdDev || 0,
          ndvi_min: stats.NDVI_min || 0,
          ndvi_max: stats.NDVI_max || 0
        });
      }
    }
    
    return timeSeries;
  }

  /**
   * Calculate performance metrics
   */
  _calculatePerformanceMetrics(ndviTimeSeries, crop) {
    if (ndviTimeSeries.length === 0) {
      return null;
    }
    
    const ndviValues = ndviTimeSeries.map(d => d.ndvi_mean);
    const peakNDVI = Math.max(...ndviValues);
    const avgNDVI = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
    const minNDVI = Math.min(...ndviValues);
    
    // Calculate integrated NDVI (area under curve)
    const integratedNDVI = this._calculateIntegratedNDVI(ndviTimeSeries);
    
    // Calculate variability
    const variance = ndviValues.reduce((sum, val) => sum + Math.pow(val - avgNDVI, 2), 0) / ndviValues.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / avgNDVI) * 100; // Coefficient of variation
    
    return {
      peak_ndvi: parseFloat(peakNDVI.toFixed(3)),
      average_ndvi: parseFloat(avgNDVI.toFixed(3)),
      minimum_ndvi: parseFloat(minNDVI.toFixed(3)),
      integrated_ndvi: parseFloat(integratedNDVI.toFixed(2)),
      variability: {
        std_dev: parseFloat(stdDev.toFixed(3)),
        coefficient_of_variation: parseFloat(cv.toFixed(1)),
        uniformity: cv < 15 ? 'High' : cv < 25 ? 'Medium' : 'Low'
      },
      vigor_index: parseFloat(((peakNDVI + avgNDVI) / 2).toFixed(3)),
      performance_rating: this._ratePerformance(peakNDVI, avgNDVI)
    };
  }

  /**
   * Estimate yield based on NDVI
   */
  _estimateYield(ndviTimeSeries, crop, fieldArea) {
    if (ndviTimeSeries.length === 0) {
      return null;
    }
    
    const ndviValues = ndviTimeSeries.map(d => d.ndvi_mean);
    const peakNDVI = Math.max(...ndviValues);
    const integratedNDVI = this._calculateIntegratedNDVI(ndviTimeSeries);
    
    // Yield estimation formula: Yield = baseline + (peak_coef * peak_NDVI) + (integrated_coef * integrated_NDVI)
    const estimatedYieldPerHa = crop.baseline_yield + 
                                 (crop.ndvi_coefficient * peakNDVI) + 
                                 (crop.integrated_coefficient * integratedNDVI);
    
    const totalYield = estimatedYieldPerHa * fieldArea;
    
    // Calculate confidence based on data quality
    const confidence = this._calculateYieldConfidence(ndviTimeSeries, peakNDVI, crop);
    
    return {
      estimated_yield_per_hectare: parseFloat(estimatedYieldPerHa.toFixed(2)),
      total_estimated_yield: parseFloat(totalYield.toFixed(2)),
      unit: crop.unit,
      confidence_level: confidence.level,
      confidence_score: confidence.score,
      yield_category: this._categorizeYield(estimatedYieldPerHa, crop),
      typical_range: crop.typical_range,
      factors_used: {
        peak_ndvi: peakNDVI,
        integrated_ndvi: integratedNDVI,
        field_area: fieldArea
      }
    };
  }

  /**
   * Detect stress events
   */
  _detectStressEvents(ndviTimeSeries) {
    const stressEvents = [];
    let totalStressDays = 0;

    for (let i = 1; i < ndviTimeSeries.length; i++) {
      const current = ndviTimeSeries[i];
      const previous = ndviTimeSeries[i - 1];
      const ndviDrop = previous.ndvi_mean - current.ndvi_mean;

      // Detect sudden drops (potential drought, pest, or disease)
      if (ndviDrop > this.STRESS_THRESHOLDS.drought.ndvi_drop) {
        const severity = ndviDrop > 0.25 ? 'severe' : ndviDrop > 0.20 ? 'moderate' : 'mild';
        stressEvents.push({
          date: current.date,
          type: 'sudden_decline',
          severity: severity,
          ndvi_drop: parseFloat(ndviDrop.toFixed(3)),
          current_ndvi: current.ndvi_mean,
          possible_causes: this._identifyStressCauses(ndviDrop, current.ndvi_mean),
          impact: this._assessStressImpact(severity)
        });
        totalStressDays += 10; // Approximate days affected
      }

      // Detect prolonged low NDVI (nutrient deficiency or poor conditions)
      if (current.ndvi_mean < this.STRESS_THRESHOLDS.nutrient.ndvi_below && i > 2) {
        const prevLow = ndviTimeSeries.slice(Math.max(0, i - 2), i).every(d => d.ndvi_mean < 0.4);
        if (prevLow) {
          stressEvents.push({
            date: current.date,
            type: 'prolonged_low_vigor',
            severity: 'moderate',
            ndvi_value: current.ndvi_mean,
            possible_causes: ['Nutrient deficiency', 'Poor soil conditions', 'Water stress'],
            impact: 'Reduced growth and potential yield loss'
          });
          totalStressDays += 21;
        }
      }
    }

    // Calculate overall stress score
    const stressScore = this._calculateStressScore(stressEvents, ndviTimeSeries.length);

    return {
      total_stress_events: stressEvents.length,
      total_stress_days: totalStressDays,
      stress_score: stressScore,
      stress_level: this._classifyStressLevel(stressScore),
      events: stressEvents,
      summary: this._generateStressSummary(stressEvents)
    };
  }

  /**
   * Calculate productivity score (0-100)
   */
  _calculateProductivityScore(performanceMetrics, yieldEstimate, stressAnalysis) {
    if (!performanceMetrics || !yieldEstimate) {
      return { score: 0, rating: 'Unknown' };
    }

    // Performance component (40 points)
    const performanceScore = performanceMetrics.peak_ndvi * 40;

    // Yield component (40 points)
    const yieldRatio = yieldEstimate.estimated_yield_per_hectare /
                       ((yieldEstimate.typical_range.min + yieldEstimate.typical_range.max) / 2);
    const yieldScore = Math.min(40, yieldRatio * 40);

    // Stress component (20 points) - deduct based on stress
    const stressDeduction = stressAnalysis ? (stressAnalysis.stress_score / 100) * 20 : 0;
    const stressScore = 20 - stressDeduction;

    const totalScore = performanceScore + yieldScore + stressScore;

    return {
      score: parseFloat(totalScore.toFixed(1)),
      rating: this._rateProductivity(totalScore),
      components: {
        performance: parseFloat(performanceScore.toFixed(1)),
        yield: parseFloat(yieldScore.toFixed(1)),
        stress_resilience: parseFloat(stressScore.toFixed(1))
      }
    };
  }

  /**
   * Generate recommendations
   */
  _generateRecommendations(performanceMetrics, stressAnalysis, yieldEstimate) {
    const recommendations = [];

    // Performance-based recommendations
    if (performanceMetrics) {
      if (performanceMetrics.peak_ndvi < 0.6) {
        recommendations.push({
          category: 'Performance',
          priority: 'High',
          recommendation: 'Low peak NDVI detected. Consider soil testing and nutrient management.',
          expected_impact: 'Improve crop vigor and yield potential'
        });
      }

      if (performanceMetrics.variability.coefficient_of_variation > 25) {
        recommendations.push({
          category: 'Uniformity',
          priority: 'Medium',
          recommendation: 'High field variability detected. Implement precision agriculture techniques.',
          expected_impact: 'Improve field uniformity and resource efficiency'
        });
      }
    }

    // Stress-based recommendations
    if (stressAnalysis && stressAnalysis.total_stress_events > 0) {
      const stressTypes = [...new Set(stressAnalysis.events.map(e => e.type))];

      if (stressTypes.includes('sudden_decline')) {
        recommendations.push({
          category: 'Stress Management',
          priority: 'High',
          recommendation: 'Sudden NDVI drops detected. Monitor for pests, diseases, and water stress.',
          expected_impact: 'Prevent further crop damage and yield loss'
        });
      }

      if (stressTypes.includes('prolonged_low_vigor')) {
        recommendations.push({
          category: 'Nutrition',
          priority: 'High',
          recommendation: 'Prolonged low vigor detected. Apply balanced fertilizers and improve irrigation.',
          expected_impact: 'Restore crop health and productivity'
        });
      }
    }

    // Yield-based recommendations
    if (yieldEstimate) {
      if (yieldEstimate.yield_category === 'Below Average') {
        recommendations.push({
          category: 'Yield Improvement',
          priority: 'High',
          recommendation: 'Below-average yield expected. Review crop management practices and inputs.',
          expected_impact: 'Increase yield to average or above-average levels'
        });
      }

      if (yieldEstimate.confidence_level === 'low') {
        recommendations.push({
          category: 'Data Quality',
          priority: 'Medium',
          recommendation: 'Low confidence in yield estimate. Ensure consistent monitoring throughout season.',
          expected_impact: 'Improve prediction accuracy for future seasons'
        });
      }
    }

    return recommendations;
  }

  /**
   * Helper: Calculate integrated NDVI (area under curve)
   */
  _calculateIntegratedNDVI(ndviTimeSeries) {
    if (ndviTimeSeries.length < 2) return 0;

    let integral = 0;
    for (let i = 1; i < ndviTimeSeries.length; i++) {
      const days = this._calculateDaysBetween(ndviTimeSeries[i - 1].date, ndviTimeSeries[i].date);
      const avgNDVI = (ndviTimeSeries[i - 1].ndvi_mean + ndviTimeSeries[i].ndvi_mean) / 2;
      integral += avgNDVI * days;
    }

    return integral;
  }

  /**
   * Helper: Rate performance
   */
  _ratePerformance(peakNDVI, avgNDVI) {
    const score = (peakNDVI * 0.6 + avgNDVI * 0.4) * 100;

    if (score >= 70) return 'Excellent';
    if (score >= 55) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }

  /**
   * Helper: Calculate yield confidence
   */
  _calculateYieldConfidence(ndviTimeSeries, peakNDVI, crop) {
    let score = 50; // Base score

    // Data points factor
    if (ndviTimeSeries.length >= 10) score += 20;
    else if (ndviTimeSeries.length >= 6) score += 10;

    // Peak NDVI factor
    if (peakNDVI >= crop.typical_range.min * 0.8) score += 20;

    // Consistency factor
    const cv = this._calculateCV(ndviTimeSeries.map(d => d.ndvi_mean));
    if (cv < 20) score += 10;

    const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

    return { score: Math.min(100, score), level: level };
  }

  /**
   * Helper: Categorize yield
   */
  _categorizeYield(yieldPerHa, crop) {
    const avgYield = (crop.typical_range.min + crop.typical_range.max) / 2;

    if (yieldPerHa >= avgYield * 1.2) return 'Excellent';
    if (yieldPerHa >= avgYield) return 'Above Average';
    if (yieldPerHa >= avgYield * 0.8) return 'Average';
    if (yieldPerHa >= avgYield * 0.6) return 'Below Average';
    return 'Poor';
  }

  /**
   * Helper: Identify stress causes
   */
  _identifyStressCauses(ndviDrop, currentNDVI) {
    const causes = [];

    if (ndviDrop > 0.25) {
      causes.push('Severe drought stress', 'Major pest/disease outbreak', 'Flood damage');
    } else if (ndviDrop > 0.20) {
      causes.push('Moderate drought', 'Pest/disease pressure', 'Nutrient deficiency');
    } else {
      causes.push('Water stress', 'Minor pest activity', 'Temporary stress');
    }

    if (currentNDVI < 0.3) {
      causes.push('Severe crop damage or senescence');
    }

    return causes;
  }

  /**
   * Helper: Assess stress impact
   */
  _assessStressImpact(severity) {
    const impacts = {
      severe: 'Significant yield loss expected (20-40%)',
      moderate: 'Moderate yield loss expected (10-20%)',
      mild: 'Minor yield impact (5-10%)'
    };

    return impacts[severity] || 'Unknown impact';
  }

  /**
   * Helper: Calculate stress score
   */
  _calculateStressScore(stressEvents, totalDataPoints) {
    if (stressEvents.length === 0) return 0;

    const severityScores = { severe: 30, moderate: 20, mild: 10 };
    const totalSeverity = stressEvents.reduce((sum, event) => {
      return sum + (severityScores[event.severity] || 10);
    }, 0);

    const frequencyScore = (stressEvents.length / totalDataPoints) * 50;

    return Math.min(100, totalSeverity + frequencyScore);
  }

  /**
   * Helper: Classify stress level
   */
  _classifyStressLevel(score) {
    if (score >= 60) return 'High Stress';
    if (score >= 30) return 'Moderate Stress';
    if (score > 0) return 'Low Stress';
    return 'No Stress';
  }

  /**
   * Helper: Generate stress summary
   */
  _generateStressSummary(stressEvents) {
    if (stressEvents.length === 0) {
      return 'No significant stress events detected during the season';
    }

    const severeCount = stressEvents.filter(e => e.severity === 'severe').length;
    const moderateCount = stressEvents.filter(e => e.severity === 'moderate').length;

    return `Detected ${stressEvents.length} stress event(s): ${severeCount} severe, ${moderateCount} moderate. Immediate action recommended.`;
  }

  /**
   * Helper: Rate productivity
   */
  _rateProductivity(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Fair';
    if (score >= 40) return 'Below Average';
    return 'Poor';
  }

  /**
   * Helper: Calculate coefficient of variation
   */
  _calculateCV(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return (stdDev / mean) * 100;
  }

  /**
   * Helper: Convert GeoJSON to EE Geometry
   */
  _geoJsonToEEGeometry(geoJson) {
    if (geoJson.type === 'Polygon') {
      return this.ee.Geometry.Polygon(geoJson.coordinates[0]);
    }
    throw new Error('Only Polygon geometries are supported');
  }

  /**
   * Helper: Generate date range
   */
  _generateDateRange(startDate, endDate, intervalDays) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + intervalDays);
    }

    return dates;
  }

  /**
   * Helper: Add days to date
   */
  _addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Helper: Calculate days between dates
   */
  _calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  }
}

module.exports = CropAnalyticsService;

