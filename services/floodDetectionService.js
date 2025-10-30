/**
 * Flood Detection Service
 *
 * Detects floods and water extent changes using Sentinel-1 SAR imagery
 * Provides historical flood analysis and current flood status
 *
 * Methodology:
 * - Uses Sentinel-1 C-band SAR (VV and VH polarization)
 * - Water detection via backscatter threshold analysis
 * - Change detection for flood identification
 * - Historical flood event tracking
 *
 * @author Senior GEE Engineer
 */

class FloodDetectionService {
  constructor(ee) {
    this.ee = ee;

    // Sentinel-1 SAR dataset
    this.SENTINEL1_DATASET = "COPERNICUS/S1_GRD";

    // Water detection thresholds (dB)
    this.WATER_THRESHOLD_VV = -18; // VV polarization threshold
    this.WATER_THRESHOLD_VH = -25; // VH polarization threshold

    // Flood detection parameters
    this.FLOOD_CHANGE_THRESHOLD = 3; // dB change threshold for flood detection
    this.MIN_FLOOD_AREA_HECTARES = 0.01; // Minimum flood area to report (100 m²)

    // Historical analysis period
    this.HISTORICAL_YEARS = 5; // Look back 5 years for flood history
  }

  /**
   * Detect current flood status and historical floods for a field
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} currentDate - Current date (YYYY-MM-DD)
   * @returns {Promise<Object>} Flood detection results
   */
  async detectFloods(fieldBoundary, fieldId, currentDate = null) {
    try {
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);
      const analysisDate =
        currentDate || new Date().toISOString().split("T")[0];

      console.log(
        `🌊 Analyzing flood status for field ${fieldId} on ${analysisDate}`
      );

      // 1. Detect current flood status
      const currentFloodStatus = await this._detectCurrentFlood(
        geometry,
        analysisDate
      );

      // 2. Analyze historical floods
      const historicalFloods = await this._analyzeHistoricalFloods(
        geometry,
        analysisDate
      );

      // 3. Calculate flood risk
      const floodRisk = this._calculateFloodRisk(historicalFloods);

      // 4. Get water extent statistics
      const waterExtent = await this._calculateWaterExtent(
        geometry,
        analysisDate
      );

      return {
        success: true,
        field_id: fieldId,
        analysis_date: analysisDate,
        current_status: currentFloodStatus,
        historical_analysis: {
          floods_detected: historicalFloods,
          total_flood_events: historicalFloods.length,
          analysis_period_years: this.HISTORICAL_YEARS,
          flood_risk: floodRisk,
        },
        water_extent: waterExtent,
        metadata: {
          data_source: "Sentinel-1 SAR",
          spatial_resolution: "10m",
          polarization: "VV, VH",
          method: "SAR backscatter threshold analysis",
          generated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Flood detection failed: ${error.message}`);
    }
  }

  /**
   * Generate flood time series for a field
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @param {Number} intervalDays - Interval in days
   * @returns {Promise<Object>} Flood time series data
   */
  async generateFloodTimeSeries(
    fieldBoundary,
    fieldId,
    startDate,
    endDate,
    intervalDays = 30
  ) {
    try {
      const geometry = this._geoJsonToEEGeometry(fieldBoundary);

      console.log(`📊 Generating flood time series for field ${fieldId}`);

      // Generate date array
      const dates = this._generateDateArray(startDate, endDate, intervalDays);
      const timeSeriesData = [];

      for (const date of dates) {
        const nextDate = this._addDays(date, intervalDays);

        // Get water extent for this period
        const waterData = await this._getWaterExtentForPeriod(
          geometry,
          date,
          nextDate
        );

        timeSeriesData.push({
          date: date,
          water_percentage: waterData.water_percentage,
          water_area_hectares: waterData.water_area_hectares,
          flood_detected: waterData.water_percentage > 5, // > 5% water = potential flood
          confidence: waterData.confidence,
        });
      }

      // Calculate statistics
      const statistics = this._calculateFloodStatistics(timeSeriesData);

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
          data_source: "Sentinel-1 SAR",
          total_data_points: timeSeriesData.length,
          generated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Flood time series generation failed: ${error.message}`);
    }
  }

