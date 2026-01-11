/**
 * Exam Routes
 * Defines API endpoints for exam management
 */

const express = require('express');
const router = express.Router();
const { 
  createExam, 
  publishExam, 
  generateQuestionPapers, 
  triggerEvaluation 
} = require('../controllers/exam.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { teacherOnly } = require('../middleware/role.middleware');

/**
 * @route POST /api/v2/exams
 * @desc Create a new exam
 * @access Teacher only
 */
router.post('/', authenticate, teacherOnly, createExam);

/**
 * @route PATCH /api/v2/exams/:examId/publish
 * @desc Publish an exam
 * @access Teacher only (creator only)
 */
router.patch('/:examId/publish', authenticate, teacherOnly, publishExam);

/**
 * @route POST /api/v2/exams/:id/generate-papers
 * @desc Generate AI question papers for exam (Phase 6.3)
 * @access Teacher only (exam creator only)
 */
router.post('/:id/generate-papers', authenticate, teacherOnly, generateQuestionPapers);

/**
 * @route POST /api/v2/exams/:id/evaluate
 * @desc Trigger AI evaluation for all attempts
 * @access Teacher only
 */
router.post('/:id/evaluate', authenticate, teacherOnly, triggerEvaluation);

module.exports = router;
