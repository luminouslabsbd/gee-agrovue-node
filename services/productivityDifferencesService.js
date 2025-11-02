const ee = require("@google/earthengine");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

/**
 * Productivity Differences Service - IMAGE-BASED APPROACH
 *
 * Calculates 7-zone productivity classification (m3, m2, m1, p0, p1, p2, p3)
 * using efficient image-based classification instead of grid-based zones.
 *
 * Zone System (based on standard deviations from field mean):
 * - m3: Very Low Productivity (< -1.5 std dev) - 69% of average
 * - m2: Low Productivity (-1.5 to -0.5 std dev) - 87% of average
 * - m1: Below Average (-0.5 to -0.25 std dev) - 95% of average
 * - p0: Average Productivity (-0.25 to +0.25 std dev) - 100% baseline
 * - p1: Above Average (+0.25 to +0.5 std dev) - 107% of average
 * - p2: High Productivity (+0.5 to +1.5 std dev) - 111% of average
 * - p3: Very High Productivity (> +1.5 std dev) - 119% of average
 */
class ProductivityDifferencesService {
  constructor(eeInstance) {
    this.ee = eeInstance;
    this.SENTINEL2_DATASET = "COPERNICUS/S2_SR_HARMONIZED";
    this.CLOUD_FILTER = 30;
    this.STORAGE_DIR = path.join(
      __dirname,
      "..",
      "public",
      "productivity-zones"
    );

    // Ensure storage directory exists
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
    }

