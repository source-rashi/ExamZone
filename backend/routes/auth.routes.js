/**
 * Authentication Routes
 * Handles user authentication endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { 
  registerValidation, 
  loginValidation, 
  handleValidationErrors 
} = require('../middleware/validation');

/**
 * POST /api/v2/auth/register
 * Register new user with email/password
 * Body: { name, email, password, role }
 * PHASE 8.8: Rate limited to prevent spam accounts
 */
router.post('/register', authLimiter, registerValidation, handleValidationErrors, authController.register);

/**
 * POST /api/v2/auth/login
 * Login with email/password
 * Body: { email, password }
 * PHASE 8.8: Rate limited to prevent brute force attacks
 */
router.post('/login', authLimiter, loginValidation, handleValidationErrors, authController.login);

/**
 * POST /api/v2/auth/google
 * Login with Google OAuth token
 * Body: { token: string }
 */
router.post('/google', authController.loginWithGoogle);

/**
 * GET /api/v2/auth/me
 * Get current authenticated user
 * Requires: JWT token in Authorization header
 */
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
