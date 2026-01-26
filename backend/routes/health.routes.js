/**
 * PHASE 8.7 - Health Check Routes
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public health check
router.get('/', healthController.healthCheck);

// Database health check
router.get('/database', healthController.databaseHealth);

// System stats (requires authentication)
router.get('/stats', authenticate, healthController.systemStats);

// Data integrity check (requires authentication)
router.get('/integrity', authenticate, healthController.integrityCheck);

module.exports = router;
