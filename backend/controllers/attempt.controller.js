/**
 * PHASE 7.1 — Attempt Controller
 * 
 * Handles exam attempt lifecycle:
 * • Start attempt
 * • Get active attempt
 * • Access paper through attempt
 * 
 * SERVER-AUTHORITATIVE: Frontend never decides eligibility
 */

const { ExamAttempt, Exam } = require('../models');
const { checkStudentExamEligibility, checkAttemptAccess } = require('../services/attemptEligibility.service');
const { getStudentId } = require('../utils/studentIdentity');
const { getStudentPaper, getStudentQuestions } = require('../utils/paperResolver');
const attemptService = require('../services/attempt.service');

/**
 * START EXAM ATTEMPT
 * POST /api/v2/attempts/start
 * 
 * Flow:
 * 1. Authenticate student
 * 2. Check eligibility
 * 3. Compute attemptNo
 * 4. Create ExamAttempt
 * 5. Bind exam, student, rollNumber, setId, paperPath
 * 6. Store startedAt and expectedEndTime
 * 7. Return attemptId + basic exam meta
 */
async function startExamAttempt(req, res, next) {
  try {
    const studentId = getStudentId(req);
    const { examId } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        error: 'examId is required'
      });
    }

    // ==================================================================
    // ELIGIBILITY CHECK (server-authoritative)
    // ==================================================================
    const eligibility = await checkStudentExamEligibility(studentId, examId);

    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        error: eligibility.message,
        reason: eligibility.reason
      });
    }

    const { exam, enrollment, paper } = eligibility;

    // ==================================================================
    // PREVENT DUPLICATE SIMULTANEOUS STARTS
    // ==================================================================
    const existingActive = await ExamAttempt.findOne({
      exam: examId,
      student: studentId,
      status: 'started'
    });

    if (existingActive) {
      return res.status(409).json({
        success: false,
        error: 'You already have an active attempt for this exam',
        reason: 'ACTIVE_ATTEMPT_EXISTS',
        attemptId: existingActive._id
      });
    }

    // ==================================================================
    // COMPUTE ATTEMPT NUMBER
    // ==================================================================
    const attemptNo = (eligibility.attemptCount || 0) + 1;

    // ==================================================================
    // CALCULATE EXPECTED END TIME
    // ==================================================================
    const startedAt = new Date();
    const expectedEndTime = new Date(startedAt.getTime() + exam.duration * 60 * 1000);

    // ==================================================================
    // CREATE EXAM ATTEMPT
    // ==================================================================
    const attempt = new ExamAttempt({
      exam: examId,
      student: studentId,
      attemptNo,
      startedAt,
      status: 'started'
    });

    await attempt.save();

    // ==================================================================
    // RETURN ATTEMPT ID + EXAM META
    // ==================================================================
    res.status(201).json({
      success: true,
      message: 'Exam attempt started successfully',
      data: {
        attemptId: attempt._id,
        attemptNo: attempt.attemptNo,
        startedAt: attempt.startedAt,
        expectedEndTime,
        exam: {
          id: exam._id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          status: exam.status
        }
      }
    });

  } catch (error) {
    console.error('Error starting exam attempt:', error);
    next(error);
  }
}

/**
 * GET ACTIVE ATTEMPT
 * GET /api/v2/attempts/:examId/active
 * 
 * Returns active attempt for the exam, or null if none exists
 * Used for resume after refresh
 */
async function getActiveAttempt(req, res, next) {
  try {
    const studentId = getStudentId(req);
    const { examId } = req.params;

    // Find active attempt
    const attempt = await ExamAttempt.findOne({
      exam: examId,
      student: studentId,
      status: 'started'
    })
      .populate('exam', 'title description duration totalMarks status')
      .lean();

    if (!attempt) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active attempt found'
      });
    }

    // Calculate expected end time
    const expectedEndTime = new Date(
      attempt.startedAt.getTime() + attempt.exam.duration * 60 * 1000
    );

    // Check if attempt has expired
    const now = new Date();
    if (now > expectedEndTime) {
      return res.status(200).json({
        success: true,
        data: {
          ...attempt,
          expired: true,
          expectedEndTime
        },
        message: 'Attempt has expired'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        attemptNo: attempt.attemptNo,
        startedAt: attempt.startedAt,
        expectedEndTime,
        exam: attempt.exam,
        expired: false
      }
    });

  } catch (error) {
    console.error('Error fetching active attempt:', error);
    next(error);
  }
}

/**
 * GET EXAM PAPER THROUGH ATTEMPT
 * GET /api/v2/attempts/:attemptId/paper
 * 
 * SECURITY:
 * • Verify ownership
 * • Ensure attempt active
 * • Return paper JSON (not raw file)
 * • Never expose other sets
 * • Never expose storage paths
 * 
 * This is the ONLY way student loads exam content
 */
