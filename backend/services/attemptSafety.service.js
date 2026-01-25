/**
 * PHASE 7.1 — Attempt Safety Service
 * 
 * Provides lifecycle protections:
 * • Auto-close expired attempts
 * • Block paper access after submit
 * • Ensure one active attempt per exam per student
 * • Comprehensive logging
 * 
 * Run periodically via cron or on-demand
 */

const { ExamAttempt, Exam } = require('../models');

/**
 * Auto-close expired attempts
 * 
 * Finds all 'started' attempts where expectedEndTime has passed
 * and marks them as 'auto-submitted'
 * 
 * @returns {Promise<Object>} { closedCount, closedAttempts }
 */
async function autoCloseExpiredAttempts() {
  try {
    const now = new Date();
    
    // Find all active attempts
    const activeAttempts = await ExamAttempt.find({ status: 'started' })
      .populate('exam', 'duration')
      .lean();

    const expiredAttempts = [];
    const closedAttemptIds = [];

    for (const attempt of activeAttempts) {
      if (!attempt.exam) continue;

      const expectedEndTime = new Date(
        attempt.startedAt.getTime() + attempt.exam.duration * 60 * 1000
      );

      if (now > expectedEndTime) {
        expiredAttempts.push({
          attemptId: attempt._id,
          student: attempt.student,
          exam: attempt.exam._id,
          startedAt: attempt.startedAt,
          expectedEndTime,
          overdueBy: Math.floor((now - expectedEndTime) / 1000 / 60) // minutes
        });
        closedAttemptIds.push(attempt._id);
      }
    }

    // Close all expired attempts
    if (closedAttemptIds.length > 0) {
      await ExamAttempt.updateMany(
        { _id: { $in: closedAttemptIds } },
        {
          $set: {
            status: 'auto-submitted',
            submittedAt: now
          }
        }
      );

      console.log(`[ATTEMPT SAFETY] Auto-closed ${closedAttemptIds.length} expired attempts`);
      expiredAttempts.forEach(a => {
        console.log(`  - Attempt ${a.attemptId}: overdue by ${a.overdueBy} minutes`);
      });
    }

    return {
      closedCount: closedAttemptIds.length,
      closedAttempts: expiredAttempts
    };

  } catch (error) {
    console.error('[ATTEMPT SAFETY] Error auto-closing expired attempts:', error);
    throw error;
  }
}

/**
 * Verify attempt integrity
 * 
 * Checks for:
 * • Multiple active attempts per student per exam
 * • Orphan attempts (exam or student deleted)
 * • Attempts with invalid status
 * 
 * @returns {Promise<Object>} { issues, attemptCount }
 */
async function verifyAttemptIntegrity() {
  try {
    const issues = [];
    
    // ==================================================================
    // CHECK 1: Multiple active attempts per student per exam
    // ==================================================================
    const activeAttempts = await ExamAttempt.find({ status: 'started' }).lean();
    
    const attemptMap = {};
    for (const attempt of activeAttempts) {
      const key = `${attempt.exam}_${attempt.student}`;
      if (!attemptMap[key]) {
        attemptMap[key] = [];
      }
      attemptMap[key].push(attempt._id);
    }

    for (const [key, attemptIds] of Object.entries(attemptMap)) {
      if (attemptIds.length > 1) {
        issues.push({
          type: 'MULTIPLE_ACTIVE_ATTEMPTS',
          examStudent: key,
          attemptIds,
          count: attemptIds.length
        });
      }
    }

    // ==================================================================
    // CHECK 2: Orphan attempts (deleted exam)
    // ==================================================================
    const allAttempts = await ExamAttempt.find({}).lean();
    
    for (const attempt of allAttempts) {
      const exam = await Exam.findById(attempt.exam).lean();
      if (!exam) {
        issues.push({
          type: 'ORPHAN_ATTEMPT',
          attemptId: attempt._id,
          examId: attempt.exam,
          studentId: attempt.student,
          message: 'Exam no longer exists'
        });
      }
    }

    // ==================================================================
    // CHECK 3: Invalid status
    // ==================================================================
    const invalidStatusAttempts = await ExamAttempt.find({
      status: { $nin: ['started', 'submitted', 'auto-submitted'] }
    }).lean();

    for (const attempt of invalidStatusAttempts) {
      issues.push({
        type: 'INVALID_STATUS',
        attemptId: attempt._id,
        status: attempt.status,
        message: `Invalid status: ${attempt.status}`
      });
    }

    console.log(`[ATTEMPT SAFETY] Integrity check complete: ${issues.length} issues found`);
    
    return {
      issues,
      attemptCount: allAttempts.length,
      activeCount: activeAttempts.length
    };

  } catch (error) {
    console.error('[ATTEMPT SAFETY] Error verifying attempt integrity:', error);
    throw error;
  }
}

