/**
 * PHASE 7.1 — Attempt Security Middleware
 * 
 * Enforces attempt ownership and status validation.
 * Blocks cross-student access.
 * 
 * CRITICAL: All attempt access must go through this middleware.
 */

const { ExamAttempt } = require('../models');
const { getStudentId } = require('../utils/studentIdentity');

/**
 * Load attempt and verify ownership
 * 
 * Ensures:
 * • Attempt exists
 * • Student owns the attempt
 * • Attempt is active (status = 'started')
 * • No cross-student access
 * 
 * Attaches attempt to req.attempt for downstream use
 */
async function loadAttemptAndVerifyOwnership(req, res, next) {
  try {
    const studentId = getStudentId(req);
    const { attemptId } = req.params;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        error: 'attemptId is required'
      });
    }

    // ==================================================================
    // LOAD ATTEMPT
    // ==================================================================
    const attempt = await ExamAttempt.findById(attemptId)
      .populate('exam', 'title duration status startTime endTime')
      .lean();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found'
      });
    }

    // ==================================================================
    // VERIFY OWNERSHIP
    // ==================================================================
    if (attempt.student.toString() !== studentId.toString()) {
      console.warn(`[SECURITY] Unauthorized attempt access: Student ${studentId} tried to access attempt ${attemptId} owned by ${attempt.student}`);
      
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this attempt',
        reason: 'UNAUTHORIZED'
      });
    }

    // ==================================================================
    // VERIFY ATTEMPT IS ACTIVE
    // ==================================================================
    if (attempt.status !== 'started') {
      return res.status(403).json({
        success: false,
        error: `This attempt has already been ${attempt.status}`,
        reason: 'ATTEMPT_NOT_ACTIVE',
        status: attempt.status
      });
    }

    // ==================================================================
    // CHECK IF ATTEMPT HAS EXPIRED
    // ==================================================================
    const now = new Date();
    const expectedEndTime = new Date(
      attempt.startedAt.getTime() + attempt.exam.duration * 60 * 1000
    );

    if (now > expectedEndTime) {
      console.log(`[ATTEMPT] Attempt ${attemptId} has expired`);
      
      return res.status(403).json({
        success: false,
        error: 'Attempt time has expired',
        reason: 'ATTEMPT_EXPIRED',
        startedAt: attempt.startedAt,
        expectedEndTime
      });
    }

    // ==================================================================
    // ATTACH TO REQUEST
    // ==================================================================
    req.attempt = attempt;
    req.expectedEndTime = expectedEndTime;

    next();

  } catch (error) {
    console.error('Error verifying attempt ownership:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify attempt ownership'
    });
  }
}

/**
 * Verify student has active attempt for exam
 * Used for exam-level operations (not attempt-level)
 * 
 * Attaches attempt to req.attempt
 */
async function verifyActiveAttempt(req, res, next) {
  try {
    const studentId = getStudentId(req);
    const { examId } = req.params;

    if (!examId) {
      return res.status(400).json({
        success: false,
        error: 'examId is required'
      });
    }

    const attempt = await ExamAttempt.findOne({
      exam: examId,
      student: studentId,
      status: 'started'
    })
      .populate('exam', 'title duration status')
      .lean();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'No active attempt found for this exam',
        reason: 'NO_ACTIVE_ATTEMPT'
      });
    }

    // Check if expired
    const now = new Date();
    const expectedEndTime = new Date(
      attempt.startedAt.getTime() + attempt.exam.duration * 60 * 1000
    );

    if (now > expectedEndTime) {
      return res.status(403).json({
        success: false,
        error: 'Attempt time has expired',
        reason: 'ATTEMPT_EXPIRED'
      });
    }

    req.attempt = attempt;
    req.expectedEndTime = expectedEndTime;

    next();

  } catch (error) {
    console.error('Error verifying active attempt:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify active attempt'
    });
  }
}

module.exports = {
  loadAttemptAndVerifyOwnership,
  verifyActiveAttempt
};
