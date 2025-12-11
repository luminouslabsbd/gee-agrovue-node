/**
 * Crop Growth Tracking Service
 * Tracks crop growth stages, phenology, and development using NDVI time series
 * 
 * Features:
 * - Crop type classification (Rice, Wheat, Maize, Cotton, Soybean, etc.)
 * - Growth stage detection (Germination, Vegetative, Reproductive, Maturity, Harvest)
 * - Phenology analysis (Growing Degree Days, Crop Calendar)
 * - Growth rate calculation
 * - Crop health monitoring
 * - Integration with NDVI time series
 */

class CropGrowthTrackingService {
  constructor(ee) {
    this.ee = ee;
    this.SENTINEL2_DATASET = 'COPERNICUS/S2_SR';
    this.CLOUD_FILTER = 30;
    
    // Crop type definitions with NDVI thresholds and growth characteristics
    this.CROP_TYPES = {
      rice: {
        name: 'Rice',
        ndvi_range: { min: 0.3, max: 0.9, peak: 0.75 },
        growth_duration_days: { min: 90, max: 150 },
        stages: {
          germination: { days: 10, ndvi: 0.2 },
          tillering: { days: 30, ndvi: 0.4 },
          stem_elongation: { days: 30, ndvi: 0.6 },
          panicle_initiation: { days: 20, ndvi: 0.75 },
          flowering: { days: 15, ndvi: 0.8 },
          grain_filling: { days: 30, ndvi: 0.7 },
          maturity: { days: 15, ndvi: 0.5 }
        },
        base_temp: 10, // Base temperature for GDD calculation (°C)
        optimal_temp: 30
      },
      wheat: {
        name: 'Wheat',
        ndvi_range: { min: 0.3, max: 0.85, peak: 0.7 },
        growth_duration_days: { min: 120, max: 180 },
        stages: {
          germination: { days: 7, ndvi: 0.2 },
          tillering: { days: 40, ndvi: 0.45 },
          stem_elongation: { days: 30, ndvi: 0.65 },
          heading: { days: 15, ndvi: 0.75 },
          flowering: { days: 10, ndvi: 0.7 },
          grain_filling: { days: 35, ndvi: 0.6 },
          maturity: { days: 15, ndvi: 0.4 }
        },
        base_temp: 0,
        optimal_temp: 25
      },
      maize: {
        name: 'Maize/Corn',
        ndvi_range: { min: 0.3, max: 0.9, peak: 0.85 },
        growth_duration_days: { min: 90, max: 140 },
        stages: {
          germination: { days: 7, ndvi: 0.2 },
          vegetative: { days: 40, ndvi: 0.5 },
          rapid_growth: { days: 30, ndvi: 0.75 },
          tasseling: { days: 10, ndvi: 0.85 },
          silking: { days: 10, ndvi: 0.8 },
          grain_filling: { days: 30, ndvi: 0.7 },
          maturity: { days: 15, ndvi: 0.5 }
        },
        base_temp: 10,
        optimal_temp: 30
      },
      cotton: {
        name: 'Cotton',
        ndvi_range: { min: 0.3, max: 0.85, peak: 0.75 },
        growth_duration_days: { min: 150, max: 180 },
        stages: {
          germination: { days: 10, ndvi: 0.2 },
          seedling: { days: 20, ndvi: 0.35 },
          vegetative: { days: 50, ndvi: 0.6 },
          flowering: { days: 40, ndvi: 0.75 },
          boll_development: { days: 40, ndvi: 0.7 },
          maturity: { days: 20, ndvi: 0.5 }
        },
        base_temp: 12,
        optimal_temp: 32
      },
      soybean: {
        name: 'Soybean',
        ndvi_range: { min: 0.3, max: 0.85, peak: 0.75 },
        growth_duration_days: { min: 90, max: 150 },
        stages: {
          germination: { days: 7, ndvi: 0.2 },
          vegetative: { days: 40, ndvi: 0.5 },
          flowering: { days: 20, ndvi: 0.75 },
          pod_development: { days: 30, ndvi: 0.7 },
          seed_filling: { days: 30, ndvi: 0.65 },
          maturity: { days: 15, ndvi: 0.45 }
        },
        base_temp: 10,
        optimal_temp: 30
      }
    };
    
    // Growth stage classification based on NDVI patterns
    this.GROWTH_STAGES = {
      germination: { ndvi_range: [0, 0.3], description: 'Seed germination and emergence' },
      vegetative: { ndvi_range: [0.3, 0.6], description: 'Vegetative growth and leaf development' },
      reproductive: { ndvi_range: [0.6, 0.85], description: 'Flowering and reproductive phase' },
      maturity: { ndvi_range: [0.4, 0.6], description: 'Grain filling and maturation', declining: true },
      senescence: { ndvi_range: [0, 0.4], description: 'Crop senescence and harvest ready', declining: true }
    };
  }