    // 7-Zone productivity classification
    this.PRODUCTIVITY_ZONES = {
      m3: {
        label: "Very Low Productivity",
        code: "m3",
        value: 1,
        std_min: -Infinity,
        std_max: -1.5,
        productivity_percentage: 69,
        color: "#8B0000",
        rgb: [139, 0, 0],
        management:
          "Urgent intervention - soil testing, drainage, pest control",
      },
      m2: {
        label: "Low Productivity",
        code: "m2",
        value: 2,
        std_min: -1.5,
        std_max: -0.5,
        productivity_percentage: 87,
        color: "#DC143C",
        rgb: [220, 20, 60],
        management: "Targeted fertilization and irrigation needed",
      },
      m1: {
        label: "Below Average",
        code: "m1",
        value: 3,
        std_min: -0.5,
        std_max: -0.25,
        productivity_percentage: 95,
        color: "#FF8C00",
        rgb: [255, 140, 0],
        management: "Monitor closely, consider soil amendments",
      },
      p0: {
        label: "Average Productivity",
        code: "p0",
        value: 4,
        std_min: -0.25,
        std_max: 0.25,
        productivity_percentage: 100,
        color: "#FFD700",
        rgb: [255, 215, 0],
        management: "Maintain current practices",
      },
      p1: {
        label: "Above Average",
        code: "p1",
        value: 5,
        std_min: 0.25,
        std_max: 0.5,
        productivity_percentage: 107,
        color: "#9ACD32",
        rgb: [154, 205, 50],
        management: "Good performance, optimize for maximum yield",
      },
      p2: {
        label: "High Productivity",
        code: "p2",
        value: 6,
        std_min: 0.5,
        std_max: 1.5,
        productivity_percentage: 111,
        color: "#32CD32",
        rgb: [50, 205, 50],
        management: "Excellent conditions, use as reference",
      },
      p3: {
        label: "Very High Productivity",
        code: "p3",
        value: 7,
        std_min: 1.5,
        std_max: Infinity,
        productivity_percentage: 119,
        color: "#006400",
        rgb: [0, 100, 0],
        management: "Optimal productivity, replicate conditions",
      },
    };
  }

  async generateProductivityAnalysis(fieldBoundary, fieldId, date = null) {
    try {
      console.log(
        `🎯 Generating productivity differences analysis for field ${fieldId}...`
      );
      const geometry = this.ee.Geometry.Polygon(fieldBoundary.coordinates[0]);
      const analysisDate = date || new Date().toISOString().split("T")[0];

      const ndviData = await this._getNDVIData(geometry, analysisDate);
      const { ndvi, meanNDVI, stdNDVI, minNDVI, maxNDVI, imageCount } =
        ndviData;
      console.log(
        `📊 Field NDVI: Mean=${meanNDVI.toFixed(4)}, StdDev=${stdNDVI.toFixed(
          4
        )}`
      );

      const zoneImage = this._classifyProductivityZones(
        ndvi,
        meanNDVI,
        stdNDVI
      );
      const zoneStats = await this._calculateZoneStatistics(
        zoneImage,
        geometry
      );
      const images = await this._generateImages(
        ndvi,
        zoneImage,
        geometry,
        fieldId
      );

      const results = {
        success: true,
        field_id: fieldId,
        analysis_date: analysisDate,
        field_statistics: {
          mean_ndvi: parseFloat(meanNDVI.toFixed(4)),
          std_dev_ndvi: parseFloat(stdNDVI.toFixed(4)),
          min_ndvi: parseFloat(minNDVI.toFixed(4)),
          max_ndvi: parseFloat(maxNDVI.toFixed(4)),
          image_count: imageCount,
        },
        productivity_differences: {
          m3: 69,
          m2: 87,
          m1: 95,
          p0: 100,
          p1: 107,
          p2: 111,
          p3: 119,
        },
        available_productivity_zones: zoneStats.available_zones,
        zone_distribution: zoneStats.zone_distribution,
        images: images,
        zone_details: this._getZoneDetails(zoneStats.available_zones),
      };

      console.log(
        `✅ Analysis complete! Found ${zoneStats.available_zones.length} zones`
      );
      return results;
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  }

  async _getNDVIData(geometry, date) {
    const targetDate = new Date(date);
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 7);
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    console.log(`🔍 Searching Sentinel-2: ${startStr} to ${endStr}`);

    const collection = this.ee
      .ImageCollection(this.SENTINEL2_DATASET)
      .filterBounds(geometry)
      .filterDate(startStr, endStr)
      .filter(this.ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", this.CLOUD_FILTER));
    const count = await new Promise((resolve, reject) => {
      collection.size().evaluate((result, error) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    console.log(`📊 Found ${count} images`);
    if (count === 0) throw new Error("No cloud-free images found");

    const ndvi = collection
      .map((img) => {
        const nir = img.select("B8");
        const red = img.select("B4");
        return img.addBands(
          nir.subtract(red).divide(nir.add(red)).rename("NDVI")
        );
      })
      .select("NDVI")
      .median()
      .clip(geometry);

    const stats = await new Promise((resolve, reject) => {
      ndvi
        .reduceRegion({
          reducer: this.ee.Reducer.mean()
            .combine(this.ee.Reducer.stdDev(), "", true)
            .combine(this.ee.Reducer.min(), "", true)
            .combine(this.ee.Reducer.max(), "", true),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9,
        })
        .evaluate((result, error) => {
          if (error) reject(error);
          else resolve(result);
        });
    });

    return {
      ndvi: ndvi,
      meanNDVI: stats.NDVI_mean || 0,
      stdNDVI: stats.NDVI_stdDev || 0,
      minNDVI: stats.NDVI_min || 0,
      maxNDVI: stats.NDVI_max || 1,
      imageCount: count,
    };
  }

  _classifyProductivityZones(ndviImage, mean, stdDev) {
    const ee = this.ee;
    const m3_t = mean + stdDev * -1.5,
      m2_t = mean + stdDev * -0.5,
      m1_t = mean + stdDev * -0.25,
      p1_t = mean + stdDev * 0.25,
      p2_t = mean + stdDev * 0.5,
      p3_t = mean + stdDev * 1.5;

    let zoneImage = ee.Image(0);
    zoneImage = zoneImage.where(ndviImage.lt(m3_t), 1);
    zoneImage = zoneImage.where(ndviImage.gte(m3_t).and(ndviImage.lt(m2_t)), 2);
    zoneImage = zoneImage.where(ndviImage.gte(m2_t).and(ndviImage.lt(m1_t)), 3);
    zoneImage = zoneImage.where(ndviImage.gte(m1_t).and(ndviImage.lt(p1_t)), 4);
    zoneImage = zoneImage.where(ndviImage.gte(p1_t).and(ndviImage.lt(p2_t)), 5);
    zoneImage = zoneImage.where(ndviImage.gte(p2_t).and(ndviImage.lt(p3_t)), 6);
    zoneImage = zoneImage.where(ndviImage.gte(p3_t), 7);

    return zoneImage.rename("zone");
  }

  async _calculateZoneStatistics(zoneImage, geometry) {
    const histogram = await new Promise((resolve, reject) => {
      zoneImage
        .reduceRegion({
          reducer: this.ee.Reducer.frequencyHistogram(),
          geometry: geometry,
          scale: 10,
          maxPixels: 1e9,
        })
        .evaluate((result, error) => {
          if (error) reject(error);
          else resolve(result);
        });
    });

    const zoneCounts = histogram.zone || {};
    const totalPixels = Object.values(zoneCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    const available_zones = [];
    const zone_distribution = {};

    Object.entries(this.PRODUCTIVITY_ZONES).forEach(([code, info]) => {
      const pixelCount = zoneCounts[info.value] || 0;
      if (pixelCount > 0) {
        available_zones.push(code);
        zone_distribution[code] = {
          pixel_count: pixelCount,
          percentage: parseFloat(((pixelCount / totalPixels) * 100).toFixed(2)),
          productivity_percentage: info.productivity_percentage,
          label: info.label,
        };
      }
    });

    return { available_zones, zone_distribution, total_pixels: totalPixels };
  }

  async _generateImages(ndviImage, zoneImage, geometry, fieldId) {
    const imageDir = path.join(this.STORAGE_DIR, fieldId);
    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

    // Get bounding box for the field geometry
    const bounds = await new Promise((resolve, reject) => {
      geometry.bounds().evaluate((result, error) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    console.log(`📐 Field bounds:`, JSON.stringify(bounds));

    // CRITICAL FIX: Clip images to field boundary and specify region for thumbnail
    const ndviClipped = ndviImage.clip(geometry);
    const zoneClipped = zoneImage.clip(geometry);

    // Generate NDVI thumbnail with region parameter
    const ndviUrl = await new Promise((resolve, reject) => {
      ndviClipped.getThumbURL(
        {
          min: -0.2,
          max: 1.0,
          palette: [
            "#8B0000",
            "#DC143C",
            "#FF8C00",
            "#FFD700",
            "#9ACD32",
            "#32CD32",
            "#006400",
          ],
          dimensions: 512,
          region: geometry,
          format: "png",
        },
        (url, error) => {
          if (error) reject(error);
          else resolve(url);
        }
      );
    });

    console.log(`🖼️ NDVI thumbnail URL generated`);

    // Generate productivity zones thumbnail with region parameter
    const zoneUrl = await new Promise((resolve, reject) => {
      zoneClipped.getThumbURL(
        {
          min: 1,
          max: 7,
          palette: [
            "#8B0000",
            "#DC143C",
            "#FF8C00",
            "#FFD700",
            "#9ACD32",
            "#32CD32",
            "#006400",
          ],
          dimensions: 512,
          region: geometry,
          format: "png",
        },
        (url, error) => {
          if (error) reject(error);
          else resolve(url);
        }
      );
    });

    console.log(`🖼️ Productivity zones thumbnail URL generated`);

    const ndviPath = path.join(imageDir, "ndvi_map.png");
    const zonePath = path.join(imageDir, "productivity_zones.png");

    await this._downloadImage(ndviUrl, ndviPath);
    await this._downloadImage(zoneUrl, zonePath);

    console.log(`✅ Both images downloaded and saved`);

    return {
      ndvi_map: `/productivity-zones/${fieldId}/ndvi_map.png`,
      productivity_zones_map: `/productivity-zones/${fieldId}/productivity_zones.png`,
    };
  }

  async _downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith("https") ? https : http;
      const file = fs.createWriteStream(filepath);
      protocol
        .get(url, (response) => {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log(`✅ Downloaded: ${path.basename(filepath)}`);
            resolve();
          });
        })
        .on("error", (error) => {
          fs.unlink(filepath, () => {});
          reject(error);
        });
    });
  }

  _getZoneDetails(availableZones) {
    return availableZones.map((code) => ({
      code,
      label: this.PRODUCTIVITY_ZONES[code].label,
      productivity_percentage:
        this.PRODUCTIVITY_ZONES[code].productivity_percentage,
      color: this.PRODUCTIVITY_ZONES[code].color,
      management: this.PRODUCTIVITY_ZONES[code].management,
    }));
  }
}

module.exports = ProductivityDifferencesService;
