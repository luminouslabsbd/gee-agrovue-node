const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// MySQL Database with Sequelize
const database = require("./config/database");
const models = require("./models");

// Field Boundary Helper
const { resolveFieldBoundary } = require("./utils/fieldBoundaryHelper");

// Authentication
const { verifyToken, optionalAuth } = require("./middleware/auth");
const authController = require("./controllers/authController");
const fieldController = require("./controllers/fieldController");
console.log("✅ Auth Controller loaded:", Object.keys(authController));

const FieldAnalysisService = require("./services/fieldAnalysisService");
const NDVITimeSeriesService = require("./services/ndviTimeSeriesService");
const NDVITimeSeriesMapService = require("./services/ndviTimeSeriesMapService");
const NDVITwoYearTimeSeriesService = require("./services/ndviTwoYearTimeSeriesService");
const FieldDataUpdateService = require("./services/fieldDataUpdateService");
const NDVIImageExportService = require("./services/ndviImageExportService");
const TimeSeriesImageStorageService = require("./services/timeSeriesImageStorageService");
const NDVIImageGenerationService = require("./services/ndviImageGenerationService");
const NDVILegendService = require("./services/ndviLegendService");
const NDVIChartService = require("./services/ndviChartService");
const FloodDetectionService = require("./services/floodDetectionService");
const CropGrowthTrackingService = require("./services/cropGrowthTrackingService");
const CropAnalyticsService = require("./services/cropAnalyticsService");
const CropPredictionService = require("./services/cropPredictionService");
const CropChartService = require("./services/cropChartService");
const ZoneImageGenerationService = require("./services/zoneImageGenerationService");

const app = express();
const PORT = process.env.PORT || 3000;

// Database and Earth Engine status
let dbInitialized = false;
let ee;
let eeInitialized = false;
let fieldAnalysisService;
let ndviTimeSeriesService;
let ndviTimeSeriesMapService;
let ndviTwoYearTimeSeriesService;
let fieldDataUpdateService;
let ndviImageExportService;
let timeSeriesImageStorageService;
let ndviImageGenerationService;
let ndviLegendService;
let ndviChartService;
let floodDetectionService;
let cropGrowthTrackingService;
let cropAnalyticsService;
let cropPredictionService;
let cropChartService;
let zoneImageGenerationService;

async function initializeEarthEngine() {
  try {
    ee = require("@google/earthengine");

    // Load service account credentials
    const credentialsPath = path.join(__dirname, "credentials.json");
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

    // Initialize Earth Engine with service account credentials
    ee.data.authenticateViaPrivateKey(
      credentials,
      () => {
        console.log("✅ Earth Engine authenticated with service account");

        // Initialize after authentication
        ee.initialize(
          null,
          null,
          () => {
            console.log("✅ Earth Engine initialized successfully");
            eeInitialized = true;
            // Initialize field analysis service
            fieldAnalysisService = new FieldAnalysisService(ee);
            console.log("✅ Field Analysis Service initialized");
            // Initialize NDVI time series service
            ndviTimeSeriesService = new NDVITimeSeriesService(ee);
            console.log("✅ NDVI Time Series Service initialized");
            // Initialize NDVI time series map service
            ndviTimeSeriesMapService = new NDVITimeSeriesMapService(ee);
            console.log("✅ NDVI Time Series Map Service initialized");
            // Initialize NDVI 2-year time series service
            ndviTwoYearTimeSeriesService = new NDVITwoYearTimeSeriesService(ee);
            console.log("✅ NDVI 2-Year Time Series Service initialized");
            // Initialize field data update service
            fieldDataUpdateService = new FieldDataUpdateService(
              ee,
              ndviTwoYearTimeSeriesService
            );
            console.log("✅ Field Data Update Service initialized");
            // Initialize NDVI image export service
            ndviImageExportService = new NDVIImageExportService(ee);
            console.log("✅ NDVI Image Export Service initialized");
            // Initialize time series image storage service
            timeSeriesImageStorageService = new TimeSeriesImageStorageService(
              ee
            );
            console.log("✅ Time Series Image Storage Service initialized");
            // Initialize NDVI image generation service
            ndviImageGenerationService = new NDVIImageGenerationService(ee);
            console.log("✅ NDVI Image Generation Service initialized");
            // Initialize NDVI legend service
            ndviLegendService = new NDVILegendService();
            console.log("✅ NDVI Legend Service initialized");
            // Initialize NDVI chart service
            ndviChartService = new NDVIChartService(ee);
            console.log("✅ NDVI Chart Service initialized");
            // Initialize flood detection service
            floodDetectionService = new FloodDetectionService(ee);
            console.log("✅ Flood Detection Service initialized");
            // Initialize crop growth tracking service
            cropGrowthTrackingService = new CropGrowthTrackingService(ee);
            console.log("✅ Crop Growth Tracking Service initialized");
            // Initialize crop analytics service
            cropAnalyticsService = new CropAnalyticsService(ee);
            console.log("✅ Crop Analytics Service initialized");
            // Initialize crop prediction service
            cropPredictionService = new CropPredictionService(ee);
            console.log("✅ Crop Prediction Service initialized");
            // Initialize crop chart service
            cropChartService = new CropChartService(ee);
            console.log("✅ Crop Chart Service initialized");
            // Initialize zone image generation service
            zoneImageGenerationService = new ZoneImageGenerationService(ee);
            console.log("✅ Zone Image Generation Service initialized");
          },
          (error) => {
            console.error("❌ Earth Engine initialization error:", error);
          }
        );
      },
      (error) => {
        console.error("❌ Authentication error:", error);
      }
    );
  } catch (error) {
    console.error("Error initializing Earth Engine:", error);
  }
}

