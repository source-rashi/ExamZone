/**
 * Authentication Controller
 * Handles auth-related HTTP requests
 */

const authService = require('../services/auth.service');
const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Helper function to hash password using crypto
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper function to compare password
function comparePassword(password, hashedPassword) {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash === hashedPassword;
}

/**
 * POST /api/v2/auth/register
 * Register new user with email/password
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = hashPassword(password);
    
    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'student',
      authProvider: 'local'
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * POST /api/v2/auth/login
 * Login with email/password
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if user registered with Google
    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google login. Please sign in with Google.'
      });
    }
    
    // Verify password
    const isMatch = comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.status(200).json({
      token,
      user: {
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
      message: error.message
    });
  }
}

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
    
    // Return token and user directly (frontend expects this format)
    res.status(200).json({
      token: result.token,
      user: result.user
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
    
    // Return user directly (frontend expects this format)
    res.status(200).json({
      user: {
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
  register,
  login,
  loginWithGoogle,
  getCurrentUser
};
