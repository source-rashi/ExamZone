/**
 * PHASE 7.1 — Attempt Routes
 * Defines API endpoints for exam attempt management
 */

const express = require('express');
const router = express.Router();
const { 
  // PHASE 7.1 - New lifecycle
  startExamAttempt,
  getActiveAttempt,
  getAttemptPaper,
  
  // Legacy
  startAttempt, 
  recordViolation, 
  recordHeartbeat,
  submitAnswerSheet
} = require('../controllers/attempt.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { studentOnly } = require('../middleware/role.middleware');

// ==================================================================
// PHASE 7.1 — NEW ATTEMPT LIFECYCLE
// ==================================================================

/**
 * @route POST /api/v2/attempts/start
 * @desc Start a new exam attempt (PHASE 7.1)
 * @access Student only
 */
router.post('/start', authenticate, studentOnly, startExamAttempt);

/**
 * @route GET /api/v2/attempts/:examId/active
 * @desc Get active attempt for an exam (PHASE 7.1)
 * @access Student only
 */
router.get('/:examId/active', authenticate, studentOnly, getActiveAttempt);

/**
 * @route GET /api/v2/attempts/:attemptId/paper
 * @desc Get exam paper through attempt (PHASE 7.1)
 * @access Student only
 */
router.get('/:attemptId/paper', authenticate, studentOnly, getAttemptPaper);

// ==================================================================
// LEGACY ROUTES (kept for backward compatibility)
// ==================================================================

/**
 * @route POST /api/v2/attempts
 * @desc Start a new exam attempt (legacy)
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

