/**
 * PHASE 7.1 — Attempt Eligibility Engine
 * 
 * Centralized server-authoritative eligibility checking.
 * Frontend never decides eligibility.
 * 
 * RULES:
 * • exam exists
 * • exam status allows attempt (published/running)
 * • student is enrolled in exam's class
 * • student has a generated paper
 * • exam time window valid
 * • attemptsAllowed not exceeded
 */

const { Exam, ExamPaper, ExamAttempt } = require('../models');
const { resolveStudentInClass } = require('../utils/enrollmentResolver');
const { getStudentPaper } = require('../utils/paperResolver');

/**
 * Check if a student is eligible to start/continue an exam
 * 
 * @param {string} studentId - Student's user ID
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} { eligible: boolean, reason: string, exam?, enrollment?, paper?, attemptCount? }
 */
async function checkStudentExamEligibility(studentId, examId) {
  try {
    // ==================================================================
    // CHECK 1: Exam exists
    // ==================================================================
    const exam = await Exam.findById(examId).lean();
    
    if (!exam) {
      return {
        eligible: false,
        reason: 'EXAM_NOT_FOUND',
        message: 'Exam does not exist'
      };
    }

    // ==================================================================
    // CHECK 2: Exam status allows attempt (published or running)
    // ==================================================================
    if (!['published', 'running'].includes(exam.status)) {
      return {
        eligible: false,
        reason: 'EXAM_NOT_AVAILABLE',
        message: `Exam is ${exam.status}. Only published or running exams can be attempted.`,
        exam
      };
    }

    // ==================================================================
    // CHECK 3: Student is enrolled in exam's class
    // ==================================================================
    const enrollmentResult = await resolveStudentInClass(exam.classId, studentId);
    
    if (!enrollmentResult.enrollment) {
      return {
        eligible: false,
        reason: 'NOT_ENROLLED',
        message: 'You are not enrolled in the class for this exam',
        exam
      };
    }

    if (!enrollmentResult.isVerified) {
      return {
        eligible: false,
        reason: 'ENROLLMENT_NOT_VERIFIED',
        message: 'Your enrollment in this class is not verified',
        exam,
        enrollment: enrollmentResult
      };
    }

    // ==================================================================
    // CHECK 4: Student has a generated paper
    // ==================================================================
    let paperResult;
    try {
      paperResult = await getStudentPaper(examId, studentId);
    } catch (error) {
      return {
        eligible: false,
        reason: 'NO_PAPER_GENERATED',
        message: error.message || 'No exam paper has been generated for you',
        exam,
        enrollment: enrollmentResult
      };
    }

    // ==================================================================
    // CHECK 5: Exam time window valid
    // ==================================================================
    const now = new Date();

    // If exam has startTime, check if it has begun
    if (exam.startTime && now < new Date(exam.startTime)) {
      return {
        eligible: false,
        reason: 'EXAM_NOT_STARTED',
        message: `Exam will start at ${new Date(exam.startTime).toLocaleString()}`,
        exam,
        enrollment: enrollmentResult,
        paper: paperResult
      };
    }

    // If exam has endTime, check if it has ended
    if (exam.endTime && now > new Date(exam.endTime)) {
      return {
        eligible: false,
        reason: 'EXAM_ENDED',
        message: `Exam ended at ${new Date(exam.endTime).toLocaleString()}`,
        exam,
        enrollment: enrollmentResult,
        paper: paperResult
      };
    }

    // ==================================================================
    // CHECK 6: Attempts allowed not exceeded
    // ==================================================================
    const attemptCount = await ExamAttempt.countDocuments({
      exam: examId,
      student: studentId,
      status: { $in: ['submitted', 'auto-submitted'] }
    });

    if (attemptCount >= exam.attemptsAllowed) {
      return {
        eligible: false,
        reason: 'ATTEMPTS_EXCEEDED',
        message: `You have used all ${exam.attemptsAllowed} attempt(s) for this exam`,
        exam,
        enrollment: enrollmentResult,
        paper: paperResult,
        attemptCount
      };
    }

    // ==================================================================
    // CHECK 7: Detect active attempt (but don't block - controller handles resume)
    // ==================================================================
    const activeAttempt = await ExamAttempt.findOne({
      exam: examId,
      student: studentId,
      status: 'started'
    }).lean();

    // NOTE: We include activeAttempt in the response but don't fail eligibility.
    // The controller will handle resuming the active attempt if it exists.

    // ==================================================================
    // ALL CHECKS PASSED
    // ==================================================================
    return {
      eligible: true,
      reason: activeAttempt ? 'ACTIVE_ATTEMPT_EXISTS' : 'ELIGIBLE',
      message: activeAttempt ? 'Active attempt will be resumed' : 'You are eligible to attempt this exam',
      exam,
      enrollment: enrollmentResult,
      paper: paperResult,
      attemptCount,
      activeAttempt: activeAttempt || null
    };

  } catch (error) {
    console.error('Error checking exam eligibility:', error);
    return {
      eligible: false,
      reason: 'INTERNAL_ERROR',
      message: 'An error occurred while checking eligibility',
      error: error.message
    };
  }
}

/**
 * Check if student can access an active attempt
 * (Used for resume flows)
 * 
 * @param {string} studentId - Student's user ID
 * @param {string} attemptId - Attempt ID
 * @returns {Promise<Object>} { allowed: boolean, reason: string, attempt? }
 */
async function checkAttemptAccess(studentId, attemptId) {
  try {
    const attempt = await ExamAttempt.findById(attemptId).lean();

    if (!attempt) {
      return {
        allowed: false,
        reason: 'ATTEMPT_NOT_FOUND',
        message: 'Attempt does not exist'
      };
    }

    // Verify ownership
    if (attempt.student.toString() !== studentId.toString()) {
      return {
        allowed: false,
        reason: 'UNAUTHORIZED',
        message: 'You do not own this attempt'
      };
    }

    // Check if attempt is still active
    if (attempt.status !== 'started') {
      return {
        allowed: false,
        reason: 'ATTEMPT_NOT_ACTIVE',
        message: `Attempt has already been ${attempt.status}`,
        attempt
      };
    }

    return {
      allowed: true,
      reason: 'ALLOWED',
      message: 'Access granted',
      attempt
    };

  } catch (error) {
    console.error('Error checking attempt access:', error);
    return {
      allowed: false,
      reason: 'INTERNAL_ERROR',
      message: 'An error occurred while checking attempt access',
      error: error.message
    };
  }
}

module.exports = {
  checkStudentExamEligibility,
  checkAttemptAccess
};