  /**
   * Detect current flood status with progressive date range search
   * @private
   */
  async _detectCurrentFlood(geometry, date) {
    try {
      // Progressive date range search (similar to zone image and drought detection)
      let imageCollection = null;
      let actualDateRange = null;
      let searchAttempts = [
        { days: 12, label: "last 12 days" },
        { days: 20, label: "last 20 days" },
        { days: 30, label: "last 30 days" },
        { days: 45, label: "last 45 days" },
        { days: 60, label: "last 60 days" },
      ];

      for (const attempt of searchAttempts) {
        const startDate = this._subtractDays(date, attempt.days);
        const endDate = date;

        console.log(
          `  🔍 Searching SAR imagery (${attempt.label}): ${startDate} to ${endDate}`
        );

        const collection = this.ee
          .ImageCollection(this.SENTINEL1_DATASET)
          .filterBounds(geometry)
          .filterDate(startDate, endDate)
          .filter(
            this.ee.Filter.listContains("transmitterReceiverPolarisation", "VV")
          )
          .filter(this.ee.Filter.eq("instrumentMode", "IW"))
          .select("VV");

        const size = collection.size().getInfo();
        console.log(`  📊 Found ${size} SAR images`);

        if (size > 0) {
          imageCollection = collection;
          actualDateRange = {
            start: startDate,
            end: endDate,
            range: attempt.label,
          };
          console.log(`  ✅ Using SAR images from ${attempt.label}`);
          break;
        }
      }

      if (!imageCollection) {
        return {
          flood_detected: false,
          confidence: "low",
          message: "No SAR imagery available (searched up to 60 days)",
          water_percentage: 0,
          water_area_hectares: 0,
        };
      }

      // Get mean VV backscatter
      const vvMean = imageCollection.mean();

      // Detect water (low backscatter = water)
      const waterMask = vvMean.lt(this.WATER_THRESHOLD_VV);

      // Calculate water extent
      const waterStats = waterMask
        .reduceRegion({
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9,
        })
        .getInfo();

      const waterPercentage = (waterStats.VV || 0) * 100;
      const fieldArea = this._calculateAreaHectares(geometry);
      const waterArea = (waterPercentage / 100) * fieldArea;

      // Determine flood status
      const floodDetected = waterPercentage > 5; // > 5% water coverage
      const severity = this._getFloodSeverity(waterPercentage);

      return {
        flood_detected: floodDetected,
        severity: severity,
        confidence: imageCollection.size().getInfo() >= 2 ? "high" : "medium",
        water_percentage: parseFloat(waterPercentage.toFixed(2)),
        water_area_hectares: parseFloat(waterArea.toFixed(4)),
        image_count: imageCollection.size().getInfo(),
        actual_date_range: actualDateRange,
        date_range: {
          start: actualDateRange.start,
          end: actualDateRange.end,
        },
      };
    } catch (error) {
      console.error("Error detecting current flood:", error);
      return {
        flood_detected: false,
        confidence: "low",
        error: error.message,
        water_percentage: 0,
        water_area_hectares: 0,
      };
    }
  }

