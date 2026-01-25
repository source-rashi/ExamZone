/**
 * PHASE 7.0 — Student Exam Routes
 * Routes for student to view exams across all enrolled classes
 */

const express = require('express');
const router = express.Router();
const { getAllStudentExams } = require('../controllers/exam.controller.v2');
const { authenticate } = require('../middleware/auth.middleware');
const { studentOnly } = require('../middleware/role.middleware');

/**
 * GET /api/v2/student/exams/all
 * Get all exams from all enrolled classes
 */
router.get('/exams/all', authenticate, studentOnly, getAllStudentExams);

module.exports = router;
