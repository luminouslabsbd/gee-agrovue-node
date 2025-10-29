/**
 * Create Default Admin User for MySQL
 * 
 * This script creates a default admin account for the system
 * Email: admin@agrovue.com
 * Password: Admin@123456
 * Role: admin
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const models = require('../models');

// Admin user details
const ADMIN_EMAIL = 'admin@agrovue.com';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME = 'System Administrator';
const ADMIN_PHONE = '+1234567890';
const ADMIN_COUNTRY = 'Bangladesh';

async function createAdminUser() {
  try {
    console.log('🔌 Connecting to MySQL...');
    await database.connectDatabase();
    
    console.log('🔍 Checking for existing admin user...');
    const existingAdmin = await models.User.findOne({
      where: { email: ADMIN_EMAIL }
    });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      console.log(`📊 Status: ${existingAdmin.status}`);
      console.log('\n💡 To reset password, delete the user first:');
      console.log(`   DELETE FROM users WHERE email='${ADMIN_EMAIL}';`);
      await database.disconnectDatabase();
      process.exit(0);
    }
    
    console.log('👤 Creating admin user...');
    const user_id = `user_${uuidv4()}`;
    
    const adminUser = await models.User.create({
      user_id,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // Will be hashed by beforeCreate hook
      name: ADMIN_NAME,
      phone: ADMIN_PHONE,
      country: ADMIN_COUNTRY,
      status: 'active',
      role: 'admin',
      monthly_limit: 100000, // Higher limit for admin
      last_login: new Date()
    });
    
    console.log('\n✅ Admin user created successfully!');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:    ', ADMIN_EMAIL);
    console.log('🔑 Password: ', ADMIN_PASSWORD);
    console.log('👤 Name:     ', ADMIN_NAME);
    console.log('🆔 User ID:  ', adminUser.user_id);
    console.log('🔐 Role:     ', adminUser.role);
    console.log('📊 Status:   ', adminUser.status);
    console.log('📈 API Limit:', adminUser.monthly_limit, 'requests/month');
    console.log('═══════════════════════════════════════');
    console.log('\n💡 You can now login with these credentials!');
    console.log('\n📝 Example login request:');
    console.log(`curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "${ADMIN_EMAIL}",
    "password": "${ADMIN_PASSWORD}"
  }'`);
    
    await database.disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error(error);
    await database.disconnectDatabase();
    process.exit(1);
  }
}

// Run the script
createAdminUser();