async function getAttemptPaper(req, res, next) {
  try {
    const studentId = getStudentId(req);
    const { attemptId } = req.params;

    // ==================================================================
    // VERIFY ATTEMPT OWNERSHIP AND STATUS
    // ==================================================================
    const accessCheck = await checkAttemptAccess(studentId, attemptId);

    if (!accessCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: accessCheck.message,
        reason: accessCheck.reason
      });
    }

    const attempt = accessCheck.attempt;

    // ==================================================================
    // CHECK IF ATTEMPT HAS EXPIRED
    // ==================================================================
    const exam = await Exam.findById(attempt.exam).lean();
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    const expectedEndTime = new Date(
      attempt.startedAt.getTime() + exam.duration * 60 * 1000
    );

    const now = new Date();
    if (now > expectedEndTime) {
      return res.status(403).json({
        success: false,
        error: 'Attempt time has expired',
        reason: 'ATTEMPT_EXPIRED'
      });
    }

    // ==================================================================
    // LOAD STUDENT PAPER (secure, filtered)
    // ==================================================================
    const paperResult = await getStudentPaper(exam._id.toString(), studentId);

    if (!paperResult.success) {
      return res.status(404).json({
        success: false,
        error: paperResult.error || 'Paper not found'
      });
    }

    // Get questions with correct answers stripped
    const questions = getStudentQuestions(paperResult.paper);

    // ==================================================================
    // RETURN PAPER JSON
    // ==================================================================
    res.status(200).json({
      success: true,
      data: {
        examId: exam._id,
        examTitle: exam.title,
        totalMarks: exam.totalMarks,
        duration: exam.duration,
        setId: paperResult.setId,
        rollNumber: paperResult.rollNumber,
        questions,
        attemptInfo: {
          attemptId: attempt._id,
          attemptNo: attempt.attemptNo,
          startedAt: attempt.startedAt,
          expectedEndTime
        }
      }
    });

  } catch (error) {
    console.error('Error fetching attempt paper:', error);
    next(error);
  }
}

/**
 * LEGACY: Start a new exam attempt (old flow)
 * @route POST /api/v2/attempts
 * @deprecated Use startExamAttempt instead
 */
async function startAttempt(req, res) {
  try {
    const { examId, studentId, questionPaperId } = req.body;

    if (!examId || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'examId and studentId are required'
      });
    }

    const attempt = await attemptService.startAttempt({
      examId,
      studentId,
      questionPaperId
    });

    res.status(201).json({
      success: true,
      message: 'Attempt started successfully',
      data: attempt
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('not enrolled')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message.includes('not published') ||
      error.message.includes('has not started') ||
      error.message.includes('has ended') ||
      error.message.includes('limit reached')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to start attempt',
      error: error.message
    });
  }
}


/**
 * Record integrity violation
 * @route POST /api/v2/attempts/:id/violation
 */
async function recordViolation(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Violation type is required'
      });
    }

    const attempt = await attemptService.recordIntegrityEvent(id, type);

    res.status(200).json({
      success: true,
      message: 'Violation recorded',
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        integrity: attempt.integrity
      }
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message.includes('not in_progress') ||
      error.message.includes('not live') ||
      error.message.includes('Invalid event type')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to record violation',
      error: error.message
    });
  }
}

/**
 * Record heartbeat
 * @route POST /api/v2/attempts/:id/heartbeat
 */
async function recordHeartbeat(req, res) {
  try {
    const { id } = req.params;

    const attempt = await attemptService.recordHeartbeat(id);

    res.status(200).json({
      success: true,
      message: 'Heartbeat recorded',
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        lastActiveAt: attempt.integrity?.lastActiveAt,
        autoSubmitted: attempt.integrity?.autoSubmitted
      }
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message.includes('not in_progress') ||
      error.message.includes('not live')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to record heartbeat',
      error: error.message
    });
  }
}

/**
 * Submit answer sheet (Phase 3.6)
 * @route POST /api/v2/attempts/:id/submit-sheet
 */
async function submitAnswerSheet(req, res) {
  try {
    const { id } = req.params;
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'filePath is required'
      });
    }

    const attempt = await attemptService.submitAnswerSheet(id, filePath);

    res.status(200).json({
      success: true,
      message: 'Answer sheet submitted',
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        answerSheetPath: attempt.answerSheetPath
      }
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message.includes('Cannot submit answer sheet') ||
      error.message.includes('file not found')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit answer sheet',
      error: error.message
    });
  }
}

module.exports = {
  // PHASE 7.1 - New Attempt Lifecycle
  startExamAttempt,
  getActiveAttempt,
  getAttemptPaper,
  
  // Legacy routes (kept for backward compatibility)
  startAttempt,
  recordViolation,
  recordHeartbeat,
  submitAnswerSheet
};
