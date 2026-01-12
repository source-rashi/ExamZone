/**
 * Enrollment Routes
 * Defines API endpoints for enrollment management
 */

const express = require('express');
const router = express.Router();
const { enrollStudent, getClassStudents, patchRollNumbers } = require('../controllers/enrollment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { teacherOnly } = require('../middleware/role.middleware');

/**
 * @route POST /api/v2/enrollments
 * @desc Enroll a student in a class
 * @access Teacher only
 */
router.post('/', authenticate, teacherOnly, enrollStudent);

/**
 * @route GET /api/v2/enrollments/class/:classId
 * @desc Get all students in a class
 * @access Teacher only
 */
router.get('/class/:classId', authenticate, teacherOnly, getClassStudents);

/**
 * @route POST /api/v2/enrollments/patch-roll-numbers
 * @desc Patch roll numbers for existing enrollments
 * @access Teacher only
 */
router.post('/patch-roll-numbers', authenticate, teacherOnly, patchRollNumbers);

module.exports = router;
