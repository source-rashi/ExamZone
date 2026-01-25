/**
 * PHASE 7.2 — Student Dashboard Controller
 * 
 * Provides dashboard metrics and data for student view
 */

const { Enrollment } = require('../models');
const { Exam } = require('../models');
const { Assignment } = require('../models');

/**
 * Get student dashboard data
 * @route GET /api/v2/student/dashboard
 */
async function getStudentDashboard(req, res) {
  try {
    const studentId = req.user.id;

    console.log('[Student Dashboard] Request from:', {
      userId: studentId,
      userRole: req.user.role,
      userEmail: req.user.email
    });

    // Get all active enrollments
    const enrollments = await Enrollment.find({
      studentId,
      status: 'active'
    })
    .populate({
      path: 'classId',
      populate: {
        path: 'teacher',
        select: 'name email'
      }
    })
    .sort({ joinedAt: -1 });

    console.log('[Student Dashboard] Found enrollments:', enrollments.length);

    // Extract valid classes
    const classes = enrollments
      .filter(e => e.classId)
      .map(e => ({
        _id: e.classId._id,
        name: e.classId.name || e.classId.title,
        title: e.classId.title || e.classId.name,
        code: e.classId.code,
        description: e.classId.description,
        subject: e.classId.subject,
        teacher: e.classId.teacher,
        enrolledAt: e.joinedAt,
        rollNumber: e.rollNumber
      }));

    const classIds = classes.map(c => c._id);

    // Count upcoming exams (published or running)
    let upcomingExamsCount = 0;
    if (classIds.length > 0) {
      upcomingExamsCount = await Exam.countDocuments({
        classId: { $in: classIds },
        status: { $in: ['published', 'running'] }
      });
    }

    // Count pending assignments
    let pendingAssignmentsCount = 0;
    if (classIds.length > 0 && Assignment) {
      try {
        pendingAssignmentsCount = await Assignment.countDocuments({
          classId: { $in: classIds },
          status: 'active'
        });
      } catch (err) {
        console.warn('[Student Dashboard] Could not count assignments:', err.message);
      }
    }

    const dashboardData = {
      enrolledClassesCount: classes.length,
      classes,
      upcomingExamsCount,
      pendingAssignmentsCount
    };

    console.log('[Student Dashboard] Returning data:', {
      enrolledClassesCount: dashboardData.enrolledClassesCount,
      upcomingExamsCount: dashboardData.upcomingExamsCount,
      pendingAssignmentsCount: dashboardData.pendingAssignmentsCount
    });

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('[Student Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data',
      error: error.message
    });
  }
}

module.exports = {
  getStudentDashboard
};
