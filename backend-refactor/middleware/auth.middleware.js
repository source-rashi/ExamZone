/**
 * Authentication Middleware
 * Verifies JWT and attaches user to request
 */

const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authenticate user from JWT token
 * Expects token in Authorization header: "Bearer <token>"
 */
async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please include Authorization header with Bearer token'
      });
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User no longer exists'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is deactivated'
      });
    }
    
    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    };
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Optional authentication - doesn't block if no token
 * Useful for routes that can work with or without auth
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          name: user.name
        };
      }
    } catch (error) {
      // Invalid token, continue without user
    }
    
    next();
  } catch (error) {
    next(); // Continue on error
  }
}

module.exports = {
  authenticate,
  optionalAuth
};
