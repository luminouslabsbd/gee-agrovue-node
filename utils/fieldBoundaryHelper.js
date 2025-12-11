/**
 * Field Boundary Helper Utility
 *
 * This utility provides functions to retrieve field boundaries from the database
 * and validate field boundary data. This allows APIs to accept either:
 * 1. Full fieldBoundary object (for first-time requests)
 * 2. Just fieldId (for subsequent requests - boundary fetched from DB)
 */

const models = require("../models");

/**
 * Get field boundary from database by fieldId
 *
 * @param {string} fieldId - The unique field identifier
 * @param {string} userId - The user ID (for authorization check)
 * @returns {Promise<Object>} - GeoJSON boundary object
 * @throws {Error} - If field not found or user not authorized
 */
async function getFieldBoundaryById(fieldId, userId = null) {
  try {
    // Build query
    const whereClause = { field_id: fieldId };

    // Add user filter if userId provided (for authorization)
    if (userId) {
      whereClause.user_id = userId;
    }

    // Fetch field from database
    const field = await models.Field.findOne({
      where: whereClause,
      attributes: [
        "field_id",
        "user_id",
        "boundary_type",
        "boundary_coordinates",
        "area_hectares",
        "status",
      ],
    });

    if (!field) {
      if (userId) {
        throw new Error(
          `Field '${fieldId}' not found or you don't have access to it`
        );
      } else {
        throw new Error(`Field '${fieldId}' not found in database`);
      }
    }

    // Check if field is active
    if (field.status !== "active") {
      throw new Error(
        `Field '${fieldId}' is ${field.status}. Only active fields can be analyzed.`
      );
    }

    // Reconstruct GeoJSON boundary
    const boundary = {
      type: field.boundary_type,
      coordinates: JSON.parse(field.boundary_coordinates),
    };

    return boundary;
  } catch (error) {
    console.error(
      `❌ Error fetching field boundary for ${fieldId}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Resolve field boundary from request
 *
 * This function handles three scenarios:
 * 1. If fieldBoundary is provided WITHOUT fieldId, create a new field with auto-generated ID
 * 2. If fieldBoundary is provided WITH fieldId, save/update the field and use it
 * 3. If only fieldId is provided, fetch boundary from database
 *
 * @param {Object} requestBody - The request body containing fieldBoundary and/or fieldId
 * @param {string} userId - The user ID (for authorization check)
 * @param {Object} options - Additional options { autoCreate: boolean, fieldMetadata: object }
 * @returns {Promise<Object>} - Object containing { fieldBoundary, fieldId, fromDatabase, isNew }
 * @throws {Error} - If neither fieldBoundary nor fieldId is provided, or if field not found
 */
async function resolveFieldBoundary(requestBody, userId = null, options = {}) {
  const { fieldBoundary, fieldId } = requestBody;
  const { autoCreate = true, fieldMetadata = {} } = options;

  // Validate that at least one is provided
  if (!fieldBoundary && !fieldId) {
    throw new Error("Either fieldBoundary or fieldId must be provided");
  }

  // Scenario 1 & 2: If fieldBoundary is provided
  if (fieldBoundary) {
    // Validate fieldBoundary structure
    if (!fieldBoundary.type || !fieldBoundary.coordinates) {
      throw new Error(
        "Invalid fieldBoundary format. Must be a GeoJSON object with type and coordinates"
      );
    }

    // If fieldId is provided, check if field exists and update it
    if (fieldId) {
      try {
        const existingField = await models.Field.findOne({
          where: { field_id: fieldId, user_id: userId },
        });

        if (existingField) {
          // Field exists, return it
          console.log(`📍 Using existing field ${fieldId}`);
          return {
            fieldBoundary,
            fieldId,
            fromDatabase: false,
            isNew: false,
          };
        }
      } catch (error) {
        // Field doesn't exist, will create below if autoCreate is true
      }
    }

    // If no fieldId or field doesn't exist, create new field if autoCreate is enabled
    if (autoCreate && userId) {
      console.log(`🆕 Creating new field with auto-generated ID...`);

      const newField = await models.Field.createField({
        fieldBoundary,
        user_id: userId,
        ...fieldMetadata,
      });

      console.log(`✅ Created new field with ID: ${newField.field_id}`);

      return {
        fieldBoundary,
        fieldId: newField.field_id,
        fromDatabase: false,
        isNew: true,
      };
    }

    // If autoCreate is disabled, return with temp ID
    return {
      fieldBoundary,
      fieldId: fieldId || "TEMP-" + Date.now(),
      fromDatabase: false,
      isNew: false,
    };
  }

  // Scenario 3: If only fieldId is provided, fetch from database
  if (fieldId && !fieldBoundary) {
    console.log(`🔍 Fetching field boundary for ${fieldId} from database...`);

    const fetchedBoundary = await getFieldBoundaryById(fieldId, userId);

    console.log(`✅ Field boundary retrieved from database for ${fieldId}`);

    return {
      fieldBoundary: fetchedBoundary,
      fieldId,
      fromDatabase: true,
      isNew: false,
    };
  }

  // This should never happen, but just in case
  throw new Error("Unable to resolve field boundary");
}

/**
 * Validate field boundary format
 *
 * @param {Object} fieldBoundary - GeoJSON boundary object
 * @returns {Object} - Validation result { valid: boolean, error: string }
 */
function validateFieldBoundary(fieldBoundary) {
  if (!fieldBoundary) {
    return { valid: false, error: "Field boundary is required" };
  }

  if (!fieldBoundary.type) {
    return { valid: false, error: "Field boundary must have a type property" };
  }

  if (!fieldBoundary.coordinates) {
    return {
      valid: false,
      error: "Field boundary must have coordinates property",
    };
  }

  // Validate supported types
  const supportedTypes = ["Polygon", "MultiPolygon"];
  if (!supportedTypes.includes(fieldBoundary.type)) {
    return {
      valid: false,
      error: `Field boundary type '${
        fieldBoundary.type
      }' is not supported. Supported types: ${supportedTypes.join(", ")}`,
    };
  }

  // Validate coordinates structure
  if (!Array.isArray(fieldBoundary.coordinates)) {
    return {
      valid: false,
      error: "Field boundary coordinates must be an array",
    };
  }

  if (fieldBoundary.coordinates.length === 0) {
    return {
      valid: false,
      error: "Field boundary coordinates cannot be empty",
    };
  }

  return { valid: true, error: null };
}

/**
 * Get field metadata by fieldId
 *
 * @param {string} fieldId - The unique field identifier
 * @param {string} userId - The user ID (for authorization check)
 * @returns {Promise<Object>} - Field metadata
 */
async function getFieldMetadata(fieldId, userId = null) {
  try {
    const whereClause = { field_id: fieldId };

    if (userId) {
      whereClause.user_id = userId;
    }

    const field = await models.Field.findOne({
      where: whereClause,
    });

    if (!field) {
      throw new Error(`Field '${fieldId}' not found`);
    }

    return field.toJSON();
  } catch (error) {
    console.error(
      `❌ Error fetching field metadata for ${fieldId}:`,
      error.message
    );
    throw error;
  }
}

module.exports = {
  getFieldBoundaryById,
  resolveFieldBoundary,
  validateFieldBoundary,
  getFieldMetadata,
};
