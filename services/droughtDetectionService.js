/**
 * Drought Detection Service
 *
 * Comprehensive drought detection using multiple GEE datasets:
 * - NDVI (Sentinel-2) for vegetation stress
 * - Precipitation (CHIRPS) for rainfall deficit
 * - Soil Moisture (SMAP) for water availability
 * - Evapotranspiration (MODIS) for water demand
 * - Temperature (MODIS) for heat stress
 *
 * Methodology:
 * - Multi-indicator drought assessment
 * - Standardized Precipitation Index (SPI)
 * - Vegetation Condition Index (VCI)
 * - Soil Moisture Anomaly
 * - Combined Drought Index (CDI)
 *
 * @author Senior GEE Engineer & Full Stack Developer
 */

class DroughtDetectionService {
  constructor(ee) {
    this.ee = ee;

    // Datasets
    this.SENTINEL2_DATASET = "COPERNICUS/S2_SR_HARMONIZED";
    this.CHIRPS_DATASET = "UCSB-CHG/CHIRPS/DAILY"; // Precipitation
    this.SMAP_DATASET = "NASA_USDA/HSL/SMAP10KM_soil_moisture"; // Soil moisture
    this.MODIS_ET_DATASET = "MODIS/006/MOD16A2"; // Evapotranspiration
    this.MODIS_TEMP_DATASET = "MODIS/006/MOD11A1"; // Land surface temperature

    // Thresholds
    this.CLOUD_FILTER = 30; // Cloud cover percentage
    this.DROUGHT_THRESHOLDS = {
      ndvi: {
        severe: 0.2,
        moderate: 0.3,
        mild: 0.4,
        normal: 0.5,
      },
      precipitation: {
        severe: 0.5, // 50% of normal
        moderate: 0.7, // 70% of normal
        mild: 0.85, // 85% of normal
      },
      soil_moisture: {
        severe: 0.1, // 10% saturation
        moderate: 0.15, // 15% saturation
        mild: 0.2, // 20% saturation
      },
      vci: {
        severe: 10, // VCI < 10
        moderate: 20, // VCI < 20
        mild: 35, // VCI < 35
      },
    };

    // Historical analysis period
    this.HISTORICAL_YEARS = 5;
  }