// Initialize MySQL Database
async function initializeDatabase() {
  try {
    await database.connectDatabase();
    dbInitialized = true;
    console.log("✅ MySQL initialization complete");
  } catch (error) {
    console.error("❌ MySQL initialization failed:", error.message);
    console.warn("⚠️  Server will continue without database persistence");
    dbInitialized = false;
  }
}

// Initialize both MySQL and Earth Engine on startup
async function initializeServices() {
  await initializeDatabase();
  await initializeEarthEngine();
}

initializeServices();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// AUTHENTICATION ROUTES (Public - No Token Required)
// ============================================

// Test route
app.post("/api/auth/test", (req, res) => {
  res.json({ message: "Test route works!" });
});

/**
 * Register a new user
 * POST /api/auth/register
 * Body: { name, email, password, phone, country, status }
 */
app.post(
  "/api/auth/register",
  authController.registerValidation,
  authController.register
);

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 */
app.post(
  "/api/auth/login",
  authController.loginValidation,
  authController.login
);

/**
 * Get current user profile (Protected)
 * GET /api/auth/me
 * Headers: { Authorization: Bearer <token> }
 */
app.get("/api/auth/me", verifyToken, authController.getProfile);

/**
 * Update user profile (Protected)
 * PUT /api/auth/profile
 * Headers: { Authorization: Bearer <token> }
 * Body: { name, phone, country, preferences }
 */
app.put("/api/auth/profile", verifyToken, authController.updateProfile);

console.log("✅ Authentication routes registered");

// ============================================
// FIELD MANAGEMENT ROUTES (Authentication Required)
// ============================================

/**
 * Create a new field with auto-generated field_id
 * POST /api/fields
 * Headers: { Authorization: Bearer <token> }
 * Body: { fieldBoundary, name, crop_type, planting_date, harvest_date, farm_name, location, notes, tags }
 */
app.post("/api/fields", verifyToken, fieldController.createField);

/**
 * Get all fields for authenticated user
 * GET /api/fields
 * Headers: { Authorization: Bearer <token> }
 * Query: { status, crop_type, limit, offset }
 */
app.get("/api/fields", verifyToken, fieldController.getFields);

/**
 * Get a single field by field_id
 * GET /api/fields/:field_id
 * Headers: { Authorization: Bearer <token> }
 */
app.get("/api/fields/:field_id", verifyToken, fieldController.getFieldById);

/**
 * Update a field
 * PUT /api/fields/:field_id
 * Headers: { Authorization: Bearer <token> }
 * Body: { name, crop_type, planting_date, harvest_date, farm_name, location, notes, tags, status }
 */
app.put("/api/fields/:field_id", verifyToken, fieldController.updateField);

/**
 * Delete a field
 * DELETE /api/fields/:field_id
 * Headers: { Authorization: Bearer <token> }
 */
app.delete("/api/fields/:field_id", verifyToken, fieldController.deleteField);

