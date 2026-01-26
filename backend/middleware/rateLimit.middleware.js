/**
 * PHASE 8.8 - Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Rate limiter for authentication routes
 * Stricter limits to prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
      type: 'auth'
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again in 15 minutes.'
    });
  }
});

/**
 * Rate limiter for general API routes
 * More lenient for regular operations
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/api/health');
  },
  handler: (req, res) => {
    logger.logSecurity('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
      type: 'api'
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.'
    });
  }
});

/**
 * Rate limiter for file upload routes
 * Stricter to prevent storage abuse
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    error: 'Upload limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
      type: 'upload'
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many file uploads. Please try again in an hour.'
    });
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter
};
