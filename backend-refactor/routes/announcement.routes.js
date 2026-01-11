/**
 * PHASE 5.2 — Announcement Routes
 * API endpoints for classroom announcements
 */

const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
} = require('../controllers/announcement.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route POST /api/classes/:classId/announcements
 * @desc Create announcement (teacher only)
 * @access Authenticated (teacher of class)
 */
router.post('/classes/:classId/announcements', authenticate, createAnnouncement);

/**
 * @route GET /api/classes/:classId/announcements
 * @desc Get all announcements for a class
 * @access Authenticated (class members)
 */
router.get('/classes/:classId/announcements', authenticate, getAnnouncements);

/**
 * @route DELETE /api/announcements/:id
 * @desc Delete announcement
 * @access Authenticated (author or class teacher)
 */
router.delete('/announcements/:id', authenticate, deleteAnnouncement);

module.exports = router;
