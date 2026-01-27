/**
 * PHASE 8.2 — Ownership Verification Middleware
 * Prevents IDOR and cross-class data leaks
 */

const Class = require('../models/Class');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Enrollment = require('../models/Enrollment');

/**
 * Verify teacher owns the class
 */
async function verifyClassOwnership(req, res, next) {
  try {
    const classId = req.params.classId || req.params.id;
    const teacherId = req.user.id;

    const classDoc = await Class.findById(classId);
    
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classDoc.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not own this class'
      });
    }

    req.classDoc = classDoc;
    next();
  } catch (error) {
    console.error('[Ownership] Class verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify class ownership'
    });
  }
}

/**
 * Verify teacher owns the exam
 */
async function verifyExamOwnership(req, res, next) {
  try {
    const examId = req.params.examId || req.params.id;
    const teacherId = req.user.id;

    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    if (exam.createdBy.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not own this exam'
      });
    }

    req.examDoc = exam;
    next();
  } catch (error) {
    console.error('[Ownership] Exam verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify exam ownership'
    });
  }
}

/**
 * Verify user has access to class (either teacher owns it or student is enrolled)
 */
async function verifyClassEnrollment(req, res, next) {
  try {
    const classId = req.params.classId || req.params.id;
    const userId = req.user.id;

    // Check if user is the teacher who owns the class
    const classDoc = await Class.findById(classId);
    
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    const isTeacher = classDoc.teacher?.toString() === userId || classDoc.teacherId?.toString() === userId;
    
    if (isTeacher) {
      req.classDoc = classDoc;
      req.isTeacher = true;
      return next();
    }

    // Check if user is a student enrolled in the class
    const enrollment = await Enrollment.findOne({
      classId,
      studentId: userId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You are not enrolled in this class'
      });
    }

    req.enrollment = enrollment;
    req.classDoc = classDoc;
    req.isTeacher = false;
    next();
  } catch (error) {
    console.error('[Ownership] Enrollment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify class enrollment'
    });
  }
}

/**
 * Verify student owns the attempt
 */
async function verifyAttemptOwnership(req, res, next) {
  try {
    const attemptId = req.params.attemptId || req.params.id;
    const studentId = req.user.id;

    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found'
      });
    }

    if (attempt.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: This is not your attempt'
      });
    }

    req.attemptDoc = attempt;
    next();
  } catch (error) {
    console.error('[Ownership] Attempt verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify attempt ownership'
    });
  }
}

/**
 * Verify student has access to exam (enrolled in class)
 */
async function verifyExamAccess(req, res, next) {
  try {
    const examId = req.params.examId || req.body.examId;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    // Check if student is enrolled in exam's class
    const enrollment = await Enrollment.findOne({
      classId: exam.classId,
      studentId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You are not enrolled in this exam\'s class'
      });
    }

    req.examDoc = exam;
    req.enrollment = enrollment;
    next();
  } catch (error) {
    console.error('[Ownership] Exam access verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify exam access'
    });
  }
}

/**
 * Verify teacher has access to student's attempt (owns the exam)
 */
async function verifyAttemptEvaluationAccess(req, res, next) {
  try {
    const attemptId = req.params.attemptId;
    const teacherId = req.user.id;

    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found'
      });
    }

    const exam = await Exam.findById(attempt.exam);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    if (exam.createdBy.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not own this exam'
      });
    }

    req.attemptDoc = attempt;
    req.examDoc = exam;
    next();
  } catch (error) {
    console.error('[Ownership] Evaluation access verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify evaluation access'
    });
  }
}

module.exports = {
  verifyClassOwnership,
  verifyExamOwnership,
  verifyClassEnrollment,
  verifyAttemptOwnership,
  verifyExamAccess,
  verifyAttemptEvaluationAccess
};
