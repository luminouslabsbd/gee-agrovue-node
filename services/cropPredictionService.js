/**
 * Crop Prediction Service
 * Provides ML-based crop yield prediction, growth forecasting, and harvest date estimation
 * 
 * Features:
 * - Yield prediction using historical NDVI patterns
 * - Growth trajectory forecasting
 * - Harvest date prediction
 * - Risk assessment for yield loss
 * - Seasonal comparison and trends
 * - Weather impact analysis (using NDVI as proxy)
 */

class CropPredictionService {
  constructor(ee) {
    this.ee = ee;
    this.SENTINEL2_DATASET = 'COPERNICUS/S2_SR';
    this.CLOUD_FILTER = 30;
    
    // Prediction models based on crop growth curves
    this.PREDICTION_MODELS = {
      rice: {
        name: 'Rice',
        growth_curve: 'sigmoid', // S-shaped growth curve
        critical_stages: {
          tillering: { day: 30, ndvi_threshold: 0.4 },
          panicle_initiation: { day: 60, ndvi_threshold: 0.7 },
          flowering: { day: 75, ndvi_threshold: 0.8 }
        },
        yield_correlation: 0.85, // R² for NDVI-yield relationship
        forecast_accuracy: 0.80
      },
      wheat: {
        name: 'Wheat',
        growth_curve: 'sigmoid',
        critical_stages: {
          tillering: { day: 40, ndvi_threshold: 0.45 },
          stem_elongation: { day: 70, ndvi_threshold: 0.65 },
          heading: { day: 100, ndvi_threshold: 0.75 }
        },
        yield_correlation: 0.82,
        forecast_accuracy: 0.78
      },
      maize: {
        name: 'Maize/Corn',
        growth_curve: 'exponential',
        critical_stages: {
          vegetative: { day: 40, ndvi_threshold: 0.5 },
          tasseling: { day: 60, ndvi_threshold: 0.85 },
          silking: { day: 70, ndvi_threshold: 0.8 }
        },
        yield_correlation: 0.88,
        forecast_accuracy: 0.83
      },
      cotton: {
        name: 'Cotton',
        growth_curve: 'linear',
        critical_stages: {
          vegetative: { day: 50, ndvi_threshold: 0.6 },
          flowering: { day: 90, ndvi_threshold: 0.75 },
          boll_development: { day: 130, ndvi_threshold: 0.7 }
        },
        yield_correlation: 0.75,
        forecast_accuracy: 0.72
      },
      soybean: {
        name: 'Soybean',
        growth_curve: 'sigmoid',
        critical_stages: {
          vegetative: { day: 40, ndvi_threshold: 0.5 },
          flowering: { day: 60, ndvi_threshold: 0.75 },
          pod_development: { day: 90, ndvi_threshold: 0.7 }
        },
        yield_correlation: 0.80,
        forecast_accuracy: 0.76
      }
    };
  }