/**
 * Get attempt statistics
 * 
 * @returns {Promise<Object>} Statistics about attempts
 */
async function getAttemptStatistics() {
  try {
    const total = await ExamAttempt.countDocuments();
    const started = await ExamAttempt.countDocuments({ status: 'started' });
    const submitted = await ExamAttempt.countDocuments({ status: 'submitted' });
    const autoSubmitted = await ExamAttempt.countDocuments({ status: 'auto-submitted' });

    // Find oldest active attempt
    const oldestActive = await ExamAttempt.findOne({ status: 'started' })
      .sort({ startedAt: 1 })
      .lean();

    return {
      total,
      byStatus: {
        started,
        submitted,
        autoSubmitted
      },
      oldestActive: oldestActive ? {
        attemptId: oldestActive._id,
        startedAt: oldestActive.startedAt,
        ageMinutes: Math.floor((Date.now() - oldestActive.startedAt) / 1000 / 60)
      } : null
    };

  } catch (error) {
    console.error('[ATTEMPT SAFETY] Error getting statistics:', error);
    throw error;
  }
}

/**
 * Block paper access for non-active attempts
 * 
 * This is a validation helper used in controllers
 * 
 * @param {Object} attempt - Attempt document
 * @returns {Object} { allowed: boolean, reason: string }
 */
function checkPaperAccessAllowed(attempt) {
  if (attempt.status !== 'started') {
    return {
      allowed: false,
      reason: 'ATTEMPT_NOT_ACTIVE',
      message: `Cannot access paper for ${attempt.status} attempt`
    };
  }

  // Check if expired
  const now = new Date();
  const expectedEndTime = new Date(
    attempt.startedAt.getTime() + (attempt.exam?.duration || 0) * 60 * 1000
  );

  if (now > expectedEndTime) {
    return {
      allowed: false,
      reason: 'ATTEMPT_EXPIRED',
      message: 'Attempt time has expired'
    };
  }

  return {
    allowed: true,
    reason: 'ALLOWED'
  };
}

/**
 * Ensure one active attempt per student per exam
 * 
 * If multiple active attempts exist, close all but the most recent
 * 
 * @param {string} examId - Exam ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} { closedCount, keptAttempt }
 */
async function ensureOneActiveAttempt(examId, studentId) {
  try {
    const activeAttempts = await ExamAttempt.find({
      exam: examId,
      student: studentId,
      status: 'started'
    })
      .sort({ startedAt: -1 }) // Most recent first
      .lean();

    if (activeAttempts.length <= 1) {
      return {
        closedCount: 0,
        keptAttempt: activeAttempts[0] || null
      };
    }

    // Keep the most recent, close the rest
    const keptAttempt = activeAttempts[0];
    const toClose = activeAttempts.slice(1);

    await ExamAttempt.updateMany(
      { _id: { $in: toClose.map(a => a._id) } },
      {
        $set: {
          status: 'auto-submitted',
          submittedAt: new Date()
        }
      }
    );

    console.log(`[ATTEMPT SAFETY] Closed ${toClose.length} duplicate active attempts for student ${studentId} on exam ${examId}`);

    return {
      closedCount: toClose.length,
      keptAttempt
    };

  } catch (error) {
    console.error('[ATTEMPT SAFETY] Error ensuring one active attempt:', error);
    throw error;
  }
}

module.exports = {
  autoCloseExpiredAttempts,
  verifyAttemptIntegrity,
  getAttemptStatistics,
  checkPaperAccessAllowed,
  ensureOneActiveAttempt
};
