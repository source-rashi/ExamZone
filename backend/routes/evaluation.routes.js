/**
 * PHASE 7.5.2 — Evaluation Routes
 * Teacher evaluation endpoints
 */

const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { teacherOnly } = require('../middleware/role.middleware');
const { 
  attemptIdValidation, 
  submitEvaluationValidation, 
  examIdValidation, 
  handleValidationErrors 
} = require('../middleware/validation');

// All routes require authentication and teacher role
router.use(authenticate);
router.use(teacherOnly);

// Get all attempts for an exam
router.get('/exams/:examId/attempts', examIdValidation, handleValidationErrors, evaluationController.getExamAttempts);

// Get attempt details for evaluation
router.get('/attempts/:attemptId', attemptIdValidation, handleValidationErrors, evaluationController.getAttemptForEvaluation);

// Submit evaluation
router.post('/attempts/:attemptId/score', submitEvaluationValidation, handleValidationErrors, evaluationController.submitEvaluation);

// Request AI checking
router.post('/attempts/:attemptId/ai-check', attemptIdValidation, handleValidationErrors, evaluationController.requestAIChecking);

// Finalize exam (mark evaluation as complete)
router.post('/exams/:examId/finalize', examIdValidation, handleValidationErrors, evaluationController.finalizeExam);

module.exports = router;
