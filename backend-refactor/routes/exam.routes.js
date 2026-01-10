/**
 * Exam Routes
 * Defines API endpoints for exam management
 */

const express = require('express');
const router = express.Router();
const { createExam, publishExam } = require('../controllers/exam.controller');

/**
 * @route POST /api/v2/exams
 * @desc Create a new exam
 * @access Teacher
 */
router.post('/', createExam);

/**
 * @route PATCH /api/v2/exams/:examId/publish
 * @desc Publish an exam
 * @access Teacher (creator only)
 */
router.patch('/:examId/publish', publishExam);

module.exports = router;
