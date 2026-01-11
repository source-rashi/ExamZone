/**
 * PHASE 6.1 — Exam Routes (V2)
 * RESTful endpoints for exam management
 */

const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller.v2');
const { authenticate } = require('../middleware/auth.middleware');

// Teacher routes
router.post('/exams', authenticate, examController.createExam);
router.post('/exams/:id/publish', authenticate, examController.publishExam);
router.post('/exams/:id/close', authenticate, examController.closeExam);
router.get('/exams/class/:classId', authenticate, examController.getClassExams);

// Student routes
router.get('/exams/student/:classId', authenticate, examController.getStudentExams);
router.post('/exams/:id/start', authenticate, examController.startAttempt);
router.post('/exams/:attemptId/submit', authenticate, examController.submitAttempt);

module.exports = router;
