/**
 * FieldAnalysis Model (Sequelize/MySQL)
 * Stores NDVI analysis results for fields
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FieldAnalysis = sequelize.define('FieldAnalysis', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  field_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Reference to field'
  },
  user_id: {
    type: DataTypes.STRING(100),
    comment: 'User who requested analysis'
  },
  analysis_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Date of analysis'
  },
  ndvi_mean: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
    comment: 'Mean NDVI value'
  },
  ndvi_std: {
    type: DataTypes.DECIMAL(10, 6),
    comment: 'Standard deviation'
  },
  ndvi_min: {
    type: DataTypes.DECIMAL(10, 6),
    comment: 'Minimum NDVI'
  },
  ndvi_max: {
    type: DataTypes.DECIMAL(10, 6),
    comment: 'Maximum NDVI'
  },
  ndvi_median: {
    type: DataTypes.DECIMAL(10, 6),
    comment: 'Median NDVI'
  },
  ndvi_percentile_25: {
    type: DataTypes.DECIMAL(10, 6),
    comment: '25th percentile'
  },
  ndvi_percentile_75: {
    type: DataTypes.DECIMAL(10, 6),
    comment: '75th percentile'
  },
  cloud_cover: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Cloud cover percentage'
  },
  pixel_count: {
    type: DataTypes.INTEGER,
    comment: 'Number of pixels analyzed'
  },
  data_source: {
    type: DataTypes.STRING(100),
    comment: 'Data source (e.g., Sentinel-2)'
  },
  acquisition_date: {
    type: DataTypes.DATE,
    comment: 'Satellite image acquisition date'
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Confidence score'
  },
  interpretation_status: {
    type: DataTypes.STRING(50),
    comment: 'Health status interpretation'
  },
  interpretation_description: {
    type: DataTypes.TEXT,
    comment: 'Detailed description'
  },
  interpretation_color: {
    type: DataTypes.STRING(20),
    comment: 'Color code for visualization'
  },
  interpretation_recommendation: {
    type: DataTypes.TEXT,
    comment: 'Recommendations'
  },
  hectares: {
    type: DataTypes.DECIMAL(15, 4),
    comment: 'Field area in hectares'
  },
  satellite_platform: {
    type: DataTypes.STRING(50),
    comment: 'Satellite platform'
  },
  satellite_sensor: {
    type: DataTypes.STRING(50),
    comment: 'Sensor type'
  },
  satellite_resolution: {
    type: DataTypes.STRING(50),
    comment: 'Image resolution'
  },
  satellite_bands: {
    type: DataTypes.TEXT,
    comment: 'Bands used (JSON array)'
  }
}, {
  tableName: 'field_analyses',
  updatedAt: false,
  indexes: [
    { fields: ['field_id', 'analysis_date'] },
    { fields: ['user_id', 'analysis_date'] },
    { fields: ['analysis_date'] }
  ]
});

// Instance methods
FieldAnalysis.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  // Restructure NDVI data
  values.ndvi = {
    mean: parseFloat(values.ndvi_mean),
    std: values.ndvi_std ? parseFloat(values.ndvi_std) : null,
    min: values.ndvi_min ? parseFloat(values.ndvi_min) : null,
    max: values.ndvi_max ? parseFloat(values.ndvi_max) : null,
    median: values.ndvi_median ? parseFloat(values.ndvi_median) : null,
    percentile_25: values.ndvi_percentile_25 ? parseFloat(values.ndvi_percentile_25) : null,
    percentile_75: values.ndvi_percentile_75 ? parseFloat(values.ndvi_percentile_75) : null
  };
  delete values.ndvi_mean;
  delete values.ndvi_std;
  delete values.ndvi_min;
  delete values.ndvi_max;
  delete values.ndvi_median;
  delete values.ndvi_percentile_25;
  delete values.ndvi_percentile_75;
  
  // Restructure quality data
  values.quality = {
    cloud_cover: values.cloud_cover ? parseFloat(values.cloud_cover) : null,
    pixel_count: values.pixel_count,
    data_source: values.data_source,
    acquisition_date: values.acquisition_date,
    confidence: values.confidence ? parseFloat(values.confidence) : null
  };
  delete values.cloud_cover;
  delete values.pixel_count;
  delete values.data_source;
  delete values.acquisition_date;
  delete values.confidence;
  
  // Restructure interpretation
  values.interpretation = {
    status: values.interpretation_status,
    description: values.interpretation_description,
    color: values.interpretation_color,
    recommendation: values.interpretation_recommendation
  };
  delete values.interpretation_status;
  delete values.interpretation_description;
  delete values.interpretation_color;
  delete values.interpretation_recommendation;
  
  // Restructure satellite info
  values.satellite_info = {
    platform: values.satellite_platform,
    sensor: values.satellite_sensor,
    resolution: values.satellite_resolution,
    bands_used: values.satellite_bands ? JSON.parse(values.satellite_bands) : []
  };
  delete values.satellite_platform;
  delete values.satellite_sensor;
  delete values.satellite_resolution;
  delete values.satellite_bands;
  
  return values;
};

// Class methods
FieldAnalysis.getLatestAnalysis = async function(fieldId) {
  return await this.findOne({
    where: { field_id: fieldId },
    order: [['analysis_date', 'DESC']]
  });
};

FieldAnalysis.getAnalysisHistory = async function(fieldId, limit = 10) {
  return await this.findAll({
    where: { field_id: fieldId },
    order: [['analysis_date', 'DESC']],
    limit: limit
  });
};

module.exports = FieldAnalysis;
