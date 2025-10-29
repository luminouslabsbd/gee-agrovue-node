/**
 * Create Default Admin User
 * 
 * This script creates a default admin account for the system
 * Email: admin@agrovue.com
 * Password: Admin@123456
 * Role: admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gee-agrovue';

// User Schema (simplified version)
const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['admin', 'farmer', 'agronomist', 'viewer'],
    default: 'farmer'
  },
  fields: [{
    type: String
  }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    language: { type: String, default: 'en' },
    units: { type: String, default: 'metric' }
  },
  last_login: {
    type: Date,
    default: Date.now
  },
  api_usage: {
    total_requests: { type: Number, default: 0 },
    monthly_limit: { type: Number, default: 100000 }, // Higher limit for admin
    current_month_usage: { type: Number, default: 0 },
    last_request: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@agrovue.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('📊 Status:', existingAdmin.status);
      console.log('🆔 User ID:', existingAdmin.user_id);
      console.log('\n💡 To reset password, delete the user first or update manually.');
      
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const adminUser = new User({
      user_id: `user_${uuidv4()}`,
      email: 'admin@agrovue.com',
      password: 'Admin@123456', // Will be hashed by pre-save hook
      name: 'System Administrator',
      phone: '+1-800-AGROVUE',
      country: 'Global',
      status: 'active',
      role: 'admin',
      fields: [],
      preferences: {
        notifications: {
          email: true,
          sms: true
        },
        language: 'en',
        units: 'metric'
      },
      api_usage: {
        total_requests: 0,
        monthly_limit: 100000, // 100k requests for admin
        current_month_usage: 0
      }
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:    admin@agrovue.com');
    console.log('🔒 Password: Admin@123456');
    console.log('🔑 Role:     admin');
    console.log('📊 Status:   active');
    console.log('🆔 User ID:  ' + adminUser.user_id);
    console.log('═══════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🚀 You can now login with these credentials.');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('💡 Duplicate key error - user might already exist');
    }
    process.exit(1);
  }
}

// Run the script
createAdminUser();

