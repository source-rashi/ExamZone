/**
 * Enrollment Routes
 * Defines API endpoints for enrollment management
 */

const express = require('express');
const router = express.Router();
const { enrollStudent, getClassStudents } = require('../controllers/enrollment.controller');

/**
 * @route POST /api/v2/enrollments
 * @desc Enroll a student in a class
 * @access Teacher
 */
router.post('/', enrollStudent);

/**
 * @route GET /api/v2/enrollments/class/:classId
 * @desc Get all students in a class
 * @access Teacher
 */
router.get('/class/:classId', getClassStudents);

module.exports = router;
