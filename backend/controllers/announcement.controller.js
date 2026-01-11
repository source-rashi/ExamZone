/**
 * PHASE 5.2 — Announcement Controller
 * Handles announcement CRUD operations for classrooms
 */

const Announcement = require('../models/Announcement');
const Class = require('../models/Class');

/**
 * Create announcement (Teacher only)
 * POST /api/classes/:classId/announcements
 */
async function createAnnouncement(req, res) {
  try {
    const { classId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Announcement content is required'
      });
    }

    // Verify class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify user is the teacher of this class
    if (classDoc.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the class teacher can create announcements'
      });
    }

    // Create announcement
    const announcement = await Announcement.create({
      content: content.trim(),
      class: classId,
      author: userId
    });

    // Populate author for response
    await announcement.populate('author', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: { announcement }
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message
    });
  }
}

/**
 * Get all announcements for a class
 * GET /api/classes/:classId/announcements
 */
async function getAnnouncements(req, res) {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    // Verify class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify user is a member of the class (teacher or student)
    const isTeacher = classDoc.teacher.toString() === userId;
    const isStudent = classDoc.students.some(s => s.toString() === userId);

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class'
      });
    }

    // Fetch announcements sorted by latest first
    const announcements = await Announcement.find({ class: classId })
      .populate('author', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Announcements fetched successfully',
      data: { announcements }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
}

/**
 * Delete announcement
 * DELETE /api/announcements/:id
 */
async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find announcement
    const announcement = await Announcement.findById(id).populate('class');
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is author or class teacher
    const isAuthor = announcement.author.toString() === userId;
    const isClassTeacher = announcement.class.teacher.toString() === userId;

    if (!isAuthor && !isClassTeacher) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this announcement'
      });
    }

    // Delete announcement
    await Announcement.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error.message
    });
  }
}

module.exports = {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
};
