/**
 * Field Model (Sequelize/MySQL)
 * Stores field boundary information and metadata
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Field = sequelize.define('Field', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  field_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Unique field identifier'
  },
  user_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Owner user ID'
  },
  boundary_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'Polygon',
    comment: 'GeoJSON type'
  },
  boundary_coordinates: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'GeoJSON coordinates as JSON string'
  },
  name: {
    type: DataTypes.STRING(255),
    comment: 'Field name'
  },
  crop_type: {
    type: DataTypes.STRING(100),
    comment: 'Current crop type'
  },
  planting_date: {
    type: DataTypes.DATE,
    comment: 'Planting date'
  },
  harvest_date: {
    type: DataTypes.DATE,
    comment: 'Expected harvest date'
  },
  farm_name: {
    type: DataTypes.STRING(255),
    comment: 'Farm name'
  },
  location: {
    type: DataTypes.STRING(255),
    comment: 'Location description'
  },
  notes: {
    type: DataTypes.TEXT,
    comment: 'Additional notes'
  },
  tags: {
    type: DataTypes.TEXT,
    comment: 'Tags as JSON array'
  },
  area_sqm: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Area in square meters'
  },
  area_hectares: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    comment: 'Area in hectares'
  },
  perimeter_m: {
    type: DataTypes.DECIMAL(15, 2),
    comment: 'Perimeter in meters'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'archived'),
    defaultValue: 'active',
    comment: 'Field status'
  }
}, {
  tableName: 'fields',
  indexes: [
    { fields: ['field_id'] },
    { fields: ['user_id'] },
    { fields: ['crop_type'] },
    { fields: ['status'] }
  ]
});

// Instance methods
Field.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  // Parse boundary coordinates
  if (values.boundary_coordinates) {
    try {
      values.boundary = {
        type: values.boundary_type,
        coordinates: JSON.parse(values.boundary_coordinates)
      };
      delete values.boundary_type;
      delete values.boundary_coordinates;
    } catch (e) {
      // Keep as is if parsing fails
    }
  }
  // Parse tags
  if (values.tags) {
    try {
      values.tags = JSON.parse(values.tags);
    } catch (e) {
      values.tags = [];
    }
  }
  // Add virtual field
  values.area_acres = parseFloat(values.area_hectares) * 2.47105;
  return values;
};

module.exports = Field;
