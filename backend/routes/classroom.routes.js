const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { teacherOnly } = require('../middleware/role.middleware');
const { 
  verifyClassOwnership, 
  verifyClassEnrollment 
} = require('../middleware/ownership.middleware');
const {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  createExam,
  getExams,
  createAssignment,
  getAssignments,
  getMembers
} = require('../controllers/classroom.controller');

// All routes require authentication
router.use(authenticate);

// ==================== ANNOUNCEMENTS ====================

// Create announcement (teacher only)
router.post('/:id/announcements', teacherOnly, verifyClassOwnership, createAnnouncement);

// Get announcements (teacher and students)
router.get('/:id/announcements', verifyClassEnrollment, getAnnouncements);

// Delete announcement (teacher only)
router.delete('/:id/announcements/:announcementId', teacherOnly, verifyClassOwnership, deleteAnnouncement);

// ==================== EXAMS ====================

// Create exam (teacher only)
router.post('/:id/exams', teacherOnly, verifyClassOwnership, createExam);

// Get exams (teacher and students)
router.get('/:id/exams', verifyClassEnrollment, getExams);

// ==================== ASSIGNMENTS ====================

// Create assignment (teacher only)
router.post('/:id/assignments', teacherOnly, verifyClassOwnership, createAssignment);

// Get assignments (teacher and students)
router.get('/:id/assignments', verifyClassEnrollment, getAssignments);

// ==================== MEMBERS ====================

// Get members (teacher and students)
router.get('/:id/members', verifyClassEnrollment, getMembers);

module.exports = router;
