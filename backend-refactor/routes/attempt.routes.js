/**
 * Attempt Routes
 * Defines API endpoints for exam attempt management
 */

const express = require('express');
const router = express.Router();
const { startAttempt } = require('../controllers/attempt.controller');

/**
 * @route POST /api/v2/attempts
 * @desc Start a new exam attempt
 * @access Student
 */
router.post('/', startAttempt);

module.exports = router;
