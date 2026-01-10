/**
 * Authentication Controller
 * Handles auth-related HTTP requests
 */

const authService = require('../services/auth.service');
const User = require('../models/User');

/**
 * POST /api/v2/auth/google
 * Login with Google OAuth token
 */
async function loginWithGoogle(req, res, next) {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Google token is required'
      });
    }
    
    const result = await authService.loginWithGoogle(token);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/v2/auth/me
 * Get current authenticated user
 */
async function getCurrentUser(req, res, next) {
  try {
    // req.user is attached by auth middleware
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture || user.profilePicture,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user information'
    });
  }
}

module.exports = {
  loginWithGoogle,
  getCurrentUser
};