console.log("✅ Field management routes registered");

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API endpoint to get Earth Engine data
app.get("/api/ndvi", async (req, res) => {
  try {
    if (!eeInitialized) {
      return res.status(503).json({
        success: false,
        error:
          "Earth Engine not initialized yet. Please try again in a moment.",
      });
    }

    // Example: Get NDVI data for a region
    const geometry = ee.Geometry.Rectangle([-120, 40, -119, 41]); // Example coordinates
    const dataset = ee
      .ImageCollection("MODIS/006/MOD13Q1")
      .filterBounds(geometry)
      .filterDate("2023-01-01", "2023-12-31")
      .select("NDVI");

    const ndvi = dataset.mean();

    // Get the data URL for visualization
    const visParams = {
      min: 0,
      max: 9000,
      palette: ["blue", "white", "green"],
    };

    const mapId = ndvi.getMapId(visParams);

    res.json({
      success: true,
      mapId: mapId,
      message: "NDVI data retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching Earth Engine data:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// API endpoint to get satellite imagery
app.get("/api/satellite", async (req, res) => {
  try {
    if (!eeInitialized) {
      return res.status(503).json({
        success: false,
        error:
          "Earth Engine not initialized yet. Please try again in a moment.",
      });
    }

    // Example: Get Sentinel-2 satellite imagery
    const geometry = ee.Geometry.Rectangle([-120, 40, -119, 41]);
    const dataset = ee
      .ImageCollection("COPERNICUS/S2_SR")
      .filterBounds(geometry)
      .filterDate("2023-06-01", "2023-08-31")
      .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
      .select(["B4", "B3", "B2"]); // Red, Green, Blue bands

    const image = dataset.median();

    const visParams = {
      min: 0,
      max: 3000,
      gamma: 1.4,
    };

    const mapId = image.getMapId(visParams);

    res.json({
      success: true,
      mapId: mapId,
      message: "Satellite imagery retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching satellite data:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// NDVI Time Series Map endpoint - Generate NDVI maps for time series
// ⚠️ IMPORTANT: This MUST come BEFORE /api/field-analysis to avoid route shadowing
app.post(
  "/api/field-analysis/time-series-map",
  verifyToken,
  async (req, res) => {
    try {
      if (!eeInitialized || !ndviTimeSeriesMapService) {
        return res.status(503).json({
          success: false,
          error:
            "Earth Engine not initialized yet. Please try again in a moment.",
        });
      }

      const { fieldBoundary, fieldId, startDate, endDate, intervalDays } =
        req.body;

      // Validate input
      if (!fieldBoundary || !fieldId) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: fieldBoundary and fieldId",
        });
      }

      if (fieldBoundary.type !== "Polygon") {
        return res.status(400).json({
          success: false,
          error: "Only Polygon geometries are supported",
        });
      }

      // Set default dates if not provided
      const end = endDate || new Date().toISOString().split("T")[0];
      const start =
        startDate ||
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const interval = intervalDays || 10;

      console.log(
        `🗺️  Generating time series maps for field ${fieldId} from ${start} to ${end} with ${interval}-day intervals`
      );

      // Generate time series maps
      const mapsResult = await ndviTimeSeriesMapService.generateTimeSeriesMaps(
        fieldBoundary,
        fieldId,
        start,
        end,
        interval
      );

      res.json({
        success: true,
        data: mapsResult,
        message: "Time series maps generated successfully",
      });
    } catch (error) {
      console.error("Error generating time series maps:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// NDVI Time Series endpoint - Generate historical NDVI trends
// ⚠️ IMPORTANT: This MUST come BEFORE /api/field-analysis to avoid route shadowing
app.post("/api/field-analysis/time-series", verifyToken, async (req, res) => {
  try {
    if (!eeInitialized || !ndviTimeSeriesService) {
      return res.status(503).json({
        success: false,
        error:
          "Earth Engine not initialized yet. Please try again in a moment.",
      });
    }

    const { startDate, endDate, intervalDays } = req.body;

    // Resolve field boundary (from request or database)
    let resolvedData;
    try {
      resolvedData = await resolveFieldBoundary(req.body, req.user.user_id);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    const { fieldBoundary, fieldId, fromDatabase } = resolvedData;

    // Validate field boundary type
    if (fieldBoundary.type !== "Polygon") {
      return res.status(400).json({
        success: false,
        error: "Only Polygon geometries are supported",
      });
    }

    if (fromDatabase) {
      console.log(
        `📍 Using field boundary from database for time-series ${fieldId}`
      );
    }

    // Set default dates if not provided
    const end = endDate || new Date().toISOString().split("T")[0];
    const start =
      startDate ||
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    const interval = intervalDays || 10; // Default to 10 days

    console.log(
      `📈 Generating time series for field ${fieldId} from ${start} to ${end} with ${interval}-day intervals`
    );

    // Generate time series
    const timeSeriesResult = await ndviTimeSeriesService.generateTimeSeries(
      fieldBoundary,
      fieldId,
      start,
      end,
      interval
    );

    res.json({
      success: true,
      data: timeSeriesResult,
      message: "Time series generated successfully",
    });
  } catch (error) {
    console.error("Error generating time series:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// Field Analysis endpoint - Analyze NDVI for farm field boundaries
app.post("/api/field-analysis", verifyToken, async (req, res) => {
  try {
    if (!eeInitialized || !fieldAnalysisService) {
      return res.status(503).json({
        success: false,
        error:
          "Earth Engine not initialized yet. Please try again in a moment.",
      });
    }

    const { startDate, endDate, name, crop_type, farm_name, location } =
      req.body;

    // Resolve field boundary (from request or database)
    // This will auto-create a field with generated ID if fieldBoundary provided without fieldId
    let resolvedData;
    try {
      resolvedData = await resolveFieldBoundary(req.body, req.user.user_id, {
        autoCreate: true,
        fieldMetadata: { name, crop_type, farm_name, location },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    const { fieldBoundary, fieldId, fromDatabase, isNew } = resolvedData;

    // Validate field boundary type
    if (fieldBoundary.type !== "Polygon") {
      return res.status(400).json({
        success: false,
        error: "Only Polygon geometries are supported",
      });
    }

    // Log source of boundary
    if (isNew) {
      console.log(`🆕 Created new field with auto-generated ID: ${fieldId}`);
    } else if (fromDatabase) {
      console.log(`📍 Using field boundary from database for ${fieldId}`);
    } else {
      console.log(`📍 Using field boundary from request for ${fieldId}`);
    }

    // Set default dates if not provided
    const end = endDate || new Date().toISOString().split("T")[0];
    const start =
      startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    console.log(`📊 Analyzing field ${fieldId} from ${start} to ${end}`);

    // Perform analysis
    const analysisResult = await fieldAnalysisService.analyzeFieldNDVI(
      fieldBoundary,
      fieldId,
      start,
      end
    );

    // Save to MySQL if connected
    if (dbInitialized) {
      try {
        // Save or update field (upsert)
        const [field, created] = await models.Field.findOrCreate({
          where: { field_id: fieldId },
          defaults: {
            field_id: fieldId,
            user_id: req.user.user_id,
            boundary_type: fieldBoundary.type,
            boundary_coordinates: JSON.stringify(fieldBoundary.coordinates),
            area_sqm: analysisResult.hectares * 10000,
            area_hectares: analysisResult.hectares,
            status: "active",
          },
        });

        if (!created) {
          // Update existing field
          await field.update({
            user_id: req.user.user_id,
            boundary_type: fieldBoundary.type,
            boundary_coordinates: JSON.stringify(fieldBoundary.coordinates),
            area_sqm: analysisResult.hectares * 10000,
            area_hectares: analysisResult.hectares,
          });
        }

        // Save field analysis
        await models.FieldAnalysis.create({
          field_id: fieldId,
          user_id: req.user.user_id,
          analysis_date: new Date(analysisResult.date),
          ndvi_mean: analysisResult.ndvi.mean,
          ndvi_std: analysisResult.ndvi.std,
          ndvi_min: analysisResult.ndvi.min,
          ndvi_max: analysisResult.ndvi.max,
          ndvi_median: analysisResult.ndvi.median,
          ndvi_percentile_25: analysisResult.ndvi.percentile_25,
          ndvi_percentile_75: analysisResult.ndvi.percentile_75,
          cloud_cover: analysisResult.quality.cloud_cover,
          pixel_count: analysisResult.quality.pixel_count,
          data_source: analysisResult.quality.data_source,
          acquisition_date: analysisResult.quality.acquisition_date,
          confidence: analysisResult.quality.confidence,
          interpretation_status: analysisResult.interpretation.status,
          interpretation_description: analysisResult.interpretation.description,
          interpretation_color: analysisResult.interpretation.color,
          interpretation_recommendation:
            analysisResult.interpretation.recommendation,
          hectares: analysisResult.hectares,
          satellite_platform: "Sentinel-2",
          satellite_sensor: "MSI",
          satellite_resolution: "10m",
          satellite_bands: JSON.stringify(["B4", "B8"]),
        });
        console.log(
          `✅ Field analysis saved to MySQL for ${fieldId} by user ${req.user.email}`
        );
      } catch (dbError) {
        console.error("❌ Error saving to MySQL:", dbError.message);
        // Continue without failing the request
      }
    }

    res.json({
      success: true,
      data: analysisResult,
      field_id: fieldId,
      is_new_field: isNew || false,
      message: isNew
        ? `Field created with ID: ${fieldId}. Analysis completed successfully.`
        : "Field analysis completed successfully",
      saved_to_db: dbInitialized,
    });
  } catch (error) {
    console.error("Error analyzing field:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 2-Year NDVI Time Series endpoint
app.post(
  "/api/field-analysis/two-year-time-series",
  verifyToken,
  async (req, res) => {
    try {
      if (!eeInitialized || !ndviTwoYearTimeSeriesService) {
        return res.status(503).json({
          success: false,
          error:
            "Earth Engine not initialized yet. Please try again in a moment.",
        });
      }

      const { fieldBoundary, fieldId, intervalType } = req.body;

      // Validate input
      if (!fieldBoundary || !fieldId) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: fieldBoundary and fieldId",
        });
      }

      if (fieldBoundary.type !== "Polygon") {
        return res.status(400).json({
          success: false,
          error: "Only Polygon geometries are supported",
        });
      }

      const interval = intervalType || "monthly"; // Default to monthly

      console.log(
        `📊 Generating 2-year time series for field ${fieldId} with ${interval} intervals`
      );

      // Generate 2-year time series
      const timeSeriesResult =
        await ndviTwoYearTimeSeriesService.generateTwoYearTimeSeries(
          fieldBoundary,
          fieldId,
          interval
        );

      // Save images to server and get download URLs
      console.log(`💾 Saving time series images for field ${fieldId}...`);
      const enhancedResult =
        await timeSeriesImageStorageService.saveTimeSeriesImages(
          timeSeriesResult,
          fieldId,
          fieldBoundary
        );

      res.json({
        success: true,
        data: enhancedResult,
        message: "2-year time series generated and images saved successfully",
      });
    } catch (error) {
      console.error("Error generating 2-year time series:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// NDVI Field Image endpoint
app.post("/api/field-analysis/field-image", verifyToken, async (req, res) => {
  try {
    if (!eeInitialized || !ndviTwoYearTimeSeriesService) {
      return res.status(503).json({
        success: false,
        error:
          "Earth Engine not initialized yet. Please try again in a moment.",
      });
    }

    const { fieldBoundary, fieldId, date } = req.body;

    // Validate input
    if (!fieldBoundary || !fieldId || !date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fieldBoundary, fieldId, and date",
      });
    }

    if (fieldBoundary.type !== "Polygon") {
      return res.status(400).json({
        success: false,
        error: "Only Polygon geometries are supported",
      });
    }

    console.log(`🖼️  Generating field image for field ${fieldId} on ${date}`);

    // Generate field image
    const fieldImage = await ndviTwoYearTimeSeriesService.generateFieldImage(
      fieldBoundary,
      fieldId,
      date
    );

    res.json({
      success: true,
      data: fieldImage,
      message: "Field image generated successfully",
    });
  } catch (error) {
    console.error("Error generating field image:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update Field Data endpoint
app.post("/api/field-analysis/update-field", verifyToken, async (req, res) => {
  try {
    if (!eeInitialized || !fieldDataUpdateService) {
      return res.status(503).json({
        success: false,
        error:
          "Earth Engine not initialized yet. Please try again in a moment.",
      });
    }

    const { fieldId, newBoundary, metadata } = req.body;

    // Validate input
    if (!fieldId || !newBoundary) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fieldId and newBoundary",
      });
    }

    console.log(`✏️  Updating field ${fieldId}`);

    // Update field boundary
    const updateResult = await fieldDataUpdateService.updateFieldBoundary(
      fieldId,
      newBoundary,
      metadata
    );

    res.json({
      success: true,
      data: updateResult,
      message: "Field updated successfully",
    });
  } catch (error) {
    console.error("Error updating field:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Recalculate NDVI endpoint
app.post(
  "/api/field-analysis/recalculate-ndvi",
  verifyToken,
  async (req, res) => {
    try {
      if (!eeInitialized || !fieldDataUpdateService) {
        return res.status(503).json({
          success: false,
          error:
            "Earth Engine not initialized yet. Please try again in a moment.",
        });
      }

      const { fieldId, date } = req.body;

      // Validate input
      if (!fieldId || !date) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: fieldId and date",
        });
      }

      console.log(`🔄 Recalculating NDVI for field ${fieldId} on ${date}`);

      // Recalculate NDVI
      const recalculateResult = await fieldDataUpdateService.recalculateNDVI(
        fieldId,
        date
      );

      res.json({
        success: true,
        data: recalculateResult,
        message: "NDVI recalculated successfully",
      });
    } catch (error) {
      console.error("Error recalculating NDVI:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get Field Data endpoint
app.get("/api/field-analysis/field-data/:fieldId", (req, res) => {
  try {
    if (!fieldDataUpdateService) {
      return res.status(503).json({
        success: false,
        error: "Field Data Update Service not initialized",
      });
    }

    const { fieldId } = req.params;
    const fieldData = fieldDataUpdateService.getFieldData(fieldId);

    res.json({
      success: true,
      data: fieldData,
      message: "Field data retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving field data:", error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// Get Change History endpoint
app.get("/api/field-analysis/change-history/:fieldId", (req, res) => {
  try {
    if (!fieldDataUpdateService) {
      return res.status(503).json({
        success: false,
        error: "Field Data Update Service not initialized",
      });
    }

    const { fieldId } = req.params;
    const history = fieldDataUpdateService.getChangeHistory(fieldId);

    res.json({
      success: true,
      data: history,
      message: "Change history retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving change history:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// NDVI Image Export & Storage Endpoints
// ============================================

/**
 * Export and store NDVI image
 * POST /api/field-analysis/export-ndvi-image
 */
app.post(
  "/api/field-analysis/export-ndvi-image",
  verifyToken,
  async (req, res) => {
    try {
      if (!eeInitialized) {
        return res.status(503).json({
          success: false,
          error: "Earth Engine not initialized yet",
        });
      }

      const { fieldBoundary, fieldId, date } = req.body;

      if (!fieldBoundary || !fieldId || !date) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters: fieldBoundary, fieldId, date",
        });
      }

      const result = await ndviImageExportService.exportAndStoreNDVIImage(
        fieldBoundary,
        fieldId,
        date
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error exporting NDVI image:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Get stored NDVI image metadata
 * GET /api/field-analysis/stored-image/:filename
 */
app.get("/api/field-analysis/stored-image/:filename", (req, res) => {
  try {
    if (!ndviImageExportService) {
      return res.status(503).json({
        success: false,
        error: "Image export service not initialized",
      });
    }

    const metadata = ndviImageExportService.getStoredImage(req.params.filename);
    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error("Error getting stored image:", error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * List all stored NDVI images
 * GET /api/field-analysis/stored-images
 * Query params: fieldId (optional)
 */
app.get("/api/field-analysis/stored-images", (req, res) => {
  try {
    if (!ndviImageExportService) {
      return res.status(503).json({
        success: false,
        error: "Image export service not initialized",
      });
    }

    const { fieldId } = req.query;
    const images = ndviImageExportService.listStoredImages(fieldId);

    res.json({
      success: true,
      data: {
        total: images.length,
        images: images,
      },
    });
  } catch (error) {
    console.error("Error listing stored images:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Delete stored NDVI image
 * DELETE /api/field-analysis/stored-image/:filename
 */
app.delete("/api/field-analysis/stored-image/:filename", (req, res) => {
  try {
    if (!ndviImageExportService) {
      return res.status(503).json({
        success: false,
        error: "Image export service not initialized",
      });
    }

    const result = ndviImageExportService.deleteStoredImage(
      req.params.filename
    );
    res.json(result);
  } catch (error) {
    console.error("Error deleting stored image:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get storage statistics
 * GET /api/field-analysis/storage-stats
 */
app.get("/api/field-analysis/storage-stats", (req, res) => {
  try {
    if (!ndviImageExportService) {
      return res.status(503).json({
        success: false,
        error: "Image export service not initialized",
      });
    }

    const stats = ndviImageExportService.getStorageStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting storage stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Time Series Image Management Endpoints
 */

// Get time series metadata
app.get("/api/field-analysis/time-series/:seriesId", (req, res) => {
  try {
    if (!timeSeriesImageStorageService) {
      return res.status(503).json({
        success: false,
        error: "Storage service not initialized",
      });
    }

    const metadata = timeSeriesImageStorageService.getSeriesMetadata(
      req.params.seriesId
    );
    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error("Error getting series metadata:", error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// List all time series
app.get("/api/field-analysis/time-series-list", (req, res) => {
  try {
    if (!timeSeriesImageStorageService) {
      return res.status(503).json({
        success: false,
        error: "Storage service not initialized",
      });
    }

    const { fieldId } = req.query;
    const series = timeSeriesImageStorageService.listStoredSeries(fieldId);
    res.json({
      success: true,
      data: {
        total: series.length,
        series: series,
      },
    });
  } catch (error) {
    console.error("Error listing time series:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get time series storage statistics
app.get("/api/field-analysis/time-series-stats", (req, res) => {
  try {
    if (!timeSeriesImageStorageService) {
      return res.status(503).json({
        success: false,
        error: "Storage service not initialized",
      });
    }

    const stats = timeSeriesImageStorageService.getStorageStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting time series stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete time series
app.delete("/api/field-analysis/time-series/:seriesId", (req, res) => {
  try {
    if (!timeSeriesImageStorageService) {
      return res.status(503).json({
        success: false,
        error: "Storage service not initialized",
      });
    }

    const result = timeSeriesImageStorageService.deleteStoredSeries(
      req.params.seriesId
    );
    res.json(result);
  } catch (error) {
    console.error("Error deleting time series:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get NDVI Legend/Scale
app.get("/api/ndvi-legend", (_, res) => {
  try {
    if (!ndviLegendService) {
      return res.status(503).json({
        success: false,
        error: "Legend service not initialized",
      });
    }

    res.json({
      success: true,
      data: ndviLegendService.getLegendJSON(),
      html: ndviLegendService.getLegendHTML(),
      css: ndviLegendService.getLegendCSS(),
    });
  } catch (error) {
    console.error("Error getting NDVI legend:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get NDVI Color Visualization Information
app.get("/api/ndvi-color-visualization", (_, res) => {
  try {
    if (!ndviTwoYearTimeSeriesService) {
      return res.status(503).json({
        success: false,
        error: "NDVI service not initialized",
      });
    }

    const colorVizService =
      ndviTwoYearTimeSeriesService.colorVisualizationService;

    res.json({
      success: true,
      data: {
        scale: colorVizService.getNDVIScale(),
        legend: colorVizService.getLegendData(),
        visualization_params: colorVizService.getVisualizationParams(),
        description:
          "NDVI Color Visualization with proper color mapping for each range",
      },
    });
  } catch (error) {
    console.error("Error getting NDVI color visualization:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Generate NDVI Chart with Water, Vegetation, and Soil Analysis
 * POST /api/field-analysis/ndvi-chart
 *
 * Request Body:
 * {
 *   "fieldBoundary": { "type": "Polygon", "coordinates": [...] },
 *   "fieldId": "string",
 *   "startDate": "YYYY-MM-DD",
 *   "endDate": "YYYY-MM-DD",
 *   "interval": "daily|weekly|monthly|quarterly" (optional, default: monthly)
 * }
 */
app.post("/api/field-analysis/ndvi-chart", verifyToken, async (req, res) => {
  try {
    if (!ndviChartService) {
      return res.status(503).json({
        success: false,
        error: "NDVI Chart Service not initialized",
      });
    }

    const { startDate, endDate, interval } = req.body;

    // Validate required date fields
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: startDate, endDate",
      });
    }

    // Resolve field boundary (from request or database)
    let resolvedData;
    try {
      resolvedData = await resolveFieldBoundary(req.body, req.user.user_id);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    const { fieldBoundary, fieldId, fromDatabase } = resolvedData;

    if (fromDatabase) {
      console.log(
        `📍 Using field boundary from database for NDVI chart ${fieldId}`
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: "startDate must be before endDate",
      });
    }

    console.log(`📊 Generating NDVI chart for field ${fieldId}`);

    // Generate NDVI chart
    const chartData = await ndviChartService.generateNDVIChart(
      fieldBoundary,
      fieldId,
      startDate,
      endDate,
      interval || "monthly"
    );

    res.json(chartData);
  } catch (error) {
    console.error("Error generating NDVI chart:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Flood Detection API
 * POST /api/field-analysis/flood-detection
 *
 * Detects current flood status and historical floods for a field
 * Uses Sentinel-1 SAR imagery for water extent analysis
 */
app.post(
  "/api/field-analysis/flood-detection",
  verifyToken,
  async (req, res) => {
    try {
      if (!floodDetectionService) {
        return res.status(503).json({
          success: false,
          error: "Flood Detection Service not initialized",
        });
      }

      const { currentDate } = req.body;

      // Resolve field boundary (from request or database)
      let resolvedData;
      try {
        resolvedData = await resolveFieldBoundary(req.body, req.user.user_id);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      const { fieldBoundary, fieldId, fromDatabase } = resolvedData;

      if (fromDatabase) {
        console.log(
          `📍 Using field boundary from database for flood detection ${fieldId}`
        );
      }

      console.log(`🌊 Detecting floods for field ${fieldId}`);

      // Detect floods
      const floodData = await floodDetectionService.detectFloods(
        fieldBoundary,
        fieldId,
        currentDate
      );

      res.json(floodData);
    } catch (error) {
      console.error("Error detecting floods:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Flood Time Series API
 * POST /api/field-analysis/flood-time-series
 *
 * Generates flood time series data for a field
 * Shows water extent changes over time
 */
app.post(
  "/api/field-analysis/flood-time-series",
  verifyToken,
  async (req, res) => {
    try {
      if (!floodDetectionService) {
        return res.status(503).json({
          success: false,
          error: "Flood Detection Service not initialized",
        });
      }

      const { startDate, endDate, intervalDays } = req.body;

      // Validate required date fields
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: startDate, endDate",
        });
      }

      // Resolve field boundary (from request or database)
      let resolvedData;
      try {
        resolvedData = await resolveFieldBoundary(req.body, req.user.user_id);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      const { fieldBoundary, fieldId, fromDatabase } = resolvedData;

      if (fromDatabase) {
        console.log(
          `📍 Using field boundary from database for flood time-series ${fieldId}`
        );
      }

      // Validate field boundary
      if (!fieldBoundary.type || !fieldBoundary.coordinates) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid fieldBoundary format. Must be a GeoJSON Polygon or MultiPolygon",
        });
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD",
        });
      }

      if (start >= end) {
        return res.status(400).json({
          success: false,
          error: "startDate must be before endDate",
        });
      }

      console.log(`📊 Generating flood time series for field ${fieldId}`);

      // Generate flood time series
      const timeSeriesData =
        await floodDetectionService.generateFloodTimeSeries(
          fieldBoundary,
          fieldId,
          startDate,
          endDate,
          intervalDays || 30
        );

      res.json(timeSeriesData);
    } catch (error) {
      console.error("Error generating flood time series:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Crop Growth Tracking API
 * POST /api/crop-analysis/track-growth
 *
 * Track crop growth stages and phenology
 */
app.post("/api/crop-analysis/track-growth", verifyToken, async (req, res) => {
  try {
    if (!cropGrowthTrackingService) {
      return res.status(503).json({
        success: false,
        error: "Crop Growth Tracking Service not initialized",
      });
    }

    const { cropType, plantingDate, currentDate } = req.body;

    // Validate required fields
    if (!cropType || !plantingDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: cropType, plantingDate",
      });
    }

    // Resolve field boundary (from request or database)
    let resolvedData;
    try {
      resolvedData = await resolveFieldBoundary(req.body, req.user.user_id);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    const { fieldBoundary, fieldId, fromDatabase } = resolvedData;

    if (fromDatabase) {
      console.log(
        `📍 Using field boundary from database for crop growth tracking ${fieldId}`
      );
    }

    console.log(`🌱 Tracking crop growth for ${cropType} in field ${fieldId}`);

    const growthData = await cropGrowthTrackingService.trackCropGrowth(
      fieldBoundary,
      fieldId,
      cropType,
      plantingDate,
      currentDate
    );

    res.json(growthData);
  } catch (error) {
    console.error("Error tracking crop growth:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Crop Type Classification API
 * POST /api/crop-analysis/classify-crop
 *
 * Classify crop type based on NDVI pattern
 */
app.post("/api/crop-analysis/classify-crop", verifyToken, async (req, res) => {
  try {
    if (!cropGrowthTrackingService) {
      return res.status(503).json({
        success: false,
        error: "Crop Growth Tracking Service not initialized",
      });
    }

    const { fieldBoundary, fieldId, startDate, endDate } = req.body;

    if (!fieldBoundary || !fieldId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: fieldBoundary, fieldId, startDate, endDate",
      });
    }

    console.log(`🔍 Classifying crop type for field ${fieldId}`);

    const classificationData = await cropGrowthTrackingService.classifyCropType(
      fieldBoundary,
      fieldId,
      startDate,
      endDate
    );

    res.json(classificationData);
  } catch (error) {
    console.error("Error classifying crop type:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Crop Performance Analytics API
 * POST /api/crop-analysis/performance
 *
 * Analyze crop performance with yield estimation
 */
app.post("/api/crop-analysis/performance", verifyToken, async (req, res) => {
  try {
    if (!cropAnalyticsService) {
      return res.status(503).json({
        success: false,
        error: "Crop Analytics Service not initialized",
      });
    }

    const { fieldBoundary, fieldId, cropType, startDate, endDate, fieldArea } =
      req.body;

    if (
      !fieldBoundary ||
      !fieldId ||
      !cropType ||
      !startDate ||
      !endDate ||
      !fieldArea
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: fieldBoundary, fieldId, cropType, startDate, endDate, fieldArea",
      });
    }

    console.log(
      `📊 Analyzing crop performance for ${cropType} in field ${fieldId}`
    );

    const performanceData = await cropAnalyticsService.analyzeCropPerformance(
      fieldBoundary,
      fieldId,
      cropType,
      startDate,
      endDate,
      fieldArea
    );

    res.json(performanceData);
  } catch (error) {
    console.error("Error analyzing crop performance:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Crop Yield Estimation API
 * POST /api/crop-analysis/estimate-yield
 *
 * Estimate crop yield based on NDVI
 */
app.post("/api/crop-analysis/estimate-yield", verifyToken, async (req, res) => {
  try {
    if (!cropAnalyticsService) {
      return res.status(503).json({
        success: false,
        error: "Crop Analytics Service not initialized",
      });
    }

    const { fieldBoundary, fieldId, cropType, startDate, endDate, fieldArea } =
      req.body;

    if (
      !fieldBoundary ||
      !fieldId ||
      !cropType ||
      !startDate ||
      !endDate ||
      !fieldArea
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: fieldBoundary, fieldId, cropType, startDate, endDate, fieldArea",
      });
    }

    console.log(`🌾 Estimating yield for ${cropType} in field ${fieldId}`);

    const yieldData = await cropAnalyticsService.estimateYield(
      fieldBoundary,
      fieldId,
      cropType,
      startDate,
      endDate,
      fieldArea
    );

    res.json(yieldData);
  } catch (error) {
    console.error("Error estimating yield:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Crop Stress Detection API
 * POST /api/crop-analysis/detect-stress
 *
 * Detect crop stress events
 */
app.post("/api/crop-analysis/detect-stress", verifyToken, async (req, res) => {
  try {
    if (!cropAnalyticsService) {
      return res.status(503).json({
        success: false,
        error: "Crop Analytics Service not initialized",
      });
    }

    const { startDate, endDate } = req.body;

    // Validate required date fields
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: startDate, endDate",
      });
    }

    // Resolve field boundary (from request or database)
    let resolvedData;
    try {
      resolvedData = await resolveFieldBoundary(req.body, req.user.user_id);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    const { fieldBoundary, fieldId, fromDatabase } = resolvedData;

    if (fromDatabase) {
      console.log(
        `📍 Using field boundary from database for stress detection ${fieldId}`
      );
    }

    console.log(`🔍 Detecting stress for field ${fieldId}`);

    const stressData = await cropAnalyticsService.detectStress(
      fieldBoundary,
      fieldId,
      startDate,
      endDate
    );

    res.json(stressData);
  } catch (error) {
    console.error("Error detecting stress:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Crop Yield Prediction API
 * POST /api/crop-analysis/predict-yield
 *
 * Predict crop yield with growth forecasting
 */
app.post("/api/crop-analysis/predict-yield", verifyToken, async (req, res) => {
  try {
    if (!cropPredictionService) {
      return res.status(503).json({
        success: false,
        error: "Crop Prediction Service not initialized",
      });
    }

    const {
      fieldBoundary,
      fieldId,
      cropType,
      plantingDate,
      currentDate,
      fieldArea,
      historicalYield,
    } = req.body;

    if (
      !fieldBoundary ||
      !fieldId ||
      !cropType ||
      !plantingDate ||
      !currentDate ||
      !fieldArea
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: fieldBoundary, fieldId, cropType, plantingDate, currentDate, fieldArea",
      });
    }

    console.log(`🔮 Predicting yield for ${cropType} in field ${fieldId}`);

    const predictionData = await cropPredictionService.predictCropYield(
      fieldBoundary,
      fieldId,
      cropType,
      plantingDate,
      currentDate,
      fieldArea,
      historicalYield
    );

    res.json(predictionData);
  } catch (error) {
    console.error("Error predicting yield:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Crop Growth Forecast API
 * POST /api/crop-analysis/forecast-growth
 *
 * Forecast future crop growth
 */
app.post(
  "/api/crop-analysis/forecast-growth",
  verifyToken,
  async (req, res) => {
    try {
      if (!cropPredictionService) {
        return res.status(503).json({
          success: false,
          error: "Crop Prediction Service not initialized",
        });
      }

      const {
        fieldBoundary,
        fieldId,
        cropType,
        plantingDate,
        currentDate,
        forecastDays,
      } = req.body;

      if (
        !fieldBoundary ||
        !fieldId ||
        !cropType ||
        !plantingDate ||
        !currentDate
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: fieldBoundary, fieldId, cropType, plantingDate, currentDate",
        });
      }

      console.log(`📈 Forecasting growth for ${cropType} in field ${fieldId}`);

      const forecastData = await cropPredictionService.forecastGrowth(
        fieldBoundary,
        fieldId,
        cropType,
        plantingDate,
        currentDate,
        forecastDays || 30
      );

      res.json(forecastData);
    } catch (error) {
      console.error("Error forecasting growth:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Comprehensive Crop Chart API
 * POST /api/crop-analysis/crop-chart
 *
 * Generate comprehensive crop chart with NDVI and crop data
 */
app.post("/api/crop-analysis/crop-chart", verifyToken, async (req, res) => {
  try {
    if (!cropChartService) {
      return res.status(503).json({
        success: false,
        error: "Crop Chart Service not initialized",
      });
    }

    const {
      fieldBoundary,
      fieldId,
      cropType,
      plantingDate,
      currentDate,
      fieldArea,
    } = req.body;

    if (
      !fieldBoundary ||
      !fieldId ||
      !cropType ||
      !plantingDate ||
      !currentDate ||
      !fieldArea
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: fieldBoundary, fieldId, cropType, plantingDate, currentDate, fieldArea",
      });
    }

    console.log(
      `📊 Generating comprehensive crop chart for ${cropType} in field ${fieldId}`
    );

    const chartData = await cropChartService.generateCropChart(
      fieldBoundary,
      fieldId,
      cropType,
      plantingDate,
      currentDate,
      fieldArea
    );

    res.json(chartData);
  } catch (error) {
    console.error("Error generating crop chart:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Generate Zone Image with NDVI, Zones, and Crop Yield
 * POST /api/field-analysis/zone-image
 *
 * Request body:
 * {
 *   "fieldBoundary": { GeoJSON polygon },
 *   "fieldId": "FIELD-001",
 *   "date": "2024-10-26",
 *   "gridSize": 50,
 *   "cropType": "rice"
 * }
 */
app.post("/api/field-analysis/zone-image", verifyToken, async (req, res) => {
  try {
    if (!eeInitialized || !zoneImageGenerationService) {
      return res.status(503).json({
        success: false,
        error:
          "Zone Image Generation Service not initialized yet. Please try again in a moment.",
      });
    }

    const { date, gridSize, cropType } = req.body;

    // Resolve field boundary (from request or database)
    let resolvedData;
    try {
      resolvedData = await resolveFieldBoundary(req.body, req.user.user_id);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    const { fieldBoundary, fieldId, fromDatabase } = resolvedData;

    if (fromDatabase) {
      console.log(
        `📍 Using field boundary from database for zone image ${fieldId}`
      );
    }

    // Use current date if not provided
    const analysisDate = date || new Date().toISOString().split("T")[0];
    const gridSizeMeters = gridSize || 50;
    const crop = cropType || "rice";

    console.log(
      `📊 Generating zone image for field ${fieldId} with ${crop} crop...`
    );

    const result = await zoneImageGenerationService.generateZoneImage(
      fieldBoundary,
      fieldId,
      analysisDate,
      gridSizeMeters,
      crop
    );

    res.json(result);
  } catch (error) {
    console.error("Error generating zone image:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get Zone Image Metadata
 * GET /api/field-analysis/zone-image/:imageId
 */
app.get("/api/field-analysis/zone-image/:imageId", (req, res) => {
  try {
    const { imageId } = req.params;
    const metadataPath = path.join(
      __dirname,
      "public",
      "zone-images",
      imageId,
      "metadata.json"
    );

    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({
        success: false,
        error: "Zone image not found",
      });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    res.json({
      success: true,
      metadata: metadata,
    });
  } catch (error) {
    console.error("Error retrieving zone image metadata:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * List All Zone Images
 * GET /api/field-analysis/zone-images
 */
app.get("/api/field-analysis/zone-images", (req, res) => {
  try {
    const indexPath = path.join(
      __dirname,
      "public",
      "zone-images",
      "index.json"
    );

    if (!fs.existsSync(indexPath)) {
      return res.json({
        success: true,
        images: [],
      });
    }

    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    res.json({
      success: true,
      images: index.images,
    });
  } catch (error) {
    console.error("Error listing zone images:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    earthEngineInitialized: eeInitialized,
  });
});

// Earth Engine status endpoint
app.get("/api/ee-status", (_, res) => {
  res.json({
    initialized: eeInitialized,
    projectId: "marine-pillar-465804-p5",
    message: eeInitialized
      ? "Earth Engine is ready"
      : "Earth Engine is initializing...",
  });
});

// Serve static files AFTER all API routes
app.use(express.static("public"));

// Start server
app.listen(PORT, () => {
  console.log(
    `🌍 Google Earth Engine Server running on http://localhost:${PORT}`
  );
  console.log(`📍 Open your browser and navigate to http://localhost:${PORT}`);
  console.log(
    `\n⚠️  Note: To use Earth Engine data, you need to authenticate first:`
  );
  console.log(`   Run: npx ee authenticate`);
});
