/**
 * User Model
 * Stores user authentication and profile information
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // User identification
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Profile information
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  country: {
    type: String,
    required: true,
    trim: true
  },
  
  // Account status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    required: true
  },
  
  // User role and permissions
  role: {
    type: String,
    enum: ['admin', 'farmer', 'agronomist', 'viewer'],
    default: 'farmer'
  },
  
  // Associated fields
  fields: [{
    type: String,
    ref: 'Field'
  }],
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    units: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  
  // Last login
  last_login: Date,
  
  // API usage tracking
  api_usage: {
    total_requests: { type: Number, default: 0 },
    last_request: Date,
    monthly_limit: { type: Number, default: 10000 },
    current_month_usage: { type: Number, default: 0 }
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
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ country: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to hide password in JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Method to increment API usage
userSchema.methods.incrementApiUsage = function() {
  this.api_usage.total_requests += 1;
  this.api_usage.current_month_usage += 1;
  this.api_usage.last_request = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).exec();
};

userSchema.statics.getActiveUsers = function() {
  return this.find({ status: 'active' }).exec();
};

module.exports = mongoose.model('User', userSchema);

