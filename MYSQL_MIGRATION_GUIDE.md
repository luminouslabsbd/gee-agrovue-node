# MySQL Migration Guide

## ✅ Migration Complete: MongoDB → MySQL

This project has been successfully migrated from MongoDB to MySQL with Sequelize ORM.

---

## 🎯 Key Changes

### 1. **Database System**
- **Before:** MongoDB (NoSQL)
- **After:** MySQL (SQL) with Sequelize ORM

### 2. **Auto-Migration Feature**
- ✅ **Automatic table creation** on server startup
- ✅ **Automatic column addition** when models are updated
- ✅ **Schema synchronization** using `sequelize.sync({ alter: true })`

### 3. **Models Migrated**
- ✅ User (authentication & profiles)
- ✅ Field (field boundaries & metadata)
- ✅ FieldAnalysis (NDVI analysis results)

---

## 📋 Prerequisites

### 1. Install MySQL
```bash
# macOS (using Homebrew)
brew install mysql
brew services start mysql

# Ubuntu/Debian
sudo apt-get install mysql-server
sudo systemctl start mysql

# Windows
# Download from: https://dev.mysql.com/downloads/installer/
```

### 2. Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE gee_agrovue;
EXIT;
```

---

## ⚙️ Configuration

### 1. Update `.env` File
```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gee_agrovue
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Authentication
JWT_SECRET=gee-agrovue-super-secret-key-change-in-production-2024
JWT_EXPIRES_IN=7d
```

### 2. Install Dependencies
```bash
npm install mysql2 sequelize
```

---

## 🚀 Getting Started

### 1. Start MySQL
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Check if running
mysql -u root -p -e "SELECT 1;"
```

### 2. Start Server (Auto-Migration)
```bash
npm start
```

**What happens:**
1. ✅ Connects to MySQL
2. ✅ Syncs all models (creates/updates tables)
3. ✅ Lists all tables in database
4. ✅ Server starts on port 3000

**Expected Output:**
```
🔌 Connecting to MySQL...
📊 Database: gee_agrovue
🌐 Host: localhost:3306
👤 User: root
✅ MySQL connected successfully
🔄 Syncing database models...
✅ Database models synced successfully
📋 Tables in database: users, fields, field_analyses
```

### 3. Create Admin User
```bash
node scripts/createAdminUser.js
```

**Output:**
```
✅ Admin user created successfully!
═══════════════════════════════════════
📧 Email:     admin@agrovue.com
🔑 Password:  Admin@123456
👤 Name:      System Administrator
🆔 User ID:   user_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
🔐 Role:      admin
📊 Status:    active
📈 API Limit: 100000 requests/month
═══════════════════════════════════════
```

---

## 🧪 Testing

### 1. Test Database Connection
```bash
mysql -u root -p gee_agrovue -e "SHOW TABLES;"
```

**Expected Output:**
```
+-------------------------+
| Tables_in_gee_agrovue   |
+-------------------------+
| field_analyses          |
| fields                  |
| users                   |
+-------------------------+
```

### 2. Test Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@agrovue.com",
    "password": "Admin@123456"
  }'
```

### 3. Test Protected API
```bash
# Get token from login response
TOKEN="your_token_here"

curl -X POST http://localhost:3000/api/field-analysis \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {
      "type": "Polygon",
      "coordinates": [[[90.371,23.841],[90.370,23.840],[90.371,23.840],[90.371,23.841]]]
    },
    "fieldId": "TEST-001"
  }'
```

### 4. Verify Data in MySQL
```bash
mysql -u root -p gee_agrovue
```

```sql
-- Check users
SELECT user_id, email, name, role, status FROM users;

-- Check fields
SELECT field_id, user_id, area_hectares, status FROM fields;

-- Check analyses
SELECT field_id, user_id, ndvi_mean, analysis_date FROM field_analyses;
```

---

## 🔄 Auto-Migration Examples

### Example 1: Adding a New Column
**Edit `models/User.js`:**
```javascript
bio: {
  type: DataTypes.TEXT,
  comment: 'User biography'
}
```

**Restart server:**
```bash
npm start
```

**Result:**
- ✅ Column `bio` automatically added to `users` table
- ✅ No data loss
- ✅ No manual migration needed

### Example 2: Adding a New Table
**Create `models/CropAnalysis.js`:**
```javascript
const CropAnalysis = sequelize.define('CropAnalysis', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  crop_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
  // ... more fields
}, {
  tableName: 'crop_analyses'
});

module.exports = CropAnalysis;
```

**Add to `models/index.js`:**
```javascript
const CropAnalysis = require('./CropAnalysis');

