/**
 * Zone Image Generation Service
 * Generates NDVI zone images with color-coded zones, crop yield overlay, and productivity status
 * Stores images in public folder for HTTP access
 *
 * Features:
 * - Generate NDVI zone images with color-coded performance zones
 * - Overlay crop yield predictions on zone images
 * - Store images in public/zone-images folder
 * - Return image URLs and comprehensive productivity data
 * - Support multiple image formats (PNG, JPEG)
 * - Generate zone legends and metadata
 */

const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");

class ZoneImageGenerationService {
  constructor(ee) {
    this.ee = ee;
    this.SENTINEL2_DATASET = "COPERNICUS/S2_SR";
    this.CLOUD_FILTER = 30;
    this.STORAGE_DIR = path.join(__dirname, "..", "public", "zone-images");

    // Ensure storage directory exists
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
      console.log("✅ Created zone-images directory");
    }

    // Zone classification thresholds (NDVI-based)
    this.ZONE_THRESHOLDS = {
      excellent: {
        min: 0.7,
        max: 1.0,
        color: "#006400",
        label: "Excellent",
        rgb: [0, 100, 0],
      },
      good: {
        min: 0.5,
        max: 0.7,
        color: "#32CD32",
        label: "Good",
        rgb: [50, 205, 50],
      },
      moderate: {
        min: 0.3,
        max: 0.5,
        color: "#FFD700",
        label: "Moderate",
        rgb: [255, 215, 0],
      },
      poor: {
        min: 0.1,
        max: 0.3,
        color: "#FF8C00",
        label: "Poor",
        rgb: [255, 140, 0],
      },
      very_poor: {
        min: -0.2,
        max: 0.1,
        color: "#DC143C",
        label: "Very Poor",
        rgb: [220, 20, 60],
      },
    };