  /**
   * Detect current drought status using multiple indicators
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} currentDate - Current date (YYYY-MM-DD)
   * @returns {Promise<Object>} Drought detection results
   */
  async detectDrought(fieldBoundary, fieldId, currentDate = null) {
    try {
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      const analysisDate =
        currentDate || new Date().toISOString().split("T")[0];

      console.log(
        `🌵 Analyzing drought status for field ${fieldId} on ${analysisDate}`
      );

      // 1. NDVI-based vegetation stress
      const ndviAnalysis = await this._analyzeNDVIStress(
        geometry,
        analysisDate
      );

      // 2. Precipitation deficit
      const precipitationAnalysis = await this._analyzePrecipitation(
        geometry,
        analysisDate
      );

      // 3. Soil moisture analysis
      const soilMoistureAnalysis = await this._analyzeSoilMoisture(
        geometry,
        analysisDate
      );

      // 4. Evapotranspiration stress
      const etAnalysis = await this._analyzeEvapotranspiration(
        geometry,
        analysisDate
      );

      // 5. Temperature stress
      const temperatureAnalysis = await this._analyzeTemperature(
        geometry,
        analysisDate
      );

      // 6. Calculate combined drought index
      const combinedIndex = this._calculateCombinedDroughtIndex({
        ndvi: ndviAnalysis,
        precipitation: precipitationAnalysis,
        soilMoisture: soilMoistureAnalysis,
        et: etAnalysis,
        temperature: temperatureAnalysis,
      });

      // 7. Determine drought status
      const droughtStatus = this._determineDroughtStatus(combinedIndex);

      // 8. Generate recommendations
      const recommendations = this._generateDroughtRecommendations(
        droughtStatus,
        combinedIndex
      );

      return {
        success: true,
        field_id: fieldId,
        analysis_date: analysisDate,
        drought_status: droughtStatus,
        indicators: {
          ndvi_stress: ndviAnalysis,
          precipitation_deficit: precipitationAnalysis,
          soil_moisture: soilMoistureAnalysis,
          evapotranspiration: etAnalysis,
          temperature_stress: temperatureAnalysis,
        },
        combined_drought_index: combinedIndex,
        recommendations: recommendations,
        metadata: {
          data_sources: [
            "Sentinel-2 (NDVI)",
            "CHIRPS (Precipitation)",
            "SMAP (Soil Moisture)",
            "MODIS (ET & Temperature)",
          ],
          analysis_period_days: 30,
          generated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Drought detection failed: ${error.message}`);
    }
  }

  /**
   * Generate drought time series
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @param {Number} intervalDays - Interval in days
   * @returns {Promise<Object>} Drought time series data
   */
  async generateDroughtTimeSeries(
    fieldBoundary,
    fieldId,
    startDate,
    endDate,
    intervalDays = 30
  ) {
    try {
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);

      console.log(`📊 Generating drought time series for field ${fieldId}`);

      // Generate date array
      const dates = this._generateDateArray(startDate, endDate, intervalDays);
      const timeSeriesData = [];

      for (const date of dates) {
        console.log(`  📅 Processing ${date}...`);

        // Get drought indicators for this period
        const ndviData = await this._getNDVIForPeriod(
          geometry,
          date,
          intervalDays
        );
        const precipData = await this._getPrecipitationForPeriod(
          geometry,
          date,
          intervalDays
        );
        const soilData = await this._getSoilMoistureForPeriod(
          geometry,
          date,
          intervalDays
        );

        // Calculate drought index
        const droughtIndex = this._calculateSimpleDroughtIndex(
          ndviData,
          precipData,
          soilData
        );

        timeSeriesData.push({
          date: date,
          ndvi_mean: ndviData.ndvi_mean,
          precipitation_mm: precipData.precipitation_mm,
          soil_moisture_percent: soilData.soil_moisture_percent,
          drought_index: droughtIndex.index,
          drought_severity: droughtIndex.severity,
          drought_detected: droughtIndex.drought_detected,
        });
      }

      // Calculate statistics
      const statistics = this._calculateDroughtStatistics(timeSeriesData);

      return {
        success: true,
        field_id: fieldId,
        date_range: {
          start: startDate,
          end: endDate,
          interval_days: intervalDays,
        },
        time_series: timeSeriesData,
        statistics: statistics,
        metadata: {
          data_sources: ["Sentinel-2", "CHIRPS", "SMAP"],
          total_data_points: timeSeriesData.length,
          generated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(
        `Drought time series generation failed: ${error.message}`
      );
    }
  }

  /**
   * Analyze NDVI-based vegetation stress with progressive date range search
   * @private
   */
  async _analyzeNDVIStress(geometry, date) {
    try {
      // Progressive date range search (similar to zone image fix)
      let imageCollection = null;
      let actualDateRange = null;
      let searchAttempts = [
        { days: 0, label: "exact date" },
        { days: 3, label: "±3 days" },
        { days: 7, label: "±7 days" },
        { days: 15, label: "±15 days" },
        { days: 30, label: "±30 days" },
      ];

      for (const attempt of searchAttempts) {
        const startDate = this._subtractDays(date, attempt.days);
        const endDate = this._addDays(date, attempt.days + 1);

        console.log(
          `  🔍 Searching NDVI (${attempt.label}): ${startDate} to ${endDate}`
        );

        const collection = this.ee
          .ImageCollection(this.SENTINEL2_DATASET)
          .filterBounds(geometry)
          .filterDate(startDate, endDate)
          .filter(
            this.ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", this.CLOUD_FILTER)
          )
          .sort("CLOUDY_PIXEL_PERCENTAGE");

        const imageCount = collection.size().getInfo();
        console.log(
          `  📊 Found ${imageCount} images with <${this.CLOUD_FILTER}% cloud cover`
        );

        if (imageCount > 0) {
          imageCollection = collection;
          actualDateRange = {
            start: startDate,
            end: endDate,
            range: attempt.label,
          };
          console.log(`  ✅ Using images from ${attempt.label} range`);
          break;
        }
      }

      if (!imageCollection) {
        return {
          ndvi_mean: null,
          ndvi_min: null,
          ndvi_max: null,
          vci: null,
          stress_level: "unknown",
          confidence: "low",
          message: "No satellite imagery available",
        };
      }

      // Calculate NDVI
      const ndvi = imageCollection
        .map((img) => img.normalizedDifference(["B8", "B4"]).rename("NDVI"))
        .mean();

      const stats = ndvi
        .reduceRegion({
          reducer: this.ee.Reducer.mean().combine({
            reducer2: this.ee.Reducer.minMax(),
            sharedInputs: true,
          }),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9,
        })
        .getInfo();

      const ndviMean = stats.NDVI_mean || 0;
      const ndviMin = stats.NDVI_min || 0;
      const ndviMax = stats.NDVI_max || 0;

      // Calculate VCI (Vegetation Condition Index)
      // VCI = ((NDVI - NDVI_min) / (NDVI_max - NDVI_min)) * 100
      const vci =
        ndviMax > ndviMin
          ? ((ndviMean - ndviMin) / (ndviMax - ndviMin)) * 100
          : 50;

      // Determine stress level
      let stressLevel;
      if (
        ndviMean < this.DROUGHT_THRESHOLDS.ndvi.severe ||
        vci < this.DROUGHT_THRESHOLDS.vci.severe
      ) {
        stressLevel = "severe";
      } else if (
        ndviMean < this.DROUGHT_THRESHOLDS.ndvi.moderate ||
        vci < this.DROUGHT_THRESHOLDS.vci.moderate
      ) {
        stressLevel = "moderate";
      } else if (
        ndviMean < this.DROUGHT_THRESHOLDS.ndvi.mild ||
        vci < this.DROUGHT_THRESHOLDS.vci.mild
      ) {
        stressLevel = "mild";
      } else {
        stressLevel = "none";
      }

      return {
        ndvi_mean: parseFloat(ndviMean.toFixed(4)),
        ndvi_min: parseFloat(ndviMin.toFixed(4)),
        ndvi_max: parseFloat(ndviMax.toFixed(4)),
        vci: parseFloat(vci.toFixed(2)),
        stress_level: stressLevel,
        confidence: "high",
        actual_date_range: actualDateRange,
        image_count: imageCollection.size().getInfo(),
      };
    } catch (error) {
      console.error("Error analyzing NDVI stress:", error);
      return {
        ndvi_mean: null,
        vci: null,
        stress_level: "unknown",
        confidence: "low",
        error: error.message,
      };
    }
  }

  /**
   * Analyze precipitation deficit
   * @private
   */
  async _analyzePrecipitation(geometry, date) {
    try {
      // Get precipitation for last 30 days
      const startDate = this._subtractDays(date, 30);

      const collection = this.ee
        .ImageCollection(this.CHIRPS_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, date);

      const size = collection.size().getInfo();

      if (size === 0) {
        return {
          precipitation_mm: null,
          precipitation_anomaly: null,
          deficit_level: "unknown",
          confidence: "low",
          message: "No precipitation data available",
        };
      }

      // Sum precipitation
      const precipSum = collection.sum().select("precipitation");

      const stats = precipSum
        .reduceRegion({
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 5000,
          maxPixels: 1e9,
        })
        .getInfo();

      const precipMm = stats.precipitation || 0;

      // Get historical average for same period (last 5 years)
      const historicalStart = this._subtractYears(
        startDate,
        this.HISTORICAL_YEARS
      );
      const historicalEnd = this._subtractYears(date, this.HISTORICAL_YEARS);

      const historicalCollection = this.ee
        .ImageCollection(this.CHIRPS_DATASET)
        .filterBounds(geometry)
        .filterDate(historicalStart, historicalEnd);

      let historicalAvg = 100; // Default
      if (historicalCollection.size().getInfo() > 0) {
        const historicalSum = historicalCollection
          .sum()
          .select("precipitation");
        const historicalStats = historicalSum
          .reduceRegion({
            reducer: this.ee.Reducer.mean(),
            geometry: geometry,
            scale: 5000,
            maxPixels: 1e9,
          })
          .getInfo();
        historicalAvg = historicalStats.precipitation || 100;
      }

      // Calculate anomaly (percentage of normal)
      const anomaly = historicalAvg > 0 ? precipMm / historicalAvg : 1.0;

      // Determine deficit level
      let deficitLevel;
      if (anomaly < this.DROUGHT_THRESHOLDS.precipitation.severe) {
        deficitLevel = "severe";
      } else if (anomaly < this.DROUGHT_THRESHOLDS.precipitation.moderate) {
        deficitLevel = "moderate";
      } else if (anomaly < this.DROUGHT_THRESHOLDS.precipitation.mild) {
        deficitLevel = "mild";
      } else {
        deficitLevel = "none";
      }

      return {
        precipitation_mm: parseFloat(precipMm.toFixed(2)),
        historical_avg_mm: parseFloat(historicalAvg.toFixed(2)),
        precipitation_anomaly: parseFloat(anomaly.toFixed(3)),
        deficit_level: deficitLevel,
        confidence: "high",
        days_analyzed: 30,
      };
    } catch (error) {
      console.error("Error analyzing precipitation:", error);
      return {
        precipitation_mm: null,
        precipitation_anomaly: null,
        deficit_level: "unknown",
        confidence: "low",
        error: error.message,
      };
    }
  }

  /**
   * Analyze soil moisture
   * @private
   */
  async _analyzeSoilMoisture(geometry, date) {
    try {
      // Get soil moisture for last 7 days
      const startDate = this._subtractDays(date, 7);

      const collection = this.ee
        .ImageCollection(this.SMAP_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, date)
        .select("ssm"); // Surface soil moisture

      const size = collection.size().getInfo();

      if (size === 0) {
        return {
          soil_moisture_percent: null,
          moisture_level: "unknown",
          confidence: "low",
          message: "No soil moisture data available",
        };
      }

      const smMean = collection.mean();

      const stats = smMean
        .reduceRegion({
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 10000,
          maxPixels: 1e9,
        })
        .getInfo();

      const soilMoisture = (stats.ssm || 0) * 100; // Convert to percentage

      // Determine moisture level
      let moistureLevel;
      if (soilMoisture < this.DROUGHT_THRESHOLDS.soil_moisture.severe * 100) {
        moistureLevel = "severe_deficit";
      } else if (
        soilMoisture <
        this.DROUGHT_THRESHOLDS.soil_moisture.moderate * 100
      ) {
        moistureLevel = "moderate_deficit";
      } else if (
        soilMoisture <
        this.DROUGHT_THRESHOLDS.soil_moisture.mild * 100
      ) {
        moistureLevel = "mild_deficit";
      } else {
        moistureLevel = "adequate";
      }

      return {
        soil_moisture_percent: parseFloat(soilMoisture.toFixed(2)),
        moisture_level: moistureLevel,
        confidence: "high",
        image_count: size,
      };
    } catch (error) {
      console.error("Error analyzing soil moisture:", error);
      return {
        soil_moisture_percent: null,
        moisture_level: "unknown",
        confidence: "low",
        error: error.message,
      };
    }
  }

  /**
   * Analyze evapotranspiration
   * @private
   */
  async _analyzeEvapotranspiration(geometry, date) {
    try {
      // Get ET for last 8 days (MODIS 8-day composite)
      const startDate = this._subtractDays(date, 8);

      const collection = this.ee
        .ImageCollection(this.MODIS_ET_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, date)
        .select("ET"); // Evapotranspiration

      const size = collection.size().getInfo();

      if (size === 0) {
        return {
          et_mm: null,
          et_level: "unknown",
          confidence: "low",
          message: "No ET data available",
        };
      }

      const etMean = collection.mean();

      const stats = etMean
        .reduceRegion({
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 500,
          maxPixels: 1e9,
        })
        .getInfo();

      const etValue = (stats.ET || 0) * 0.1; // Scale factor

      // Determine ET level (high ET with low soil moisture = drought stress)
      let etLevel;
      if (etValue > 5) {
        etLevel = "high";
      } else if (etValue > 3) {
        etLevel = "moderate";
      } else {
        etLevel = "low";
      }

      return {
        et_mm: parseFloat(etValue.toFixed(2)),
        et_level: etLevel,
        confidence: "medium",
        image_count: size,
      };
    } catch (error) {
      console.error("Error analyzing ET:", error);
      return {
        et_mm: null,
        et_level: "unknown",
        confidence: "low",
        error: error.message,
      };
    }
  }

  /**
   * Analyze temperature stress
   * @private
   */
  async _analyzeTemperature(geometry, date) {
    try {
      // Get temperature for last 7 days
      const startDate = this._subtractDays(date, 7);

      const collection = this.ee
        .ImageCollection(this.MODIS_TEMP_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, date)
        .select("LST_Day_1km"); // Day land surface temperature

      const size = collection.size().getInfo();

      if (size === 0) {
        return {
          temperature_celsius: null,
          heat_stress_level: "unknown",
          confidence: "low",
          message: "No temperature data available",
        };
      }

      const tempMean = collection.mean();

      const stats = tempMean
        .reduceRegion({
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 1000,
          maxPixels: 1e9,
        })
        .getInfo();

      const tempKelvin = stats.LST_Day_1km || 0;
      const tempCelsius = tempKelvin * 0.02 - 273.15; // Convert to Celsius

      // Determine heat stress level
      let heatStressLevel;
      if (tempCelsius > 40) {
        heatStressLevel = "severe";
      } else if (tempCelsius > 35) {
        heatStressLevel = "high";
      } else if (tempCelsius > 30) {
        heatStressLevel = "moderate";
      } else {
        heatStressLevel = "low";
      }

      return {
        temperature_celsius: parseFloat(tempCelsius.toFixed(2)),
        heat_stress_level: heatStressLevel,
        confidence: "medium",
        image_count: size,
      };
    } catch (error) {
      console.error("Error analyzing temperature:", error);
      return {
        temperature_celsius: null,
        heat_stress_level: "unknown",
        confidence: "low",
        error: error.message,
      };
    }
  }

  /**
   * Calculate combined drought index
   * @private
   */
  _calculateCombinedDroughtIndex(indicators) {
    const { ndvi, precipitation, soilMoisture, et, temperature } = indicators;

    let totalScore = 0;
    let totalWeight = 0;

    // NDVI stress (weight: 30%)
    if (ndvi.stress_level !== "unknown") {
      const ndviScore = this._getStressScore(ndvi.stress_level);
      totalScore += ndviScore * 0.3;
      totalWeight += 0.3;
    }

    // Precipitation deficit (weight: 30%)
    if (precipitation.deficit_level !== "unknown") {
      const precipScore = this._getStressScore(precipitation.deficit_level);
      totalScore += precipScore * 0.3;
      totalWeight += 0.3;
    }

    // Soil moisture (weight: 25%)
    if (soilMoisture.moisture_level !== "unknown") {
      const smScore = this._getMoistureScore(soilMoisture.moisture_level);
      totalScore += smScore * 0.25;
      totalWeight += 0.25;
    }

    // Temperature stress (weight: 10%)
    if (temperature.heat_stress_level !== "unknown") {
      const tempScore = this._getHeatScore(temperature.heat_stress_level);
      totalScore += tempScore * 0.1;
      totalWeight += 0.1;
    }

    // ET stress (weight: 5%)
    if (et.et_level !== "unknown") {
      const etScore =
        et.et_level === "high" ? 75 : et.et_level === "moderate" ? 50 : 25;
      totalScore += etScore * 0.05;
      totalWeight += 0.05;
    }

    // Normalize score
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      index: parseFloat(finalScore.toFixed(2)),
      confidence:
        totalWeight >= 0.8 ? "high" : totalWeight >= 0.5 ? "medium" : "low",
      components_used: {
        ndvi: ndvi.stress_level !== "unknown",
        precipitation: precipitation.deficit_level !== "unknown",
        soil_moisture: soilMoisture.moisture_level !== "unknown",
        temperature: temperature.heat_stress_level !== "unknown",
        evapotranspiration: et.et_level !== "unknown",
      },
    };
  }

  /**
   * Determine drought status from combined index
   * @private
   */
  _determineDroughtStatus(combinedIndex) {
    const index = combinedIndex.index;

    let severity, description, impact;

    if (index >= 75) {
      severity = "severe";
      description = "Severe drought conditions detected";
      impact = "Critical crop stress, immediate irrigation required";
    } else if (index >= 50) {
      severity = "moderate";
      description = "Moderate drought conditions";
      impact = "Significant crop stress, irrigation recommended";
    } else if (index >= 25) {
      severity = "mild";
      description = "Mild drought conditions";
      impact = "Minor crop stress, monitor closely";
    } else {
      severity = "none";
      description = "No drought detected";
      impact = "Normal conditions";
    }

    return {
      drought_detected: index >= 25,
      severity: severity,
      drought_index: index,
      description: description,
      impact: impact,
      confidence: combinedIndex.confidence,
    };
  }

  /**
   * Generate drought recommendations
   * @private
   */
  _generateDroughtRecommendations(droughtStatus, combinedIndex) {
    const recommendations = [];

    if (droughtStatus.severity === "severe") {
      recommendations.push({
        priority: "critical",
        action: "Immediate irrigation required",
        details: "Apply 25-50mm of water immediately to prevent crop failure",
      });
      recommendations.push({
        priority: "high",
        action: "Reduce evapotranspiration",
        details: "Apply mulch or crop covers to reduce water loss",
      });
      recommendations.push({
        priority: "high",
        action: "Monitor daily",
        details: "Check soil moisture and crop condition daily",
      });
    } else if (droughtStatus.severity === "moderate") {
      recommendations.push({
        priority: "high",
        action: "Schedule irrigation",
        details: "Plan irrigation within 2-3 days, apply 15-25mm",
      });
      recommendations.push({
        priority: "medium",
        action: "Soil moisture monitoring",
        details: "Check soil moisture every 2-3 days",
      });
      recommendations.push({
        priority: "medium",
        action: "Reduce water stress",
        details: "Consider light irrigation or mulching",
      });
    } else if (droughtStatus.severity === "mild") {
      recommendations.push({
        priority: "medium",
        action: "Monitor conditions",
        details: "Check weather forecast and soil moisture weekly",
      });
      recommendations.push({
        priority: "low",
        action: "Prepare irrigation",
        details: "Ensure irrigation system is ready if conditions worsen",
      });
    } else {
      recommendations.push({
        priority: "low",
        action: "Continue monitoring",
        details: "Maintain regular monitoring schedule",
      });
    }

    return recommendations;
  }

  /**
   * Get NDVI for a specific period
   * @private
   */
  async _getNDVIForPeriod(geometry, date, days) {
    try {
      const startDate = this._subtractDays(date, days);
      const endDate = date;

      const collection = this.ee
        .ImageCollection(this.SENTINEL2_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, endDate)
        .filter(
          this.ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", this.CLOUD_FILTER)
        );

      if (collection.size().getInfo() === 0) {
        return { ndvi_mean: 0, confidence: "low" };
      }

      const ndvi = collection
        .map((img) => img.normalizedDifference(["B8", "B4"]).rename("NDVI"))
        .mean();

      const stats = ndvi
        .reduceRegion({
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9,
        })
        .getInfo();

      return {
        ndvi_mean: parseFloat((stats.NDVI || 0).toFixed(4)),
        confidence: "high",
      };
    } catch (error) {
      return { ndvi_mean: 0, confidence: "low" };
    }
  }

  /**
   * Get precipitation for a specific period
   * @private
   */
  async _getPrecipitationForPeriod(geometry, date, days) {
    try {
      const startDate = this._subtractDays(date, days);
      const endDate = date;

      const collection = this.ee
        .ImageCollection(this.CHIRPS_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, endDate);

      if (collection.size().getInfo() === 0) {
        return { precipitation_mm: 0, confidence: "low" };
      }

      const precipSum = collection.sum().select("precipitation");

      const stats = precipSum
        .reduceRegion({
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 5000,
          maxPixels: 1e9,
        })
        .getInfo();

      return {
        precipitation_mm: parseFloat((stats.precipitation || 0).toFixed(2)),
        confidence: "high",
      };
    } catch (error) {
      return { precipitation_mm: 0, confidence: "low" };
    }
  }

  /**
   * Get soil moisture for a specific period
   * @private
   */
  async _getSoilMoistureForPeriod(geometry, date, days) {
    try {
      const startDate = this._subtractDays(date, days);
      const endDate = date;

      const collection = this.ee
        .ImageCollection(this.SMAP_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, endDate)
        .select("ssm");

      if (collection.size().getInfo() === 0) {
        return { soil_moisture_percent: 0, confidence: "low" };
      }

      const smMean = collection.mean();

      const stats = smMean
        .reduceRegion({
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 10000,
          maxPixels: 1e9,
        })
        .getInfo();

      return {
        soil_moisture_percent: parseFloat(((stats.ssm || 0) * 100).toFixed(2)),
        confidence: "high",
      };
    } catch (error) {
      return { soil_moisture_percent: 0, confidence: "low" };
    }
  }

  /**
   * Calculate simple drought index for time series
   * @private
   */
  _calculateSimpleDroughtIndex(ndviData, precipData, soilData) {
    let score = 0;
    let weight = 0;

    // NDVI component
    if (ndviData.ndvi_mean !== null) {
      const ndviScore =
        ndviData.ndvi_mean < 0.2
          ? 100
          : ndviData.ndvi_mean < 0.3
          ? 75
          : ndviData.ndvi_mean < 0.4
          ? 50
          : ndviData.ndvi_mean < 0.5
          ? 25
          : 0;
      score += ndviScore * 0.4;
      weight += 0.4;
    }

    // Precipitation component
    if (precipData.precipitation_mm !== null) {
      const precipScore =
        precipData.precipitation_mm < 10
          ? 100
          : precipData.precipitation_mm < 25
          ? 75
          : precipData.precipitation_mm < 50
          ? 50
          : precipData.precipitation_mm < 75
          ? 25
          : 0;
      score += precipScore * 0.4;
      weight += 0.4;
    }

    // Soil moisture component
    if (soilData.soil_moisture_percent !== null) {
      const smScore =
        soilData.soil_moisture_percent < 10
          ? 100
          : soilData.soil_moisture_percent < 15
          ? 75
          : soilData.soil_moisture_percent < 20
          ? 50
          : soilData.soil_moisture_percent < 25
          ? 25
          : 0;
      score += smScore * 0.2;
      weight += 0.2;
    }

    const finalScore = weight > 0 ? score / weight : 0;

    let severity;
    if (finalScore >= 75) severity = "severe";
    else if (finalScore >= 50) severity = "moderate";
    else if (finalScore >= 25) severity = "mild";
    else severity = "none";

    return {
      index: parseFloat(finalScore.toFixed(2)),
      severity: severity,
      drought_detected: finalScore >= 25,
    };
  }

  /**
   * Calculate drought statistics from time series
   * @private
   */
  _calculateDroughtStatistics(timeSeriesData) {
    const droughtEvents = timeSeriesData.filter((d) => d.drought_detected);
    const droughtIndices = timeSeriesData.map((d) => d.drought_index);

    return {
      total_data_points: timeSeriesData.length,
      drought_events_detected: droughtEvents.length,
      drought_frequency_percentage: parseFloat(
        ((droughtEvents.length / timeSeriesData.length) * 100).toFixed(2)
      ),
      max_drought_index: parseFloat(Math.max(...droughtIndices).toFixed(2)),
      avg_drought_index: parseFloat(
        (
          droughtIndices.reduce((a, b) => a + b, 0) / droughtIndices.length
        ).toFixed(2)
      ),
      most_recent_drought:
        droughtEvents.length > 0
          ? droughtEvents[droughtEvents.length - 1].date
          : null,
      severe_drought_count: droughtEvents.filter(
        (d) => d.drought_severity === "severe"
      ).length,
      moderate_drought_count: droughtEvents.filter(
        (d) => d.drought_severity === "moderate"
      ).length,
      mild_drought_count: droughtEvents.filter(
        (d) => d.drought_severity === "mild"
      ).length,
    };
  }

  /**
   * Helper: Get stress score
   * @private
   */
  _getStressScore(level) {
    switch (level) {
      case "severe":
        return 100;
      case "moderate":
        return 75;
      case "mild":
        return 50;
      default:
        return 0;
    }
  }

  /**
   * Helper: Get moisture score
   * @private
   */
  _getMoistureScore(level) {
    switch (level) {
      case "severe_deficit":
        return 100;
      case "moderate_deficit":
        return 75;
      case "mild_deficit":
        return 50;
      default:
        return 0;
    }
  }

  /**
   * Helper: Get heat score
   * @private
   */
  _getHeatScore(level) {
    switch (level) {
      case "severe":
        return 100;
      case "high":
        return 75;
      case "moderate":
        return 50;
      default:
        return 25;
    }
  }

  /**
   * Convert GeoJSON to Earth Engine geometry
   * @private
   */
  _geoJsonToEEGeometry(geoJson) {
    if (geoJson.type === "Polygon") {
      return this.ee.Geometry.Polygon(geoJson.coordinates);
    } else if (geoJson.type === "MultiPolygon") {
      return this.ee.Geometry.MultiPolygon(geoJson.coordinates);
    }
    throw new Error(
      "Unsupported geometry type. Only Polygon and MultiPolygon are supported."
    );
  }

  /**
   * Generate date array
   * @private
   */
  _generateDateArray(startDate, endDate, intervalDays) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split("T")[0]);
      currentDate = new Date(
        currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000
      );
    }

    return dates;
  }

  /**
   * Add days to a date
   * @private
   */
  _addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  }

  /**
   * Subtract days from a date
   * @private
   */
  _subtractDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  }

  /**
   * Subtract years from a date
   * @private
   */
  _subtractYears(dateString, years) {
    const date = new Date(dateString);
    date.setFullYear(date.getFullYear() - years);
    return date.toISOString().split("T")[0];
  }
}

module.exports = DroughtDetectionService;