  /**
   * Predict crop yield and growth trajectory
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} cropType - Crop type
   * @param {String} plantingDate - Planting date (YYYY-MM-DD)
   * @param {String} currentDate - Current date (YYYY-MM-DD)
   * @param {Number} fieldArea - Field area in hectares
   * @param {Number} historicalYield - Historical average yield (optional)
   * @returns {Promise<Object>} Crop predictions
   */
  async predictCropYield(fieldBoundary, fieldId, cropType, plantingDate, currentDate, fieldArea, historicalYield = null) {
    try {
      console.log(`🔮 Predicting yield for ${cropType} in field ${fieldId}`);
      
      if (!this.PREDICTION_MODELS[cropType.toLowerCase()]) {
        throw new Error(`Unsupported crop type: ${cropType}`);
      }
      
      const model = this.PREDICTION_MODELS[cropType.toLowerCase()];
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      
      // Get NDVI time series from planting to current
      const ndviTimeSeries = await this._getNDVITimeSeries(geometry, plantingDate, currentDate);
      
      // Calculate days since planting
      const daysSincePlanting = this._calculateDaysBetween(plantingDate, currentDate);
      
      // Forecast future growth
      const growthForecast = this._forecastGrowth(ndviTimeSeries, model, daysSincePlanting);
      
      // Predict final yield
      const yieldPrediction = this._predictFinalYield(ndviTimeSeries, growthForecast, model, fieldArea, historicalYield);
      
      // Estimate harvest date
      const harvestPrediction = this._predictHarvestDate(plantingDate, growthForecast, model);
      
      // Assess risks
      const riskAssessment = this._assessYieldRisks(ndviTimeSeries, growthForecast, model);
      
      // Generate confidence metrics
      const confidence = this._calculatePredictionConfidence(ndviTimeSeries, model, daysSincePlanting);
      
      return {
        success: true,
        field_id: fieldId,
        crop_type: model.name,
        planting_date: plantingDate,
        current_date: currentDate,
        days_since_planting: daysSincePlanting,
        yield_prediction: yieldPrediction,
        growth_forecast: growthForecast,
        harvest_prediction: harvestPrediction,
        risk_assessment: riskAssessment,
        confidence: confidence,
        metadata: {
          data_source: 'Sentinel-2',
          prediction_method: 'NDVI-based growth modeling',
          model_accuracy: model.forecast_accuracy,
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error predicting crop yield:', error);
      throw new Error(`Crop yield prediction failed: ${error.message}`);
    }
  }

  /**
   * Forecast growth trajectory
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} cropType - Crop type
   * @param {String} plantingDate - Planting date
   * @param {String} currentDate - Current date
   * @param {Number} forecastDays - Days to forecast ahead
   * @returns {Promise<Object>} Growth forecast
   */
  async forecastGrowth(fieldBoundary, fieldId, cropType, plantingDate, currentDate, forecastDays = 30) {
    try {
      console.log(`📈 Forecasting growth for ${cropType} in field ${fieldId}`);
      
      if (!this.PREDICTION_MODELS[cropType.toLowerCase()]) {
        throw new Error(`Unsupported crop type: ${cropType}`);
      }
      
      const model = this.PREDICTION_MODELS[cropType.toLowerCase()];
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      const ndviTimeSeries = await this._getNDVITimeSeries(geometry, plantingDate, currentDate);
      const daysSincePlanting = this._calculateDaysBetween(plantingDate, currentDate);
      
      const growthForecast = this._forecastGrowth(ndviTimeSeries, model, daysSincePlanting, forecastDays);
      
      return {
        success: true,
        field_id: fieldId,
        crop_type: model.name,
        current_date: currentDate,
        forecast_days: forecastDays,
        growth_forecast: growthForecast,
        metadata: {
          data_source: 'Sentinel-2',
          forecast_method: 'Growth curve modeling',
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error forecasting growth:', error);
      throw new Error(`Growth forecast failed: ${error.message}`);
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
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9
        }).getInfo();
        
        timeSeries.push({
          date: date,
          ndvi: stats.NDVI || 0,
          days_since_planting: this._calculateDaysBetween(startDate, date)
        });
      }
    }
    
    return timeSeries;
  }

  /**
   * Forecast future growth
   */
  _forecastGrowth(ndviTimeSeries, model, daysSincePlanting, forecastDays = 30) {
    if (ndviTimeSeries.length < 3) {
      return {
        forecast: [],
        trend: 'insufficient_data',
        expected_peak_ndvi: 0,
        expected_peak_date: null
      };
    }
    
    // Calculate current growth rate
    const recentPoints = ndviTimeSeries.slice(-3);
    const growthRate = this._calculateGrowthRate(recentPoints);
    
    // Generate forecast points
    const forecast = [];
    const currentNDVI = ndviTimeSeries[ndviTimeSeries.length - 1].ndvi;
    const currentDate = ndviTimeSeries[ndviTimeSeries.length - 1].date;
    
    for (let i = 10; i <= forecastDays; i += 10) {
      const forecastDate = this._addDays(currentDate, i);
      const forecastDays = daysSincePlanting + i;
      
      // Apply growth curve model
      let forecastNDVI;
      if (model.growth_curve === 'sigmoid') {
        forecastNDVI = this._sigmoidGrowth(forecastDays, currentNDVI, growthRate);
      } else if (model.growth_curve === 'exponential') {
        forecastNDVI = this._exponentialGrowth(forecastDays, currentNDVI, growthRate);
      } else {
        forecastNDVI = this._linearGrowth(forecastDays, currentNDVI, growthRate);
      }
      
      forecast.push({
        date: forecastDate,
        days_since_planting: forecastDays,
        predicted_ndvi: parseFloat(Math.max(0, Math.min(1, forecastNDVI)).toFixed(3)),
        confidence: this._calculateForecastConfidence(i, forecastDays)
      });
    }
    
    // Find expected peak
    const peakPoint = forecast.reduce((max, point) => 
      point.predicted_ndvi > max.predicted_ndvi ? point : max, forecast[0]);
    
    return {
      forecast: forecast,
      current_ndvi: currentNDVI,
      growth_rate: growthRate,
      trend: growthRate > 0.001 ? 'increasing' : growthRate < -0.001 ? 'decreasing' : 'stable',
      expected_peak_ndvi: peakPoint.predicted_ndvi,
      expected_peak_date: peakPoint.date,
      growth_stage: this._determineGrowthStage(daysSincePlanting, currentNDVI, model)
    };
  }

  /**
   * Predict final yield
   */
  _predictFinalYield(ndviTimeSeries, growthForecast, model, fieldArea, historicalYield) {
    const currentNDVI = ndviTimeSeries[ndviTimeSeries.length - 1]?.ndvi || 0;
    const expectedPeakNDVI = growthForecast.expected_peak_ndvi || currentNDVI;
    
    // Base yield estimation (simplified model)
    const baseYield = 3.0; // Base yield in tons/ha
    const ndviCoefficient = 7.0; // Yield increase per NDVI unit
    
    const predictedYieldPerHa = baseYield + (ndviCoefficient * expectedPeakNDVI);
    const totalPredictedYield = predictedYieldPerHa * fieldArea;
    
    // Adjust based on historical yield if available
    let adjustedYield = predictedYieldPerHa;
    if (historicalYield) {
      adjustedYield = (predictedYieldPerHa * 0.7) + (historicalYield * 0.3); // Weighted average
    }
    
    // Calculate yield range (confidence interval)
    const yieldRange = this._calculateYieldRange(adjustedYield, model.forecast_accuracy);
    
    return {
      predicted_yield_per_hectare: parseFloat(adjustedYield.toFixed(2)),
      total_predicted_yield: parseFloat((adjustedYield * fieldArea).toFixed(2)),
      yield_range: yieldRange,
      unit: 'tons/hectare',
      based_on_peak_ndvi: expectedPeakNDVI,
      historical_comparison: historicalYield ? {
        historical_yield: historicalYield,
        predicted_change: parseFloat(((adjustedYield - historicalYield) / historicalYield * 100).toFixed(1)),
        trend: adjustedYield > historicalYield ? 'improving' : 'declining'
      } : null
    };
  }

  /**
   * Predict harvest date
   */
  _predictHarvestDate(plantingDate, growthForecast, model) {
    // Estimate based on when NDVI starts declining significantly
    const declineThreshold = 0.6; // NDVI value indicating maturity

    let harvestDate = null;
    let daysToHarvest = 120; // Default estimate

    // Find when NDVI is expected to decline below threshold
    const declinePoint = growthForecast.forecast.find(point =>
      point.predicted_ndvi < declineThreshold && growthForecast.trend === 'decreasing'
    );

    if (declinePoint) {
      daysToHarvest = declinePoint.days_since_planting + 15; // Add maturity buffer
      harvestDate = this._addDays(plantingDate, daysToHarvest);
    } else {
      // Use expected peak + typical maturity period
      const peakDay = growthForecast.forecast.reduce((max, point) =>
        point.predicted_ndvi > max.predicted_ndvi ? point : max, growthForecast.forecast[0]
      ).days_since_planting;

      daysToHarvest = peakDay + 30; // Add 30 days after peak
      harvestDate = this._addDays(plantingDate, daysToHarvest);
    }

    const today = new Date().toISOString().split('T')[0];
    const daysUntilHarvest = this._calculateDaysBetween(today, harvestDate);

    return {
      estimated_harvest_date: harvestDate,
      days_until_harvest: daysUntilHarvest,
      total_crop_duration_days: daysToHarvest,
      confidence: growthForecast.forecast.length > 0 ? 'medium' : 'low',
      harvest_window: {
        earliest: this._addDays(harvestDate, -7),
        latest: this._addDays(harvestDate, 7)
      }
    };
  }

  /**
   * Assess yield risks
   */
  _assessYieldRisks(ndviTimeSeries, growthForecast, model) {
    const risks = [];
    let overallRiskScore = 0;

    // Check for growth delays
    const currentNDVI = ndviTimeSeries[ndviTimeSeries.length - 1]?.ndvi || 0;
    const daysSincePlanting = ndviTimeSeries[ndviTimeSeries.length - 1]?.days_since_planting || 0;

    // Check against critical stages
    for (const [stageName, stageInfo] of Object.entries(model.critical_stages)) {
      if (daysSincePlanting >= stageInfo.day && currentNDVI < stageInfo.ndvi_threshold) {
        risks.push({
          type: 'growth_delay',
          stage: stageName,
          severity: 'moderate',
          description: `NDVI below expected threshold at ${stageName} stage`,
          expected_ndvi: stageInfo.ndvi_threshold,
          actual_ndvi: currentNDVI,
          impact: 'Potential 10-20% yield reduction'
        });
        overallRiskScore += 20;
      }
    }

    // Check for declining trend when growth expected
    if (growthForecast.trend === 'decreasing' && daysSincePlanting < 90) {
      risks.push({
        type: 'premature_decline',
        severity: 'high',
        description: 'NDVI declining earlier than expected',
        impact: 'Potential 20-30% yield reduction',
        possible_causes: ['Drought stress', 'Nutrient deficiency', 'Disease']
      });
      overallRiskScore += 30;
    }

    // Check for low peak NDVI forecast
    if (growthForecast.expected_peak_ndvi < 0.6) {
      risks.push({
        type: 'low_vigor',
        severity: 'moderate',
        description: 'Expected peak NDVI below optimal range',
        expected_peak: growthForecast.expected_peak_ndvi,
        impact: 'Potential 15-25% yield reduction'
      });
      overallRiskScore += 25;
    }

    // Check for high variability
    if (ndviTimeSeries.length >= 3) {
      const ndviValues = ndviTimeSeries.map(d => d.ndvi);
      const cv = this._calculateCV(ndviValues);

      if (cv > 30) {
        risks.push({
          type: 'high_variability',
          severity: 'low',
          description: 'High NDVI variability detected',
          coefficient_of_variation: cv,
          impact: 'Potential 5-10% yield reduction due to uneven growth'
        });
        overallRiskScore += 10;
      }
    }

    return {
      total_risks: risks.length,
      overall_risk_score: Math.min(100, overallRiskScore),
      risk_level: this._classifyRiskLevel(overallRiskScore),
      risks: risks,
      mitigation_recommendations: this._generateMitigationRecommendations(risks)
    };
  }

  /**
   * Calculate prediction confidence
   */
  _calculatePredictionConfidence(ndviTimeSeries, model, daysSincePlanting) {
    let score = 50; // Base score

    // Data availability factor (30 points)
    if (ndviTimeSeries.length >= 8) score += 30;
    else if (ndviTimeSeries.length >= 5) score += 20;
    else if (ndviTimeSeries.length >= 3) score += 10;

    // Growth stage factor (20 points)
    if (daysSincePlanting >= 60) score += 20; // More data = better prediction
    else if (daysSincePlanting >= 30) score += 10;

    // Model accuracy factor (20 points)
    score += model.forecast_accuracy * 20;

    // Data quality factor (10 points)
    const avgNDVI = ndviTimeSeries.reduce((sum, d) => sum + d.ndvi, 0) / ndviTimeSeries.length;
    if (avgNDVI > 0.3) score += 10; // Good vegetation signal

    const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

    return {
      score: Math.min(100, score),
      level: level,
      factors: {
        data_points: ndviTimeSeries.length,
        days_since_planting: daysSincePlanting,
        model_accuracy: model.forecast_accuracy,
        data_quality: avgNDVI > 0.3 ? 'good' : 'fair'
      }
    };
  }

  /**
   * Helper: Calculate growth rate
   */
  _calculateGrowthRate(recentPoints) {
    if (recentPoints.length < 2) return 0;

    const rates = [];
    for (let i = 1; i < recentPoints.length; i++) {
      const days = recentPoints[i].days_since_planting - recentPoints[i - 1].days_since_planting;
      const ndviChange = recentPoints[i].ndvi - recentPoints[i - 1].ndvi;
      rates.push(ndviChange / days);
    }

    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }

  /**
   * Helper: Sigmoid growth model
   */
  _sigmoidGrowth(days, currentNDVI, growthRate) {
    const maxNDVI = 0.85;
    const midpoint = 70; // Days to reach 50% of max
    const steepness = 0.05;

    return maxNDVI / (1 + Math.exp(-steepness * (days - midpoint)));
  }

  /**
   * Helper: Exponential growth model
   */
  _exponentialGrowth(days, currentNDVI, growthRate) {
    const maxNDVI = 0.90;
    const k = 0.03; // Growth rate constant

    return Math.min(maxNDVI, currentNDVI * Math.exp(k * 10)); // 10-day forecast
  }

  /**
   * Helper: Linear growth model
   */
  _linearGrowth(days, currentNDVI, growthRate) {
    return currentNDVI + (growthRate * 10); // 10-day forecast
  }

  /**
   * Helper: Calculate forecast confidence
   */
  _calculateForecastConfidence(forecastDays, totalDays) {
    // Confidence decreases with forecast distance
    const baseConfidence = 0.9;
    const decayRate = 0.02;

    const confidence = baseConfidence * Math.exp(-decayRate * (forecastDays / 10));

    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Helper: Determine growth stage
   */
  _determineGrowthStage(days, ndvi, model) {
    for (const [stageName, stageInfo] of Object.entries(model.critical_stages)) {
      if (days <= stageInfo.day && ndvi <= stageInfo.ndvi_threshold * 1.2) {
        return stageName.replace(/_/g, ' ');
      }
    }

    return 'maturity';
  }

  /**
   * Helper: Calculate yield range
   */
  _calculateYieldRange(predictedYield, accuracy) {
    const margin = predictedYield * (1 - accuracy);

    return {
      minimum: parseFloat((predictedYield - margin).toFixed(2)),
      maximum: parseFloat((predictedYield + margin).toFixed(2)),
      confidence_interval: `${(accuracy * 100).toFixed(0)}%`
    };
  }

  /**
   * Helper: Classify risk level
   */
  _classifyRiskLevel(score) {
    if (score >= 60) return 'High Risk';
    if (score >= 30) return 'Moderate Risk';
    if (score > 0) return 'Low Risk';
    return 'Minimal Risk';
  }

  /**
   * Helper: Generate mitigation recommendations
   */
  _generateMitigationRecommendations(risks) {
    const recommendations = [];

    const riskTypes = risks.map(r => r.type);

    if (riskTypes.includes('growth_delay')) {
      recommendations.push('Apply balanced fertilizers to boost growth');
      recommendations.push('Ensure adequate irrigation');
    }

    if (riskTypes.includes('premature_decline')) {
      recommendations.push('Investigate for pest/disease issues immediately');
      recommendations.push('Check soil moisture and nutrient levels');
    }

    if (riskTypes.includes('low_vigor')) {
      recommendations.push('Consider foliar feeding for quick nutrient uptake');
      recommendations.push('Review and optimize irrigation schedule');
    }

    if (riskTypes.includes('high_variability')) {
      recommendations.push('Implement precision agriculture techniques');
      recommendations.push('Address field heterogeneity with variable rate application');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current management practices');
      recommendations.push('Monitor regularly for any changes');
    }

    return recommendations;
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

module.exports = CropPredictionService;