  /**
   * Analyze historical floods
   * @private
   */
  async _analyzeHistoricalFloods(geometry, currentDate) {
    try {
      const floods = [];
      const startDate = this._subtractYears(currentDate, this.HISTORICAL_YEARS);

      // Get all SAR imagery for the period
      const collection = this.ee
        .ImageCollection(this.SENTINEL1_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, currentDate)
        .filter(
          this.ee.Filter.listContains("transmitterReceiverPolarisation", "VV")
        )
        .filter(this.ee.Filter.eq("instrumentMode", "IW"))
        .select("VV");

      const imageList = collection.toList(collection.size());
      const size = collection.size().getInfo();

      if (size === 0) {
        return floods;
      }

      // Sample every 30th image to avoid timeout (monthly sampling)
      const sampleInterval = Math.max(1, Math.floor(size / 60)); // Max 60 samples

      for (let i = 0; i < size; i += sampleInterval) {
        try {
          const image = this.ee.Image(imageList.get(i));
          const imageDate = this.ee
            .Date(image.get("system:time_start"))
            .format("YYYY-MM-dd")
            .getInfo();

          // Detect water
          const waterMask = image.lt(this.WATER_THRESHOLD_VV);

          const waterStats = waterMask
            .reduceRegion({
              reducer: this.ee.Reducer.mean(),
              geometry: geometry,
              scale: 10,
              maxPixels: 1e9,
            })
            .getInfo();

          const waterPercentage = (waterStats.VV || 0) * 100;

          // If significant water detected (> 10% = flood event)
          if (waterPercentage > 10) {
            const fieldArea = this._calculateAreaHectares(geometry);
            const waterArea = (waterPercentage / 100) * fieldArea;

            floods.push({
              date: imageDate,
              water_percentage: parseFloat(waterPercentage.toFixed(2)),
              water_area_hectares: parseFloat(waterArea.toFixed(4)),
              severity: this._getFloodSeverity(waterPercentage),
            });
          }
        } catch (err) {
          console.warn(`Error processing image ${i}:`, err.message);
          continue;
        }
      }

      // Sort by date (most recent first)
      floods.sort((a, b) => new Date(b.date) - new Date(a.date));

      return floods;
    } catch (error) {
      console.error("Error analyzing historical floods:", error);
      return [];
    }
  }

  /**
   * Calculate water extent
   * @private
   */
  async _calculateWaterExtent(geometry, date) {
    try {
      const startDate = this._subtractDays(date, 12);

      const collection = this.ee
        .ImageCollection(this.SENTINEL1_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, date)
        .filter(
          this.ee.Filter.listContains("transmitterReceiverPolarisation", "VV")
        )
        .filter(this.ee.Filter.eq("instrumentMode", "IW"))
        .select("VV");

      const size = collection.size().getInfo();

      if (size === 0) {
        return {
          total_area_hectares: this._calculateAreaHectares(geometry),
          water_area_hectares: 0,
          water_percentage: 0,
          land_percentage: 100,
        };
      }

      const vvMean = collection.mean();
      const waterMask = vvMean.lt(this.WATER_THRESHOLD_VV);

      const stats = waterMask
        .reduceRegion({
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9,
        })
        .getInfo();

      const waterPercentage = (stats.VV || 0) * 100;
      const fieldArea = this._calculateAreaHectares(geometry);
      const waterArea = (waterPercentage / 100) * fieldArea;

      return {
        total_area_hectares: parseFloat(fieldArea.toFixed(4)),
        water_area_hectares: parseFloat(waterArea.toFixed(4)),
        water_percentage: parseFloat(waterPercentage.toFixed(2)),
        land_percentage: parseFloat((100 - waterPercentage).toFixed(2)),
      };
    } catch (error) {
      console.error("Error calculating water extent:", error);
      const fieldArea = this._calculateAreaHectares(geometry);
      return {
        total_area_hectares: parseFloat(fieldArea.toFixed(4)),
        water_area_hectares: 0,
        water_percentage: 0,
        land_percentage: 100,
      };
    }
  }

