/**
 * Authentication Routes
 * Handles user authentication endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

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