  /**
   * Track crop growth for a field over time
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} cropType - Crop type (rice, wheat, maize, cotton, soybean)
   * @param {String} plantingDate - Planting date (YYYY-MM-DD)
   * @param {String} currentDate - Current date (YYYY-MM-DD) - optional
   * @returns {Promise<Object>} Crop growth tracking data
   */
  async trackCropGrowth(fieldBoundary, fieldId, cropType, plantingDate, currentDate = null) {
    try {
      console.log(`🌱 Tracking crop growth for ${cropType} in field ${fieldId}`);
      
      // Validate crop type
      if (!this.CROP_TYPES[cropType.toLowerCase()]) {
        throw new Error(`Unsupported crop type: ${cropType}. Supported: ${Object.keys(this.CROP_TYPES).join(', ')}`);
      }
      
      const crop = this.CROP_TYPES[cropType.toLowerCase()];
      const endDate = currentDate || new Date().toISOString().split('T')[0];
      
      // Calculate days since planting
      const daysSincePlanting = this._calculateDaysBetween(plantingDate, endDate);
      
      // Get NDVI time series from planting to current date
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      const ndviTimeSeries = await this._getNDVITimeSeries(geometry, plantingDate, endDate);
      
      // Detect current growth stage
      const currentStage = this._detectGrowthStage(ndviTimeSeries, crop, daysSincePlanting);
      
      // Calculate growth metrics
      const growthMetrics = this._calculateGrowthMetrics(ndviTimeSeries, crop);
      
      // Analyze phenology
      const phenology = this._analyzePhenology(ndviTimeSeries, crop, plantingDate);
      
      // Calculate growth rate
      const growthRate = this._calculateGrowthRate(ndviTimeSeries);
      
      // Detect anomalies
      const anomalies = this._detectAnomalies(ndviTimeSeries, crop);
      
      // Estimate harvest date
      const harvestEstimate = this._estimateHarvestDate(plantingDate, crop, growthMetrics);
      
      return {
        success: true,
        field_id: fieldId,
        crop_type: crop.name,
        planting_date: plantingDate,
        current_date: endDate,
        days_since_planting: daysSincePlanting,
        current_stage: currentStage,
        growth_metrics: growthMetrics,
        phenology: phenology,
        growth_rate: growthRate,
        anomalies: anomalies,
        harvest_estimate: harvestEstimate,
        ndvi_time_series: ndviTimeSeries,
        metadata: {
          data_source: 'Sentinel-2',
          spatial_resolution: '10m',
          cloud_filter: `< ${this.CLOUD_FILTER}%`,
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error tracking crop growth:', error);
      throw new Error(`Crop growth tracking failed: ${error.message}`);
    }
  }

  /**
   * Classify crop type based on NDVI pattern
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Crop classification results
   */
  async classifyCropType(fieldBoundary, fieldId, startDate, endDate) {
    try {
      console.log(`🔍 Classifying crop type for field ${fieldId}`);
      
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      const ndviTimeSeries = await this._getNDVITimeSeries(geometry, startDate, endDate);
      
      // Calculate pattern metrics for each crop type
      const cropScores = {};
      
      for (const [cropKey, crop] of Object.entries(this.CROP_TYPES)) {
        const score = this._calculateCropMatchScore(ndviTimeSeries, crop);
        cropScores[cropKey] = {
          crop_name: crop.name,
          match_score: score,
          confidence: this._calculateConfidence(score)
        };
      }
      
      // Sort by match score
      const sortedCrops = Object.entries(cropScores)
        .sort((a, b) => b[1].match_score - a[1].match_score);
      
      const topCrop = sortedCrops[0];
      
      return {
        success: true,
        field_id: fieldId,
        date_range: { start: startDate, end: endDate },
        classified_crop: {
          type: topCrop[0],
          name: topCrop[1].crop_name,
          confidence: topCrop[1].confidence,
          match_score: topCrop[1].match_score
        },
        all_scores: cropScores,
        recommendations: this._generateCropRecommendations(sortedCrops),
        metadata: {
          data_source: 'Sentinel-2',
          classification_method: 'NDVI pattern matching',
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error classifying crop type:', error);
      throw new Error(`Crop classification failed: ${error.message}`);
    }
  }

  /**
   * Get NDVI time series for a field
   */
  async _getNDVITimeSeries(geometry, startDate, endDate) {
    const dates = this._generateDateRange(startDate, endDate, 10); // 10-day intervals
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
   * Detect current growth stage
   */
  _detectGrowthStage(ndviTimeSeries, crop, daysSincePlanting) {
    if (ndviTimeSeries.length === 0) {
      return { stage: 'unknown', confidence: 'low', description: 'Insufficient data' };
    }
    
    const latestNDVI = ndviTimeSeries[ndviTimeSeries.length - 1].ndvi_mean;
    const peakNDVI = Math.max(...ndviTimeSeries.map(d => d.ndvi_mean));
    const isDeclining = this._isNDVIDeclining(ndviTimeSeries);

    // Determine stage based on NDVI value and trend
    let stage = 'unknown';
    let description = '';

    if (latestNDVI < 0.3) {
      stage = isDeclining ? 'senescence' : 'germination';
      description = isDeclining ? 'Crop senescence - harvest ready' : 'Germination and early growth';
    } else if (latestNDVI >= 0.3 && latestNDVI < 0.6) {
      stage = isDeclining ? 'maturity' : 'vegetative';
      description = isDeclining ? 'Maturity and grain filling' : 'Vegetative growth';
    } else if (latestNDVI >= 0.6) {
      stage = 'reproductive';
      description = 'Reproductive phase - flowering and peak growth';
    }
    
    // Match with crop-specific stages
    const cropStage = this._matchCropStage(crop, daysSincePlanting, latestNDVI);
    
    return {
      stage: stage,
      crop_specific_stage: cropStage.name,
      ndvi_value: latestNDVI,
      peak_ndvi: peakNDVI,
      is_declining: isDeclining,
      confidence: this._calculateStageConfidence(ndviTimeSeries),
      description: description,
      expected_ndvi: cropStage.expected_ndvi,
      days_in_stage: cropStage.days_in_stage
    };
  }

  /**
   * Calculate growth metrics
   */
  _calculateGrowthMetrics(ndviTimeSeries, crop) {
    if (ndviTimeSeries.length === 0) {
      return null;
    }
    
    const ndviValues = ndviTimeSeries.map(d => d.ndvi_mean);
    const peakNDVI = Math.max(...ndviValues);
    const currentNDVI = ndviValues[ndviValues.length - 1];
    const avgNDVI = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
    
    // Calculate vigor (how close to peak NDVI)
    const vigor = (currentNDVI / crop.ndvi_range.peak) * 100;
    
    // Calculate health score
    const healthScore = this._calculateHealthScore(currentNDVI, crop);
    
    return {
      current_ndvi: parseFloat(currentNDVI.toFixed(3)),
      peak_ndvi: parseFloat(peakNDVI.toFixed(3)),
      average_ndvi: parseFloat(avgNDVI.toFixed(3)),
      expected_peak: crop.ndvi_range.peak,
      vigor_percentage: parseFloat(vigor.toFixed(1)),
      health_score: healthScore,
      performance: this._classifyPerformance(peakNDVI, crop.ndvi_range.peak)
    };
  }

  /**
   * Analyze phenology (crop calendar and development)
   */
  _analyzePhenology(ndviTimeSeries, crop, plantingDate) {
    const totalDuration = this._calculateDaysBetween(
      plantingDate,
      ndviTimeSeries[ndviTimeSeries.length - 1]?.date || plantingDate
    );

    // Calculate expected vs actual duration
    const expectedDuration = (crop.growth_duration_days.min + crop.growth_duration_days.max) / 2;
    const progressPercentage = (totalDuration / expectedDuration) * 100;

    // Identify key phenological events
    const events = this._identifyPhenologicalEvents(ndviTimeSeries, crop);

    return {
      total_days: totalDuration,
      expected_duration_days: expectedDuration,
      progress_percentage: parseFloat(progressPercentage.toFixed(1)),
      phenological_events: events,
      crop_calendar: this._generateCropCalendar(crop, plantingDate)
    };
  }

  /**
   * Calculate growth rate
   */
  _calculateGrowthRate(ndviTimeSeries) {
    if (ndviTimeSeries.length < 2) {
      return { rate: 0, trend: 'insufficient_data' };
    }

    // Calculate rate of change (NDVI per day)
    const rates = [];
    for (let i = 1; i < ndviTimeSeries.length; i++) {
      const days = this._calculateDaysBetween(ndviTimeSeries[i - 1].date, ndviTimeSeries[i].date);
      const ndviChange = ndviTimeSeries[i].ndvi_mean - ndviTimeSeries[i - 1].ndvi_mean;
      rates.push(ndviChange / days);
    }

    const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
    const recentRate = rates.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, rates.length);

    return {
      average_rate: parseFloat(avgRate.toFixed(5)),
      recent_rate: parseFloat(recentRate.toFixed(5)),
      trend: recentRate > 0.001 ? 'increasing' : recentRate < -0.001 ? 'decreasing' : 'stable',
      interpretation: this._interpretGrowthRate(recentRate)
    };
  }

  /**
   * Detect anomalies in growth pattern
   */
  _detectAnomalies(ndviTimeSeries, crop) {
    const anomalies = [];

    for (let i = 0; i < ndviTimeSeries.length; i++) {
      const point = ndviTimeSeries[i];

      // Check for sudden drops
      if (i > 0) {
        const prevNDVI = ndviTimeSeries[i - 1].ndvi_mean;
        const drop = prevNDVI - point.ndvi_mean;

        if (drop > 0.15) {
          anomalies.push({
            date: point.date,
            type: 'sudden_drop',
            severity: drop > 0.25 ? 'severe' : 'moderate',
            ndvi_change: parseFloat(drop.toFixed(3)),
            possible_causes: ['Drought stress', 'Pest/disease', 'Nutrient deficiency', 'Flood damage']
          });
        }
      }

      // Check for abnormally low NDVI
      if (point.ndvi_mean < crop.ndvi_range.min && i > 2) {
        anomalies.push({
          date: point.date,
          type: 'low_vigor',
          severity: 'moderate',
          ndvi_value: point.ndvi_mean,
          expected_min: crop.ndvi_range.min,
          possible_causes: ['Poor crop health', 'Stress conditions', 'Inadequate growth']
        });
      }
    }

    return {
      total_anomalies: anomalies.length,
      anomalies: anomalies,
      status: anomalies.length === 0 ? 'normal' : anomalies.length < 3 ? 'minor_issues' : 'significant_issues'
    };
  }

  /**
   * Estimate harvest date
   */
  _estimateHarvestDate(plantingDate, crop, growthMetrics) {
    const avgDuration = (crop.growth_duration_days.min + crop.growth_duration_days.max) / 2;

    // Adjust based on current vigor
    let adjustedDuration = avgDuration;
    if (growthMetrics && growthMetrics.vigor_percentage) {
      if (growthMetrics.vigor_percentage > 90) {
        adjustedDuration = crop.growth_duration_days.min; // Fast growth
      } else if (growthMetrics.vigor_percentage < 70) {
        adjustedDuration = crop.growth_duration_days.max; // Slow growth
      }
    }

    const harvestDate = this._addDays(plantingDate, Math.round(adjustedDuration));
    const daysUntilHarvest = this._calculateDaysBetween(new Date().toISOString().split('T')[0], harvestDate);

    return {
      estimated_harvest_date: harvestDate,
      days_until_harvest: daysUntilHarvest,
      confidence: growthMetrics ? 'medium' : 'low',
      duration_range: {
        min_days: crop.growth_duration_days.min,
        max_days: crop.growth_duration_days.max,
        estimated_days: Math.round(adjustedDuration)
      }
    };
  }

  /**
   * Helper: Calculate crop match score for classification
   */
  _calculateCropMatchScore(ndviTimeSeries, crop) {
    if (ndviTimeSeries.length === 0) return 0;

    const ndviValues = ndviTimeSeries.map(d => d.ndvi_mean);
    const peakNDVI = Math.max(...ndviValues);
    const avgNDVI = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;

    // Score based on peak NDVI match
    const peakScore = 1 - Math.abs(peakNDVI - crop.ndvi_range.peak) / crop.ndvi_range.peak;

    // Score based on average NDVI in range
    const avgExpected = (crop.ndvi_range.min + crop.ndvi_range.max) / 2;
    const avgScore = 1 - Math.abs(avgNDVI - avgExpected) / avgExpected;

    // Combined score
    return parseFloat(((peakScore * 0.6 + avgScore * 0.4) * 100).toFixed(1));
  }

  /**
   * Helper: Match crop-specific stage
   */
  _matchCropStage(crop, daysSincePlanting, currentNDVI) {
    let cumulativeDays = 0;

    for (const [stageName, stageInfo] of Object.entries(crop.stages)) {
      cumulativeDays += stageInfo.days;

      if (daysSincePlanting <= cumulativeDays) {
        return {
          name: stageName.replace(/_/g, ' '),
          expected_ndvi: stageInfo.ndvi,
          days_in_stage: Math.min(daysSincePlanting - (cumulativeDays - stageInfo.days), stageInfo.days)
        };
      }
    }

    return {
      name: 'post-maturity',
      expected_ndvi: 0.3,
      days_in_stage: daysSincePlanting - cumulativeDays
    };
  }

  /**
   * Helper: Identify phenological events
   */
  _identifyPhenologicalEvents(ndviTimeSeries, crop) {
    const events = [];

    // Find emergence (first NDVI > 0.2)
    const emergencePoint = ndviTimeSeries.find(d => d.ndvi_mean > 0.2);
    if (emergencePoint) {
      events.push({ event: 'Emergence', date: emergencePoint.date, ndvi: emergencePoint.ndvi_mean });
    }

    // Find peak vegetation (max NDVI)
    const peakPoint = ndviTimeSeries.reduce((max, d) => d.ndvi_mean > max.ndvi_mean ? d : max, ndviTimeSeries[0]);
    if (peakPoint) {
      events.push({ event: 'Peak Vegetation', date: peakPoint.date, ndvi: peakPoint.ndvi_mean });
    }

    // Find senescence start (NDVI starts declining from peak)
    const peakIndex = ndviTimeSeries.indexOf(peakPoint);
    if (peakIndex < ndviTimeSeries.length - 2) {
      const senescencePoint = ndviTimeSeries[peakIndex + 1];
      events.push({ event: 'Senescence Start', date: senescencePoint.date, ndvi: senescencePoint.ndvi_mean });
    }

    return events;
  }

  /**
   * Helper: Generate crop calendar
   */
  _generateCropCalendar(crop, plantingDate) {
    const calendar = [];
    let cumulativeDays = 0;

    for (const [stageName, stageInfo] of Object.entries(crop.stages)) {
      const stageStart = this._addDays(plantingDate, cumulativeDays);
      cumulativeDays += stageInfo.days;
      const stageEnd = this._addDays(plantingDate, cumulativeDays);

      calendar.push({
        stage: stageName.replace(/_/g, ' '),
        start_date: stageStart,
        end_date: stageEnd,
        duration_days: stageInfo.days,
        expected_ndvi: stageInfo.ndvi
      });
    }

    return calendar;
  }

  /**
   * Helper: Check if NDVI is declining
   */
  _isNDVIDeclining(ndviTimeSeries) {
    if (ndviTimeSeries.length < 3) return false;

    const recent = ndviTimeSeries.slice(-3);
    return recent[2].ndvi_mean < recent[1].ndvi_mean && recent[1].ndvi_mean < recent[0].ndvi_mean;
  }

  /**
   * Helper: Calculate health score
   */
  _calculateHealthScore(ndvi, crop) {
    const ratio = ndvi / crop.ndvi_range.peak;
    const score = Math.min(100, ratio * 100);

    let status = 'Poor';
    if (score >= 80) status = 'Excellent';
    else if (score >= 60) status = 'Good';
    else if (score >= 40) status = 'Fair';

    return {
      score: parseFloat(score.toFixed(1)),
      status: status
    };
  }

  /**
   * Helper: Classify performance
   */
  _classifyPerformance(peakNDVI, expectedPeak) {
    const ratio = peakNDVI / expectedPeak;

    if (ratio >= 0.95) return 'Excellent - Above expected';
    if (ratio >= 0.85) return 'Good - Meeting expectations';
    if (ratio >= 0.70) return 'Fair - Below expectations';
    return 'Poor - Significantly below expectations';
  }

  /**
   * Helper: Interpret growth rate
   */
  _interpretGrowthRate(rate) {
    if (rate > 0.005) return 'Rapid growth - healthy development';
    if (rate > 0.001) return 'Normal growth - on track';
    if (rate > -0.001) return 'Stable - minimal change';
    if (rate > -0.005) return 'Declining - approaching maturity or stress';
    return 'Rapid decline - senescence or severe stress';
  }

  /**
   * Helper: Calculate stage confidence
   */
  _calculateStageConfidence(ndviTimeSeries) {
    if (ndviTimeSeries.length < 3) return 'low';
    if (ndviTimeSeries.length < 6) return 'medium';
    return 'high';
  }

  /**
   * Helper: Calculate confidence for classification
   */
  _calculateConfidence(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  /**
   * Helper: Generate crop recommendations
   */
  _generateCropRecommendations(sortedCrops) {
    const recommendations = [];
    const topScore = sortedCrops[0][1].match_score;

    if (topScore < 60) {
      recommendations.push('Low confidence in classification - consider longer observation period');
    }

    if (sortedCrops.length > 1 && sortedCrops[1][1].match_score > topScore * 0.8) {
      recommendations.push(`Alternative crop possibility: ${sortedCrops[1][1].crop_name}`);
    }

    return recommendations.length > 0 ? recommendations : ['Classification confidence is good'];
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

module.exports = CropGrowthTrackingService;

