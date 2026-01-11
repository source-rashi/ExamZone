const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { teacherOnly } = require('../middleware/role.middleware');
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
router.post('/:id/announcements', teacherOnly, createAnnouncement);

// Get announcements (teacher and students)
router.get('/:id/announcements', getAnnouncements);

// Delete announcement (teacher only)
router.delete('/:id/announcements/:announcementId', teacherOnly, deleteAnnouncement);

// ==================== EXAMS ====================

// Create exam (teacher only)
router.post('/:id/exams', teacherOnly, createExam);

// Get exams (teacher and students)
router.get('/:id/exams', getExams);

// ==================== ASSIGNMENTS ====================

// Create assignment (teacher only)
router.post('/:id/assignments', teacherOnly, createAssignment);

// Get assignments (teacher and students)
router.get('/:id/assignments', getAssignments);

// ==================== MEMBERS ====================

// Get members (teacher and students)
router.get('/:id/members', getMembers);

module.exports = router;
