/**
 * Attempt Routes
 * Defines API endpoints for exam attempt management
 */

const express = require('express');
const router = express.Router();
const { 
  startAttempt, 
  recordViolation, 
  recordHeartbeat,
  submitAnswerSheet
} = require('../controllers/attempt.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { studentOnly } = require('../middleware/role.middleware');

/**
 * @route POST /api/v2/attempts
 * @desc Start a new exam attempt
 * @access Student only
 */
router.post('/', authenticate, studentOnly, startAttempt);

/**
 * @route POST /api/v2/attempts/:id/violation
 * @desc Record integrity violation
 * @access Student only
 */
router.post('/:id/violation', authenticate, studentOnly, recordViolation);

/**
 * @route POST /api/v2/attempts/:id/heartbeat
 * @desc Record heartbeat to track activity
 * @access Student only
 */
router.post('/:id/heartbeat', authenticate, studentOnly, recordHeartbeat);

/**
 * @route POST /api/v2/attempts/:id/submit-sheet
 * @desc Submit answer sheet PDF
 * @access Student only
 */
router.post('/:id/submit-sheet', authenticate, studentOnly, submitAnswerSheet);

module.exports = router;
