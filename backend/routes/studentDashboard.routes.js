/**
 * PHASE 7.2 — Student Dashboard Routes
 * 
 * GET /api/v2/student/dashboard - Dashboard metrics
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { studentOnly } = require('../middleware/role.middleware');
const { getStudentDashboard } = require('../controllers/studentDashboard.controller');

/**
 * @route GET /api/v2/student/dashboard
 * @desc Get student dashboard data (classes, exams, assignments)
 * @access Student only
 */
router.get('/dashboard', authenticate, studentOnly, getStudentDashboard);

module.exports = router;
