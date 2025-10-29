/**
 * User Model (Sequelize/MySQL)
 * Stores user authentication and profile information
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Unique user identifier'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    comment: 'User email address'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Hashed password'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'User full name'
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'User phone number'
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'User country'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    allowNull: false,
    comment: 'Account status'
  },
  role: {
    type: DataTypes.ENUM('admin', 'farmer', 'agronomist', 'viewer'),
    defaultValue: 'farmer',
    comment: 'User role'
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en',
    comment: 'Preferred language'
  },
  units: {
    type: DataTypes.ENUM('metric', 'imperial'),
    defaultValue: 'metric',
    comment: 'Preferred units'
  },
  email_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Email notifications enabled'
  },
  sms_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'SMS notifications enabled'
  },
  last_login: {
    type: DataTypes.DATE,
    comment: 'Last login timestamp'
  },
  total_requests: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total API requests'
  },
  last_request: {
    type: DataTypes.DATE,
    comment: 'Last API request timestamp'
  },
  monthly_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 10000,
    comment: 'Monthly API request limit'
  },
  current_month_usage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Current month API usage'
  }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'] },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['country'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

User.prototype.incrementApiUsage = async function() {
  this.total_requests += 1;
  this.current_month_usage += 1;
  this.last_request = new Date();
  await this.save();
};

// Class methods
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email: email.toLowerCase() } });
};

User.getActiveUsers = async function() {
  return await this.findAll({ where: { status: 'active' } });
};

module.exports = User;
