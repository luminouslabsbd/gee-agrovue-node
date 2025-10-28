/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const models = require('../models');

// JWT Secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'gee-agrovue-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    status: user.status
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verify JWT token middleware
 * Protects routes by requiring valid authentication token
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
        message: 'Please provide a valid authentication token in the Authorization header'
      });
    }
    
    // Check if Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format',
        message: 'Authorization header must be in format: Bearer <token>'
      });
    }
    
    // Extract token
    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token not found',
        message: 'Please provide a valid authentication token'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await models.User.findOne({
      user_id: decoded.user_id,
      status: 'active'
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
        message: 'Your account is not active or has been deleted'
      });
    }
    
    // Update last login and API usage
    user.last_login = new Date();
    await user.incrementApiUsage();
    
    // Attach user to request
    req.user = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      country: user.country
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided authentication token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your authentication token has expired. Please login again'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await models.User.findOne({
      user_id: decoded.user_id,
      status: 'active'
    });
    
    if (user) {
      req.user = {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: `This resource requires one of the following roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  optionalAuth,
  authorize,
  JWT_SECRET,
  JWT_EXPIRES_IN
};