  /**
   * Get water extent for a specific period
   * @private
   */
  async _getWaterExtentForPeriod(geometry, startDate, endDate) {
    try {
      const collection = this.ee
        .ImageCollection(this.SENTINEL1_DATASET)
        .filterBounds(geometry)
        .filterDate(startDate, endDate)
        .filter(
          this.ee.Filter.listContains("transmitterReceiverPolarisation", "VV")
        )
        .filter(this.ee.Filter.eq("instrumentMode", "IW"))
        .select("VV");

      const size = collection.size().getInfo();

      if (size === 0) {
        return {
          water_percentage: 0,
          water_area_hectares: 0,
          confidence: "low",
        };
      }

      const vvMean = collection.mean();
      const waterMask = vvMean.lt(this.WATER_THRESHOLD_VV);

      const stats = waterMask
        .reduceRegion({
          reducer: this.ee.Reducer.mean(),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9,
        })
        .getInfo();

      const waterPercentage = (stats.VV || 0) * 100;
      const fieldArea = this._calculateAreaHectares(geometry);
      const waterArea = (waterPercentage / 100) * fieldArea;

      return {
        water_percentage: parseFloat(waterPercentage.toFixed(2)),
        water_area_hectares: parseFloat(waterArea.toFixed(4)),
        confidence: size >= 2 ? "high" : "medium",
      };
    } catch (error) {
      return {
        water_percentage: 0,
        water_area_hectares: 0,
        confidence: "low",
      };
    }
  }

  /**
   * Calculate flood risk based on historical data
   * @private
   */
  _calculateFloodRisk(historicalFloods) {
    if (historicalFloods.length === 0) {
      return {
        level: "low",
        score: 0,
        description: "No historical floods detected in the past 5 years",
      };
    }

    const floodCount = historicalFloods.length;
    const avgWaterPercentage =
      historicalFloods.reduce((sum, f) => sum + f.water_percentage, 0) /
      floodCount;

    // Calculate risk score (0-100)
    const frequencyScore = Math.min(floodCount * 10, 50); // Max 50 points for frequency
    const severityScore = Math.min(avgWaterPercentage, 50); // Max 50 points for severity
    const riskScore = frequencyScore + severityScore;

    let level, description;
    if (riskScore < 20) {
      level = "low";
      description = "Low flood risk - rare flood events with minimal impact";
    } else if (riskScore < 40) {
      level = "moderate";
      description = "Moderate flood risk - occasional flood events";
    } else if (riskScore < 60) {
      level = "high";
      description = "High flood risk - frequent flood events";
    } else {
      level = "very_high";
      description = "Very high flood risk - severe and frequent flooding";
    }

    return {
      level: level,
      score: parseFloat(riskScore.toFixed(2)),
      description: description,
      flood_frequency: floodCount,
      avg_water_percentage: parseFloat(avgWaterPercentage.toFixed(2)),
    };
  }

  /**
   * Calculate flood statistics from time series
   * @private
   */
  _calculateFloodStatistics(timeSeriesData) {
    const floodEvents = timeSeriesData.filter((d) => d.flood_detected);
    const waterPercentages = timeSeriesData.map((d) => d.water_percentage);

    return {
      total_data_points: timeSeriesData.length,
      flood_events_detected: floodEvents.length,
      flood_frequency_percentage: parseFloat(
        ((floodEvents.length / timeSeriesData.length) * 100).toFixed(2)
      ),
      max_water_percentage: parseFloat(
        Math.max(...waterPercentages).toFixed(2)
      ),
      avg_water_percentage: parseFloat(
        (
          waterPercentages.reduce((a, b) => a + b, 0) / waterPercentages.length
        ).toFixed(2)
      ),
      most_recent_flood: floodEvents.length > 0 ? floodEvents[0].date : null,
    };
  }

  /**
   * Get flood severity level
   * @private
   */
  _getFloodSeverity(waterPercentage) {
    if (waterPercentage < 5) return "none";
    if (waterPercentage < 15) return "minor";
    if (waterPercentage < 30) return "moderate";
    if (waterPercentage < 50) return "major";
    return "severe";
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
   * Calculate area in hectares
   * @private
   */
  _calculateAreaHectares(geometry) {
    const areaMeters = geometry.area().getInfo();
    return areaMeters / 10000; // Convert m² to hectares
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

module.exports = FloodDetectionService;
