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

/**
 * @route POST /api/v2/attempts
 * @desc Start a new exam attempt
 * @access Student
 */
router.post('/', startAttempt);

/**
 * @route POST /api/v2/attempts/:id/violation
 * @desc Record integrity violation
 * @access Student
 */
router.post('/:id/violation', recordViolation);

/**
 * @route POST /api/v2/attempts/:id/heartbeat
 * @desc Record heartbeat to track activity
 * @access Student
 */
router.post('/:id/heartbeat', recordHeartbeat);

/**
 * @route POST /api/v2/attempts/:id/submit-sheet
 * @desc Submit answer sheet PDF
 * @access Student
 */
router.post('/:id/submit-sheet', submitAnswerSheet);

module.exports = router;