    // Crop yield estimation factors (tons/hectare based on NDVI)
    this.YIELD_FACTORS = {
      rice: { base: 3.5, ndvi_multiplier: 8.0, max_yield: 10.0 },
      wheat: { base: 2.8, ndvi_multiplier: 6.5, max_yield: 8.0 },
      maize: { base: 4.0, ndvi_multiplier: 9.0, max_yield: 12.0 },
      cotton: { base: 1.5, ndvi_multiplier: 3.5, max_yield: 5.0 },
      soybean: { base: 2.0, ndvi_multiplier: 5.0, max_yield: 6.0 },
    };
  }

  /**
   * Generate zone image with NDVI, zones, and crop yield overlay
   * @param {Object} fieldBoundary - GeoJSON polygon
   * @param {String} fieldId - Field identifier
   * @param {String} date - Analysis date (YYYY-MM-DD)
   * @param {Number} gridSize - Grid size in meters (default: 50)
   * @param {String} cropType - Crop type (rice, wheat, maize, cotton, soybean)
   * @returns {Object} Image metadata with URLs and productivity data
   */
  async generateZoneImage(
    fieldBoundary,
    fieldId,
    date,
    gridSize = 50,
    cropType = "rice"
  ) {
    try {
      console.log(`🎨 Generating zone image for field ${fieldId}...`);

      const geometry = this.ee.Geometry.Polygon(fieldBoundary.coordinates[0]);
      const nextDate = this._addDays(date, 1);

      // Get Sentinel-2 imagery
      const imageCollection = this.ee
        .ImageCollection(this.SENTINEL2_DATASET)
        .filterBounds(geometry)
        .filterDate(date, nextDate)
        .filter(
          this.ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", this.CLOUD_FILTER)
        );

      const imageCount = imageCollection.size().getInfo();
      if (imageCount === 0) {
        throw new Error(`No satellite images available for date: ${date}`);
      }

      // Calculate NDVI
      const ndvi = imageCollection
        .map((img) => img.normalizedDifference(["B8", "B4"]).rename("NDVI"))
        .mean()
        .clip(geometry);

      // Get field statistics
      const stats = ndvi
        .reduceRegion({
          reducer: this.ee.Reducer.mean()
            .combine({
              reducer2: this.ee.Reducer.stdDev(),
              sharedInputs: true,
            })
            .combine({
              reducer2: this.ee.Reducer.minMax(),
              sharedInputs: true,
            }),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9,
        })
        .getInfo();

      const meanNDVI = stats.NDVI_mean || 0;
      const stdNDVI = stats.NDVI_stdDev || 0;
      const minNDVI = stats.NDVI_min || 0;
      const maxNDVI = stats.NDVI_max || 0;

      // Generate zones
      const zones = this._generateZones(geometry, gridSize);
      const zoneAnalysis = await this._analyzeZones(ndvi, zones, geometry);

      // Calculate crop yield predictions
      const yieldData = this._calculateYieldPredictions(zoneAnalysis, cropType);

      // Create color-coded zone image
      const zoneImage = this._createZoneImage(ndvi, zoneAnalysis);

      // Use fieldId as directory name (no timestamp)
      const imageDir = path.join(this.STORAGE_DIR, fieldId);

      // Delete old data if directory exists
      if (fs.existsSync(imageDir)) {
        console.log(`🗑️  Removing old data for field ${fieldId}...`);
        fs.rmSync(imageDir, { recursive: true, force: true });
        console.log(`✅ Old data deleted for field ${fieldId}`);
      }

      // Create image directory
      fs.mkdirSync(imageDir, { recursive: true });

      console.log(`📥 Downloading NDVI and Zone images...`);

      // Generate downloadable PNG images using getThumbURL
      const ndviVisParams = {
        min: -0.2,
        max: 0.9,
        palette: ["#DC143C", "#FF8C00", "#FFD700", "#32CD32", "#006400"],
      };

      // Get download URLs from Earth Engine
      const ndviThumbUrl = ndvi.getThumbURL({
        dimensions: 1024,
        region: geometry,
        format: "png",
        ...ndviVisParams,
      });

      // Zone image is already RGB, no need to visualize
      const zoneThumbUrl = zoneImage.getThumbURL({
        dimensions: 1024,
        region: geometry,
        format: "png",
      });

      // Download images to public folder
      const ndviImagePath = path.join(imageDir, "ndvi_map.png");
      const zoneImagePath = path.join(imageDir, "zone_map.png");

      await this._downloadImage(ndviThumbUrl, ndviImagePath);
      console.log(`✅ NDVI image saved: ${ndviImagePath}`);

      await this._downloadImage(zoneThumbUrl, zoneImagePath);
      console.log(`✅ Zone image saved: ${zoneImagePath}`);

      // Store image metadata
      const imageMetadata = await this._storeImageMetadata(
        fieldId,
        fieldId,
        date,
        zoneAnalysis,
        yieldData,
        meanNDVI,
        stdNDVI,
        minNDVI,
        maxNDVI
      );

      // Calculate productivity status
      const productivityStatus = this._calculateProductivityStatus(
        meanNDVI,
        zoneAnalysis,
        yieldData
      );

      console.log(`✅ Zone image generated successfully for field ${fieldId}`);

      return {
        success: true,
        field_id: fieldId,
        analysis_date: date,
        crop_type: cropType,
        image_id: fieldId,

        // Image URLs (actual PNG files in public folder)
        images: {
          ndvi_image_url: `/zone-images/${fieldId}/ndvi_map.png`,
          zone_image_url: `/zone-images/${fieldId}/zone_map.png`,
          metadata_url: `/zone-images/${fieldId}/metadata.json`,
          legend_url: `/zone-images/${fieldId}/legend.json`,
        },

        // Field statistics
        field_statistics: {
          mean_ndvi: parseFloat(meanNDVI.toFixed(4)),
          std_ndvi: parseFloat(stdNDVI.toFixed(4)),
          min_ndvi: parseFloat(minNDVI.toFixed(4)),
          max_ndvi: parseFloat(maxNDVI.toFixed(4)),
          variability: parseFloat((stdNDVI / meanNDVI).toFixed(4)),
          area_hectares: (geometry.area().getInfo() / 10000).toFixed(2),
        },

        // Zone analysis
        zone_analysis: zoneAnalysis,

        // Crop yield predictions
        yield_predictions: yieldData,

        // Productivity status
        productivity_status: productivityStatus,

        metadata: {
          grid_size_meters: gridSize,
          total_zones: zoneAnalysis.zones.length,
          image_count: imageCount,
          data_source: "Sentinel-2 Level 2A",
          generated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ Error generating zone image:", error);
      throw new Error(`Failed to generate zone image: ${error.message}`);
    }
  }

  /**
   * Generate grid zones for the field
   */
  _generateZones(geometry, gridSize) {
    const bounds = geometry.bounds().getInfo().coordinates[0];
    const minLon = Math.min(...bounds.map((c) => c[0]));
    const maxLon = Math.max(...bounds.map((c) => c[0]));
    const minLat = Math.min(...bounds.map((c) => c[1]));
    const maxLat = Math.max(...bounds.map((c) => c[1]));

    // Convert grid size from meters to degrees (approximate)
    const gridSizeDeg = gridSize / 111320; // 1 degree ≈ 111.32 km

    const zones = [];
    let zoneId = 1;

    for (let lon = minLon; lon < maxLon; lon += gridSizeDeg) {
      for (let lat = minLat; lat < maxLat; lat += gridSizeDeg) {
        const zoneGeometry = this.ee.Geometry.Rectangle([
          lon,
          lat,
          Math.min(lon + gridSizeDeg, maxLon),
          Math.min(lat + gridSizeDeg, maxLat),
        ]);

        zones.push({
          zone_id: zoneId++,
          geometry: zoneGeometry,
        });
      }
    }

    return zones;
  }

  /**
   * Analyze NDVI for each zone
   */
  async _analyzeZones(ndvi, zones, fieldGeometry) {
    const zoneResults = [];

    for (const zone of zones) {
      try {
        const zoneClipped = zone.geometry.intersection(fieldGeometry, 1);

        const stats = ndvi
          .reduceRegion({
            reducer: this.ee.Reducer.mean().combine({
              reducer2: this.ee.Reducer.stdDev(),
              sharedInputs: true,
            }),
            geometry: zoneClipped,
            scale: 10,
            maxPixels: 1e9,
          })
          .getInfo();

        const meanNDVI = stats.NDVI_mean || 0;
        const stdNDVI = stats.NDVI_stdDev || 0;
        const area = zoneClipped.area().getInfo() / 10000; // hectares

        if (area > 0.001) {
          // Only include zones with significant area
          const classification = this._classifyZone(meanNDVI);

          zoneResults.push({
            zone_id: zone.zone_id,
            mean_ndvi: parseFloat(meanNDVI.toFixed(4)),
            std_ndvi: parseFloat(stdNDVI.toFixed(4)),
            area_hectares: parseFloat(area.toFixed(4)),
            classification: classification.label,
            classification_code: classification.code,
            color: classification.color,
            priority: classification.priority,
          });
        }
      } catch (error) {
        console.warn(
          `Warning: Could not analyze zone ${zone.zone_id}:`,
          error.message
        );
      }
    }

    // Calculate zone summary
    const zoneSummary = this._calculateZoneSummary(zoneResults);

    return {
      zones: zoneResults,
      summary: zoneSummary,
    };
  }

  /**
   * Classify zone based on NDVI
   */
  _classifyZone(meanNDVI) {
    if (meanNDVI >= 0.7) {
      return {
        code: "excellent",
        label: "Excellent",
        color: "#006400",
        priority: 1,
      };
    } else if (meanNDVI >= 0.5) {
      return { code: "good", label: "Good", color: "#32CD32", priority: 2 };
    } else if (meanNDVI >= 0.3) {
      return {
        code: "moderate",
        label: "Moderate",
        color: "#FFD700",
        priority: 3,
      };
    } else if (meanNDVI >= 0.1) {
      return { code: "poor", label: "Poor", color: "#FF8C00", priority: 4 };
    } else {
      return {
        code: "very_poor",
        label: "Very Poor",
        color: "#DC143C",
        priority: 5,
      };
    }
  }

  /**
   * Calculate zone summary statistics
   */
  _calculateZoneSummary(zones) {
    const summary = {
      by_classification: {},
      total_area: 0,
      average_ndvi: 0,
      priority_zones: [],
    };

    zones.forEach((zone) => {
      if (!summary.by_classification[zone.classification_code]) {
        summary.by_classification[zone.classification_code] = {
          count: 0,
          total_area: 0,
          label: zone.classification,
          color: zone.color,
        };
      }

      summary.by_classification[zone.classification_code].count++;
      summary.by_classification[zone.classification_code].total_area +=
        zone.area_hectares;
      summary.total_area += zone.area_hectares;
      summary.average_ndvi += zone.mean_ndvi * zone.area_hectares;

      // Identify priority zones (poor or very poor)
      if (zone.priority >= 4) {
        summary.priority_zones.push(zone.zone_id);
      }
    });

    summary.average_ndvi = summary.average_ndvi / summary.total_area;

    // Calculate percentages
    Object.keys(summary.by_classification).forEach((key) => {
      const classification = summary.by_classification[key];
      classification.percentage = parseFloat(
        ((classification.total_area / summary.total_area) * 100).toFixed(2)
      );
    });

    return summary;
  }

  /**
   * Calculate crop yield predictions for each zone
   */
  _calculateYieldPredictions(zoneAnalysis, cropType) {
    const yieldFactor = this.YIELD_FACTORS[cropType] || this.YIELD_FACTORS.rice;
    const zones = zoneAnalysis.zones;

    const zoneYields = zones.map((zone) => {
      // Yield estimation: base + (NDVI * multiplier)
      const estimatedYield = Math.min(
        yieldFactor.base + zone.mean_ndvi * yieldFactor.ndvi_multiplier,
        yieldFactor.max_yield
      );

      return {
        zone_id: zone.zone_id,
        estimated_yield_tons_per_hectare: parseFloat(estimatedYield.toFixed(2)),
        total_yield_tons: parseFloat(
          (estimatedYield * zone.area_hectares).toFixed(2)
        ),
        yield_quality: this._classifyYieldQuality(
          estimatedYield,
          yieldFactor.max_yield
        ),
        classification: zone.classification,
      };
    });

    // Calculate field-level yield
    const totalYield = zoneYields.reduce(
      (sum, z) => sum + z.total_yield_tons,
      0
    );
    const totalArea = zones.reduce((sum, z) => sum + z.area_hectares, 0);
    const averageYield = totalYield / totalArea;

    return {
      crop_type: cropType,
      zone_yields: zoneYields,
      field_summary: {
        total_estimated_yield_tons: parseFloat(totalYield.toFixed(2)),
        average_yield_tons_per_hectare: parseFloat(averageYield.toFixed(2)),
        total_area_hectares: parseFloat(totalArea.toFixed(2)),
        potential_max_yield_tons: parseFloat(
          (yieldFactor.max_yield * totalArea).toFixed(2)
        ),
        yield_efficiency_percentage: parseFloat(
          ((averageYield / yieldFactor.max_yield) * 100).toFixed(2)
        ),
      },
    };
  }

  /**
   * Classify yield quality
   */
  _classifyYieldQuality(yieldValue, maxYield) {
    const percentage = (yieldValue / maxYield) * 100;

    if (percentage >= 80) return "Excellent";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Moderate";
    if (percentage >= 20) return "Poor";
    return "Very Poor";
  }

  /**
   * Create color-coded zone image with proper RGB visualization
   */
  _createZoneImage(ndvi, zoneAnalysis) {
    // Create RGB bands for proper color visualization
    // Initialize with black (0, 0, 0)
    let red = this.ee.Image(0);
    let green = this.ee.Image(0);
    let blue = this.ee.Image(0);

    // Very Poor zones (NDVI < 0.1) - Red (#DC143C = RGB(220, 20, 60))
    const veryPoorMask = ndvi.lt(0.1);
    red = red.where(veryPoorMask, 220);
    green = green.where(veryPoorMask, 20);
    blue = blue.where(veryPoorMask, 60);

    // Poor zones (NDVI 0.1 - 0.3) - Orange (#FF8C00 = RGB(255, 140, 0))
    const poorMask = ndvi.gte(0.1).and(ndvi.lt(0.3));
    red = red.where(poorMask, 255);
    green = green.where(poorMask, 140);
    blue = blue.where(poorMask, 0);

    // Moderate zones (NDVI 0.3 - 0.5) - Yellow (#FFD700 = RGB(255, 215, 0))
    const moderateMask = ndvi.gte(0.3).and(ndvi.lt(0.5));
    red = red.where(moderateMask, 255);
    green = green.where(moderateMask, 215);
    blue = blue.where(moderateMask, 0);

    // Good zones (NDVI 0.5 - 0.7) - Green (#32CD32 = RGB(50, 205, 50))
    const goodMask = ndvi.gte(0.5).and(ndvi.lt(0.7));
    red = red.where(goodMask, 50);
    green = green.where(goodMask, 205);
    blue = blue.where(goodMask, 50);

    // Excellent zones (NDVI >= 0.7) - Dark Green (#006400 = RGB(0, 100, 0))
    const excellentMask = ndvi.gte(0.7);
    red = red.where(excellentMask, 0);
    green = green.where(excellentMask, 100);
    blue = blue.where(excellentMask, 0);

    // Combine RGB bands into a single image
    const zoneImage = this.ee.Image.rgb(red, green, blue);

    return zoneImage;
  }

  /**
   * Download image from URL and save to file
   * @param {String} url - Image URL
   * @param {String} filepath - Destination file path
   * @returns {Promise} Promise that resolves when download is complete
   */
  _downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith("https") ? https : http;

      const file = fs.createWriteStream(filepath);

      protocol
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(`Failed to download image: ${response.statusCode}`)
            );
            return;
          }

          response.pipe(file);

          file.on("finish", () => {
            file.close();
            resolve();
          });
        })
        .on("error", (err) => {
          fs.unlink(filepath, () => {}); // Delete the file if error
          reject(err);
        });
    });
  }

  /**
   * Calculate productivity status
   */
  _calculateProductivityStatus(meanNDVI, zoneAnalysis, yieldData) {
    const summary = zoneAnalysis.summary;
    const yieldSummary = yieldData.field_summary;

    // Overall productivity score (0-100)
    const ndviScore = ((meanNDVI + 0.2) / 1.1) * 100; // Normalize NDVI to 0-100
    const yieldScore = yieldSummary.yield_efficiency_percentage;
    const uniformityScore =
      100 -
      (summary.by_classification.poor?.percentage || 0) -
      (summary.by_classification.very_poor?.percentage || 0);

    const overallScore =
      ndviScore * 0.4 + yieldScore * 0.4 + uniformityScore * 0.2;

    // Determine status
    let status, statusColor, recommendations;

    if (overallScore >= 80) {
      status = "Excellent";
      statusColor = "#006400";
      recommendations = [
        "Field is performing excellently",
        "Maintain current management practices",
        "Monitor for any changes in performance",
        "Consider this field as a benchmark for others",
      ];
    } else if (overallScore >= 60) {
      status = "Good";
      statusColor = "#32CD32";
      recommendations = [
        "Field is performing well overall",
        "Continue current practices",
        "Monitor moderate zones for improvement opportunities",
        "Consider targeted interventions for lower-performing zones",
      ];
    } else if (overallScore >= 40) {
      status = "Moderate";
      statusColor = "#FFD700";
      recommendations = [
        "Field performance is moderate",
        "Review fertilization and irrigation practices",
        "Focus on improving poor-performing zones",
        "Consider soil testing for problem areas",
        "Implement precision agriculture techniques",
      ];
    } else if (overallScore >= 20) {
      status = "Poor";
      statusColor = "#FF8C00";
      recommendations = [
        "Field performance is below expectations",
        "Immediate intervention required",
        "Conduct comprehensive soil and crop health assessment",
        "Review and adjust fertilization, irrigation, and pest management",
        "Consider crop rotation or soil amendments",
      ];
    } else {
      status = "Very Poor";
      statusColor = "#DC143C";
      recommendations = [
        "Field performance is critically low",
        "Urgent action required",
        "Comprehensive field assessment needed",
        "Consider crop failure mitigation strategies",
        "Consult with agronomist for recovery plan",
      ];
    }

    return {
      overall_status: status,
      overall_score: parseFloat(overallScore.toFixed(2)),
      status_color: statusColor,
      component_scores: {
        ndvi_health_score: parseFloat(ndviScore.toFixed(2)),
        yield_efficiency_score: parseFloat(yieldScore.toFixed(2)),
        uniformity_score: parseFloat(uniformityScore.toFixed(2)),
      },
      zone_distribution: {
        excellent_percentage:
          summary.by_classification.excellent?.percentage || 0,
        good_percentage: summary.by_classification.good?.percentage || 0,
        moderate_percentage:
          summary.by_classification.moderate?.percentage || 0,
        poor_percentage: summary.by_classification.poor?.percentage || 0,
        very_poor_percentage:
          summary.by_classification.very_poor?.percentage || 0,
      },
      priority_zones_count: summary.priority_zones.length,
      priority_zones: summary.priority_zones,
      recommendations: recommendations,
    };
  }

  /**
   * Store image metadata to public folder
   */
  async _storeImageMetadata(
    imageId,
    fieldId,
    date,
    zoneAnalysis,
    yieldData,
    meanNDVI,
    stdNDVI,
    minNDVI,
    maxNDVI
  ) {
    const imageDir = path.join(this.STORAGE_DIR, imageId);

    // Create metadata
    const metadata = {
      field_id: fieldId,
      analysis_date: date,
      ndvi_statistics: {
        mean: parseFloat(meanNDVI.toFixed(4)),
        std: parseFloat(stdNDVI.toFixed(4)),
        min: parseFloat(minNDVI.toFixed(4)),
        max: parseFloat(maxNDVI.toFixed(4)),
      },
      zone_analysis: zoneAnalysis,
      yield_data: yieldData,
      images: {
        ndvi_image: `/zone-images/${fieldId}/ndvi_map.png`,
        zone_image: `/zone-images/${fieldId}/zone_map.png`,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save metadata
    const metadataPath = path.join(imageDir, "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Create legend
    const legend = this._createLegend();
    const legendPath = path.join(imageDir, "legend.json");
    fs.writeFileSync(legendPath, JSON.stringify(legend, null, 2));

    // Update index
    this._updateIndex(imageId, fieldId, date);

    return { image_id: imageId };
  }

  /**
   * Create legend for zone classification
   */
  _createLegend() {
    return {
      title: "NDVI Zone Classification",
      zones: [
        {
          label: "Excellent",
          ndvi_range: "0.7 - 1.0",
          color: "#006400",
          description: "Optimal crop health and productivity",
        },
        {
          label: "Good",
          ndvi_range: "0.5 - 0.7",
          color: "#32CD32",
          description: "Healthy vegetation, good productivity",
        },
        {
          label: "Moderate",
          ndvi_range: "0.3 - 0.5",
          color: "#FFD700",
          description: "Moderate health, needs monitoring",
        },
        {
          label: "Poor",
          ndvi_range: "0.1 - 0.3",
          color: "#FF8C00",
          description: "Poor health, intervention needed",
        },
        {
          label: "Very Poor",
          ndvi_range: "< 0.1",
          color: "#DC143C",
          description: "Critical condition, urgent action required",
        },
      ],
    };
  }

  /**
   * Update index of all zone images (upsert pattern)
   */
  _updateIndex(imageId, fieldId, date) {
    const indexPath = path.join(this.STORAGE_DIR, "index.json");
    let index = { images: [] };

    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    }

    // Check if field already exists in index
    const existingIndex = index.images.findIndex(
      (img) => img.field_id === fieldId
    );

    if (existingIndex !== -1) {
      // Update existing entry
      index.images[existingIndex] = {
        image_id: imageId,
        field_id: fieldId,
        date: date,
        created_at: index.images[existingIndex].created_at,
        updated_at: new Date().toISOString(),
      };
      console.log(`✅ Updated index for field ${fieldId}`);
    } else {
      // Add new entry
      index.images.push({
        image_id: imageId,
        field_id: fieldId,
        date: date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log(`✅ Added index for field ${fieldId}`);
    }

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }

  /**
   * Add days to date
   */
  _addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  }
}

module.exports = ZoneImageGenerationService;
