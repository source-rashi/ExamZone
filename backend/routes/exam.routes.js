/**
 * Exam Routes
 * Defines API endpoints for exam management
 */

const express = require('express');
const router = express.Router();
const { 
  createExam,
  updateExam,
  publishExam, 
  generateQuestionPapers,
  generateStudentPapers,
  triggerEvaluation,
  generateSets,
  resetGeneration,
  getPreparationData,
  generateExamSetsWithAI,
  getExamById,
  getStudentPapers,
  getMyPaper,
  downloadPaper
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
 * @route GET /api/v2/exams/:id
 * @desc Get exam by ID with generated sets
 * @access Authenticated
 */
router.get('/:id', authenticate, getExamById);

/**
 * @route PATCH /api/v2/exams/:id
 * @desc Update an exam (respects locking)
 * @access Teacher only (creator only)
 */
router.patch('/:id', authenticate, teacherOnly, updateExam);

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
 * PHASE 6.4 - Generate Student-Specific PDF Papers
 * @route POST /api/v2/exams/:id/generate-student-papers
 * @desc Generate PDF question papers for all students
 * @access Teacher only (exam creator only)
 */
router.post('/:id/generate-student-papers', authenticate, teacherOnly, generateStudentPapers);

/**
 * @route POST /api/v2/exams/:id/evaluate
 * @desc Trigger AI evaluation for all attempts
 * @access Teacher only
 */
router.post('/:id/evaluate', authenticate, teacherOnly, triggerEvaluation);

/**
 * @route POST /api/v2/exams/:id/generate-sets
 * @desc Generate question sets and assign students (PHASE 6.2.5)
 * @access Teacher only (exam creator only)
 */
router.post('/:id/generate-sets', authenticate, teacherOnly, generateSets);

/**
 * @route POST /api/v2/exams/:id/reset-generation
 * @desc Reset exam generation (PHASE 6.2.5)
 * @access Teacher only (exam creator only)
 */
router.post('/:id/reset-generation', authenticate, teacherOnly, resetGeneration);

/**
 * @route GET /api/v2/exams/:id/preparation-data
 * @desc Get exam preparation data with roll-to-set mapping (PHASE 6.2.5)
 * @access Teacher only
 */
router.get('/:id/preparation-data', authenticate, teacherOnly, getPreparationData);

/**
 * PHASE 6.3 — AI EXAM SET GENERATION
 * @route POST /api/v2/exams/:id/generate
 * @desc Generate exam question sets using AI
 * @access Teacher only (exam creator only)
 */
router.post('/:id/generate', authenticate, teacherOnly, generateExamSetsWithAI);

/**
 * @route GET /api/v2/exams/:id
 * @desc Get exam by ID with generated sets
 * @access Authenticated users
 */
router.get('/:id', authenticate, getExamById);

/**
 * TASK 5 — Teacher Paper Management
 * @route GET /api/v2/exams/:id/papers
 * @desc Get all student papers for an exam (teacher view)
 * @access Teacher only (exam creator only)
 */
router.get('/:id/papers', authenticate, teacherOnly, getStudentPapers);

/**
 * TASK 6 — Student Paper Access
 * @route GET /api/v2/exams/:id/my-paper
 * @desc Get student's own paper for an exam
 * @access Student only (enrolled)
 */
router.get('/:id/my-paper', authenticate, getMyPaper);

/**
 * TASK 5 & 6 — Paper Download
 * @route GET /api/v2/exams/:id/papers/:rollNumber/download
 * @desc Download paper PDF
 * @access Teacher (exam creator) or Student (own paper only)
 */
router.get('/:id/papers/:rollNumber/download', authenticate, downloadPaper);

module.exports = router;
