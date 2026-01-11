/**
 * Enrollment Controller
 * Handles HTTP requests for student enrollment management
 */

const enrollmentService = require('../services/enrollment.service');

/**
 * Enroll a student in a class
 * @route POST /api/v2/enrollments
 */
async function enrollStudent(req, res) {
  try {
    const { classId, studentId, enrolledBy } = req.body;

    if (!classId || !studentId || !enrolledBy) {
      return res.status(400).json({
        success: false,
        message: 'classId, studentId, and enrolledBy are required'
      });
    }

    const enrollment = await enrollmentService.enrollStudent({
      classId,
      studentId,
      enrolledBy
    });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: enrollment
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('not authorized') || error.message.includes('Only teachers')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('already enrolled')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to enroll student',
      error: error.message
    });
  }
}

/**
 * Get all students in a class
 * @route GET /api/v2/enrollments/class/:classId
 */
async function getClassStudents(req, res) {
  try {
    const { classId } = req.params;
    const { page = 1, limit = 50, status } = req.query;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'classId is required'
      });
    }

    const result = await enrollmentService.getEnrollmentsByClass(
      classId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      }
    );

    res.status(200).json({
      success: true,
      data: result.enrollments,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve class students',
      error: error.message
    });
  }
}

module.exports = {
  enrollStudent,
  getClassStudents
};
