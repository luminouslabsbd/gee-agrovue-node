/**
 * Field Analysis Model
 * Stores NDVI analysis results for fields
 */

const mongoose = require('mongoose');

const fieldAnalysisSchema = new mongoose.Schema({
  // Reference to field
  field_id: {
    type: String,
    required: true,
    index: true
  },
  
  // User reference
  user_id: {
    type: String,
    ref: 'User',
    index: true
  },
  
  // Analysis date
  analysis_date: {
    type: Date,
    required: true,
    index: true
  },
  
  // NDVI statistics
  ndvi: {
    mean: { type: Number, required: true },
    std: Number,
    min: Number,
    max: Number,
    median: Number,
    percentile_25: Number,
    percentile_75: Number
  },
  
  // Quality metrics
  quality: {
    cloud_cover: Number,
    pixel_count: Number,
    data_source: String,
    acquisition_date: Date,
    confidence: Number
  },
  
  // Health interpretation
  interpretation: {
    status: String,
    description: String,
    color: String,
    recommendation: String
  },
  
  // Field area
  hectares: Number,
  
  // Satellite imagery info
  satellite_info: {
    platform: String,
    sensor: String,
    resolution: String,
    bands_used: [String]
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Compound indexes
fieldAnalysisSchema.index({ field_id: 1, analysis_date: -1 });
fieldAnalysisSchema.index({ user_id: 1, analysis_date: -1 });

// Static methods
fieldAnalysisSchema.statics.getLatestAnalysis = function(fieldId) {
  return this.findOne({ field_id: fieldId })
    .sort({ analysis_date: -1 })
    .exec();
};

fieldAnalysisSchema.statics.getAnalysisHistory = function(fieldId, limit = 10) {
  return this.find({ field_id: fieldId })
    .sort({ analysis_date: -1 })
    .limit(limit)
    .exec();
};

module.exports = mongoose.model('FieldAnalysis', fieldAnalysisSchema);

