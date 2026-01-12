/**
 * PHASE 6.1 — Exam Routes (V2)
 * RESTful endpoints for exam management
 */

const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller.v2');
const examControllerV1 = require('../controllers/exam.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Teacher routes
router.post('/exams', authenticate, examController.createExam);
router.get('/exams/:id', authenticate, examControllerV1.getExamById);
router.patch('/exams/:id', authenticate, examControllerV1.updateExam);
router.post('/exams/:id/publish', authenticate, examController.publishExam);
router.post('/exams/:id/close', authenticate, examController.closeExam);
router.get('/exams/class/:classId', authenticate, examController.getClassExams);

// PHASE 6.3 - AI Question Paper Generation
router.post('/exams/:id/generate-papers', authenticate, examControllerV1.generateQuestionPapers);

// PHASE 6.4 - Student Paper Generation
router.post('/exams/:id/generate-student-papers', authenticate, examControllerV1.generateStudentPapers);
router.get('/exams/:id/details', authenticate, examControllerV1.getExamDetails);
router.get('/exams/:id/my-paper', authenticate, examControllerV1.getMyPaper);

// Student routes
router.get('/exams/student/:classId', authenticate, examController.getStudentExams);
router.post('/exams/:id/start', authenticate, examController.startAttempt);
router.post('/exams/:attemptId/submit', authenticate, examController.submitAttempt);

module.exports = router;
