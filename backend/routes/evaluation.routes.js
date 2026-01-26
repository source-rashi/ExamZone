/**
 * PHASE 7.5.2 — Evaluation Routes
 * Teacher evaluation endpoints
 */

const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { teacherOnly } = require('../middleware/role.middleware');

// All routes require authentication and teacher role
router.use(authenticate);
router.use(teacherOnly);

// Get all attempts for an exam
router.get('/exams/:examId/attempts', evaluationController.getExamAttempts);

// Get attempt details for evaluation
router.get('/attempts/:attemptId', evaluationController.getAttemptForEvaluation);

// Submit evaluation
router.post('/attempts/:attemptId/score', evaluationController.submitEvaluation);

// Request AI checking
router.post('/attempts/:attemptId/ai-check', evaluationController.requestAIChecking);

// Finalize exam (mark evaluation as complete)
router.post('/exams/:examId/finalize', evaluationController.finalizeExam);

module.exports = router;
