/**
 * Field Controller
 * Handles field creation, retrieval, update, and deletion
 */

const Field = require('../models/Field');
const { validationResult } = require('express-validator');

/**
 * Create a new field with auto-generated field_id
 * POST /api/fields
 */
exports.createField = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fieldBoundary, name, crop_type, planting_date, harvest_date, farm_name, location, notes, tags, field_id } = req.body;
    const user_id = req?.user?.user_id ?? null;

    // Validate field boundary
    if (!fieldBoundary || !fieldBoundary.coordinates) {
      return res.status(400).json({
        success: false,
        error: 'Field boundary is required with coordinates'
      });
    }

    if (fieldBoundary.type !== 'Polygon') {
      return res.status(400).json({
        success: false,
        error: 'Only Polygon geometries are supported'
      });
    }

    const fieldExsit = await Field.findOne({
      where: { field_id }
    });

    if (fieldExsit) {
      return res.status(409).json({
        success: false,
        error: 'Conflict, this data alredy exist against this field id'
      });
    }

    // Create field using static method (auto-generates field_id)
    const field = await Field.createField({
      fieldBoundary,
      user_id,
      name,
      crop_type,
      planting_date,
      harvest_date,
      farm_name,
      location,
      notes,
      tags,
      field_id
    });

    res.status(201).json({
      success: true,
      message: 'Field created successfully',
      data: {
        field_id: field.field_id,
        name: field.name,
        area_hectares: field.area_hectares,
        area_acres: parseFloat(field.area_hectares) * 2.47105,
        crop_type: field.crop_type,
        status: field.status,
        created_at: field.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error creating field:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create field'
    });
  }
};

/**
 * Get all fields for the authenticated user
 * GET /api/fields
 */
exports.getFields = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { status, crop_type, limit = 100, offset = 0 } = req.query;

    const where = { user_id };
    
    if (status) {
      where.status = status;
    }
    
    if (crop_type) {
      where.crop_type = crop_type;
    }

    const fields = await Field.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        fields: fields.map(f => f.toJSON()),
        count: fields.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching fields:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch fields'
    });
  }
};

/**
 * Get a single field by field_id
 * GET /api/fields/:field_id
 */
exports.getFieldById = async (req, res) => {
  try {
    const { field_id } = req.params;
    const user_id = req.user.user_id;

    const field = await Field.findOne({
      where: { field_id, user_id }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Field not found or you do not have access to it'
      });
    }

    res.json({
      success: true,
      data: field.toJSON()
    });

  } catch (error) {
    console.error('❌ Error fetching field:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch field'
    });
  }
};

/**
 * Update a field
 * PUT /api/fields/:field_id
 */
exports.updateField = async (req, res) => {
  try {
    const { field_id } = req.params;
    const user_id = req?.user?.user_id || null;
    const { name, crop_type, planting_date, harvest_date, farm_name, location, notes, tags, status } = req.body;

    const field = await Field.findOne({
      // where: { field_id, user_id }
      where: { field_id }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Field not found or you do not have access to it'
      });
    }

    // Update fields
    if (name !== undefined) field.name = name;
    if (crop_type !== undefined) field.crop_type = crop_type;
    if (planting_date !== undefined) field.planting_date = planting_date;
    if (harvest_date !== undefined) field.harvest_date = harvest_date;
    if (farm_name !== undefined) field.farm_name = farm_name;
    if (location !== undefined) field.location = location;
    if (notes !== undefined) field.notes = notes;
    if (tags !== undefined) field.tags = JSON.stringify(tags);
    if (status !== undefined) field.status = status;

    await field.save();

    res.json({
      success: true,
      message: 'Field updated successfully',
      data: field.toJSON()
    });

  } catch (error) {
    console.error('❌ Error updating field:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update field'
    });
  }
};

/**
 * Delete a field
 * DELETE /api/fields/:field_id
 */
exports.deleteField = async (req, res) => {
  try {
    const { field_id } = req.params;
    const user_id = req.user.user_id;

    const field = await Field.findOne({
      where: { field_id, user_id }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Field not found or you do not have access to it'
      });
    }

    await field.destroy();

    res.json({
      success: true,
      message: 'Field deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting field:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete field'
    });
  }
};

/**
 * Validation rules for field creation
 */
exports.createFieldValidation = [
  // Add validation rules here if needed
];

