/**
 * MySQL Database Configuration with Sequelize
 * 
 * This module handles MySQL connection using Sequelize ORM
 * Implements auto-migration for tables and columns
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// MySQL connection configuration from environment variables
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_NAME = process.env.DB_NAME || 'gee_agrovue';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Connection state
let isConnected = false;

async function testConnection() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error.message);
    return false;
  }
}

async function connectDatabase(options = {}) {
  if (isConnected) {
    console.log('✅ Using existing MySQL connection');
    return;
  }

  try {
    console.log('🔌 Connecting to MySQL...');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`🌐 Host: ${DB_HOST}:${DB_PORT}`);
    console.log(`👤 User: ${DB_USER}`);
    
    await sequelize.authenticate();
    isConnected = true;
    console.log('✅ MySQL connected successfully');
    
    const syncOptions = { alter: true, ...options };
    console.log('🔄 Syncing database models...');
    await sequelize.sync(syncOptions);
    console.log('✅ Database models synced successfully');
    
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`📋 Tables in database: ${tables.join(', ')}`);
    
  } catch (error) {
    console.error('❌ MySQL connection error:', error.message);
    console.error('💡 Make sure MySQL is running on your local machine');
    throw error;
  }
}

async function disconnectDatabase() {
  if (!isConnected) return;
  try {
    await sequelize.close();
    isConnected = false;
    console.log('✅ MySQL disconnected successfully');
  } catch (error) {
    console.error('❌ MySQL disconnection error:', error.message);
    throw error;
  }
}

function getConnectionStatus() {
  return isConnected;
}

function getDatabase() {
  if (!isConnected) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return sequelize;
}

async function forceSyncDatabase() {
  console.log('⚠️  Force syncing database (this will delete all data)...');
  await sequelize.sync({ force: true });
  console.log('✅ Database force synced successfully');
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

module.exports = {
  sequelize,
  connectDatabase,
  disconnectDatabase,
  getConnectionStatus,
  getDatabase,
  testConnection,
  forceSyncDatabase
};
