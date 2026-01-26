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
  
  // PHASE 7.4 - Exam attempt engine
  getAttemptById,
  saveAnswer,
  logViolation,
  submitExamAttempt,

  // PHASE 7.5.5 - Student result access
  getAttemptResult,
  getMyExamAttempts,
  
  // Legacy
  startAttempt, 
  recordViolation, 
  recordHeartbeat,
  submitAnswerSheet
} = require('../controllers/attempt.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { 
  startAttemptValidation, 
  saveAnswerValidation, 
  submitAttemptValidation, 
  logViolationValidation, 
  handleValidationErrors 
} = require('../middleware/validation');
const { studentOnly } = require('../middleware/role.middleware');

// ==================================================================
// PHASE 7.1 — NEW ATTEMPT LIFECYCLE
// ==================================================================

/**
 * @route POST /api/v2/attempts/start
 * @desc Start a new exam attempt (PHASE 7.1)
 * @access Student only
 */
router.post('/start', authenticate, studentOnly, startAttemptValidation, handleValidationErrors, startExamAttempt);

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
// PHASE 7.4 — EXAM ATTEMPT ENGINE
// ==================================================================

/**
 * @route GET /api/v2/attempts/:attemptId
 * @desc Get attempt details with questions and answers (PHASE 7.4)
 * @access Student only
 */
router.get('/:attemptId', authenticate, studentOnly, getAttemptById);

/**
 * @route POST /api/v2/attempts/:attemptId/answer
 * @desc Save/update answer for a question (PHASE 7.4)
 * @access Student only
 */
router.post('/:attemptId/answer', authenticate, studentOnly, saveAnswerValidation, handleValidationErrors, saveAnswer);

/**
 * @route POST /api/v2/attempts/:attemptId/log-violation
 * @desc Log integrity violation (PHASE 7.4)
 * @access Student only
 */
router.post('/:attemptId/log-violation', authenticate, studentOnly, logViolationValidation, handleValidationErrors, logViolation);

/**
 * @route POST /api/v2/attempts/:attemptId/submit
 * @desc Submit exam attempt (PHASE 7.4)
 * @access Student only
 */
router.post('/:attemptId/submit', authenticate, studentOnly, submitAttemptValidation, handleValidationErrors, submitExamAttempt);

// ==================================================================
// PHASE 7.5.5 — STUDENT RESULT ACCESS
// ==================================================================

/**
 * @route GET /api/v2/attempts/:attemptId/result
 * @desc Get evaluated result for an attempt (PHASE 7.5.5)
 * @access Student only
 */
router.get('/:attemptId/result', authenticate, studentOnly, getAttemptResult);

/**
 * @route GET /api/v2/attempts/exam/:examId/my-attempts
 * @desc Get all submitted attempts for an exam (PHASE 7.5.5)
 * @access Student only
 */
router.get('/exam/:examId/my-attempts', authenticate, studentOnly, getMyExamAttempts);

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