module.exports = {
  User,
  Field,
  FieldAnalysis,
  CropAnalysis  // Add this
};
```

**Restart server:**
```bash
npm start
```

**Result:**
- ✅ Table `crop_analyses` automatically created
- ✅ All columns and indexes created
- ✅ Ready to use immediately

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) UNIQUE NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `role` ENUM('admin', 'farmer', 'agronomist', 'viewer') DEFAULT 'farmer',
  `language` VARCHAR(10) DEFAULT 'en',
  `units` ENUM('metric', 'imperial') DEFAULT 'metric',
  `email_notifications` BOOLEAN DEFAULT TRUE,
  `sms_notifications` BOOLEAN DEFAULT FALSE,
  `last_login` DATETIME,
  `total_requests` INT DEFAULT 0,
  `last_request` DATETIME,
  `monthly_limit` INT DEFAULT 10000,
  `current_month_usage` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_country` (`country`)
);
```

### Fields Table
```sql
CREATE TABLE `fields` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `field_id` VARCHAR(100) UNIQUE NOT NULL,
  `user_id` VARCHAR(100),
  `boundary_type` VARCHAR(50) DEFAULT 'Polygon',
  `boundary_coordinates` LONGTEXT NOT NULL,
  `name` VARCHAR(255),
  `crop_type` VARCHAR(100),
  `planting_date` DATETIME,
  `harvest_date` DATETIME,
  `farm_name` VARCHAR(255),
  `location` VARCHAR(255),
  `notes` TEXT,
  `tags` TEXT,
  `area_sqm` DECIMAL(15,2) NOT NULL,
  `area_hectares` DECIMAL(15,4) NOT NULL,
  `perimeter_m` DECIMAL(15,2),
  `status` ENUM('active', 'inactive', 'archived') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_field_id` (`field_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_crop_type` (`crop_type`),
  INDEX `idx_status` (`status`)
);
```

### Field Analyses Table
```sql
CREATE TABLE `field_analyses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `field_id` VARCHAR(100) NOT NULL,
  `user_id` VARCHAR(100),
  `analysis_date` DATETIME NOT NULL,
  `ndvi_mean` DECIMAL(10,6) NOT NULL,
  `ndvi_std` DECIMAL(10,6),
  `ndvi_min` DECIMAL(10,6),
  `ndvi_max` DECIMAL(10,6),
  `ndvi_median` DECIMAL(10,6),
  `ndvi_percentile_25` DECIMAL(10,6),
  `ndvi_percentile_75` DECIMAL(10,6),
  `cloud_cover` DECIMAL(5,2),
  `pixel_count` INT,
  `data_source` VARCHAR(100),
  `acquisition_date` DATETIME,
  `confidence` DECIMAL(5,2),
  `interpretation_status` VARCHAR(50),
  `interpretation_description` TEXT,
  `interpretation_color` VARCHAR(20),
  `interpretation_recommendation` TEXT,
  `hectares` DECIMAL(15,4),
  `satellite_platform` VARCHAR(50),
  `satellite_sensor` VARCHAR(50),
  `satellite_resolution` VARCHAR(50),
  `satellite_bands` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_field_analysis` (`field_id`, `analysis_date`),
  INDEX `idx_user_analysis` (`user_id`, `analysis_date`),
  INDEX `idx_analysis_date` (`analysis_date`)
);
```

---

## 🛠️ Troubleshooting

### Issue 1: "Access denied for user 'root'@'localhost'"
**Solution:**
```bash
mysql -u root -p
```
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

Update `.env`:
```env
DB_PASSWORD=your_password
```

### Issue 2: "Unknown database 'gee_agrovue'"
**Solution:**
```bash
mysql -u root -p -e "CREATE DATABASE gee_agrovue;"
```

### Issue 3: Tables not created
**Solution:**
```bash
# Check server logs for errors
npm start

# Manually sync database
node -e "require('./config/database').connectDatabase().then(() => process.exit(0))"
```

### Issue 4: "Cannot find module 'mysql2'"
**Solution:**
```bash
npm install mysql2 sequelize
```

---

## 📝 Migration Checklist

- [x] Install MySQL
- [x] Create database `gee_agrovue`
- [x] Update `.env` with MySQL credentials
- [x] Install `mysql2` and `sequelize`
- [x] Create Sequelize models (User, Field, FieldAnalysis)
- [x] Update database config to use Sequelize
- [x] Update auth controller for Sequelize
- [x] Update auth middleware for Sequelize
- [x] Update server.js for Sequelize
- [x] Test database connection
- [x] Create admin user
- [x] Test authentication
- [x] Test protected APIs
- [x] Verify data persistence

---

## 🎉 Success Indicators

✅ Server starts without errors  
✅ MySQL connection successful  
✅ Tables created automatically  
✅ Admin user created  
✅ Login works  
✅ Protected APIs work with token  
✅ Data saved to MySQL  
✅ Auto-migration works when adding columns/tables  

---

## 📞 Support

If you encounter issues:
1. Check MySQL is running: `mysql -u root -p -e "SELECT 1;"`
2. Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`
3. Check `.env` configuration
4. Review server logs for errors
5. Test connection: `node -e "require('./config/database').testConnection()"`

---

**Migration Status:** ✅ **COMPLETE**  
**Auto-Migration:** ✅ **ENABLED**  
**Production Ready:** ✅ **YES**
