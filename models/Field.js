/**
 * Field Model
 * Stores field boundary information and metadata
 */

const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  // Field identification
  field_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Owner reference
  user_id: {
    type: String,
    ref: 'User',
    index: true
  },
  
  // Field boundary (GeoJSON)
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]],
      required: true
    }
  },
  
  // Field metadata
  metadata: {
    name: String,
    crop_type: String,
    planting_date: Date,
    harvest_date: Date,
    farm_name: String,
    location: String,
    notes: String,
    tags: [String]
  },
  
  // Calculated properties
  area_sqm: {
    type: Number,
    required: true
  },
  
  area_hectares: {
    type: Number,
    required: true
  },
  
  perimeter_m: Number,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
fieldSchema.index({ boundary: '2dsphere' });
fieldSchema.index({ user_id: 1 });
fieldSchema.index({ 'metadata.crop_type': 1 });
fieldSchema.index({ status: 1 });

// Virtual for area in acres
fieldSchema.virtual('area_acres').get(function() {
  return this.area_hectares * 2.47105;
});

// Methods
fieldSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.area_acres = this.area_acres;
  return obj;
};

module.exports = mongoose.model('Field', fieldSchema);

