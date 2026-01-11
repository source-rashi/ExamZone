/**
 * PHASE 5.3 — Assignment Routes
 * File-based assignment system endpoints
 */

const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  downloadAssignment,
  submitAssignment,
  getSubmissions,
  downloadSubmission
} = require('../controllers/assignment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadAssignment, uploadSubmission } = require('../config/upload.config');

/**
 * @route POST /api/classes/:classId/assignments
 * @desc Create assignment with file upload (teacher only)
 * @access Authenticated (teacher of class)
 */
router.post('/classes/:classId/assignments', authenticate, uploadAssignment, createAssignment);

/**
 * @route GET /api/classes/:classId/assignments
 * @desc Get all assignments for a class
 * @access Authenticated (class members)
 */
router.get('/classes/:classId/assignments', authenticate, getAssignments);

/**
 * @route GET /api/assignments/:id/download
 * @desc Download assignment file
 * @access Authenticated (class members)
 */
router.get('/assignments/:id/download', authenticate, downloadAssignment);

/**
 * @route POST /api/assignments/:id/submit
 * @desc Submit assignment solution (student only)
 * @access Authenticated (enrolled students)
 */
router.post('/assignments/:id/submit', authenticate, uploadSubmission, submitAssignment);

/**
 * @route GET /api/assignments/:id/submissions
 * @desc Get all submissions for an assignment (teacher only)
 * @access Authenticated (assignment teacher)
 */
router.get('/assignments/:id/submissions', authenticate, getSubmissions);

/**
 * @route GET /api/submissions/:submissionId/download
 * @desc Download student submission (teacher only)
 * @access Authenticated (assignment teacher)
 */
router.get('/submissions/:submissionId/download', authenticate, downloadSubmission);

module.exports = router;
