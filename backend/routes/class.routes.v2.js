/**
 * Class Routes (V2)
 * Defines API endpoints for class management
 */

const express = require('express');
const router = express.Router();
const { 
  createClassV2, 
  getClassByCode,
  getClassById,
  getTeacherClasses, 
  getStudentClasses,
  getMyClasses,
  joinClassV2
} = require('../controllers/class.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { teacherOnly, studentOnly } = require('../middleware/role.middleware');

/**
 * @route GET /api/v2/classes/my
 * @desc Get all classes for the authenticated user (teacher or student)
 * @access Authenticated users
 */
router.get('/my', authenticate, getMyClasses);

/**
 * @route GET /api/v2/classes/teacher
 * @desc Get all classes for the authenticated teacher
 * @access Teacher only
 */
router.get('/teacher', authenticate, teacherOnly, getTeacherClasses);

/**
 * @route GET /api/v2/classes/student
 * @desc Get all classes for the authenticated student
 * @access Student only
 */
router.get('/student', authenticate, studentOnly, getStudentClasses);

/**
 * @route POST /api/v2/classes
 * @desc Create a new class
 * @access Teacher only
 */
router.post('/', authenticate, teacherOnly, createClassV2);

/**
 * @route POST /api/v2/classes/join
 * @desc Join a class
 * @access Student only
 */
router.post('/join', authenticate, studentOnly, joinClassV2);

/**
 * @route GET /api/v2/classes/by-id/:id
 * @desc Get class by ID (with populated teacher and students)
 * @access Authenticated users (must be teacher or enrolled student)
 */
router.get('/by-id/:id', authenticate, getClassById);

/**
 * @route GET /api/v2/classes/:id
 * @desc Get class by ID (alias for by-id)
 * @access Authenticated users (must be teacher or enrolled student)
 */
router.get('/:id', authenticate, getClassById);

module.exports = router;
