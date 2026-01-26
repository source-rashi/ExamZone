/**
 * PHASE 7.1 — Attempt Controller
 * 
 * Handles exam attempt lifecycle:
 * • Start attempt
 * • Get active attempt
 * • Access paper through attempt
 * 
 * SERVER-AUTHORITATIVE: Frontend never decides eligibility
 * SAFETY: Enforces one active attempt, auto-closes expired
 */

const { ExamAttempt, Exam } = require('../models');
const { checkStudentExamEligibility, checkAttemptAccess } = require('../services/attemptEligibility.service');
const { getStudentId } = require('../utils/studentIdentity');
const { getStudentPaper, getStudentQuestions } = require('../utils/paperResolver');
const { ensureOneActiveAttempt, checkPaperAccessAllowed } = require('../services/attemptSafety.service');
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
    // PHASE 7.1 SAFETY: Ensure one active attempt per exam
    // ==================================================================
    await ensureOneActiveAttempt(examId, studentId);

    // ==================================================================
    // PREVENT DUPLICATE SIMULTANEOUS STARTS (double-check)
    // Check for ANY existing attempt (active or not) with same attemptNo
    // ==================================================================
    const existingActive = await ExamAttempt.findOne({
      exam: examId,
      student: studentId,
      status: 'started'
    });

    if (existingActive) {
      console.log(`[ATTEMPT] Resuming existing active attempt ${existingActive._id} for exam ${examId}`);
      
      // Get questions
      const questionsData = await getStudentQuestions(examId, studentId);
      
      // Calculate remaining time
      const elapsedMinutes = Math.floor((new Date() - existingActive.startedAt) / 60000);
      const remainingMinutes = Math.max(0, exam.duration - elapsedMinutes);
      
      // Return existing attempt data so student can resume
      return res.status(200).json({
        success: true,
        message: 'Resuming existing exam attempt',
        data: {
          attemptId: existingActive._id,
          attemptNo: existingActive.attemptNo,
          startedAt: existingActive.startedAt,
          expectedEndTime: new Date(existingActive.startedAt.getTime() + exam.duration * 60 * 1000),
          remainingMinutes,
          exam: {
            id: exam._id,
            title: exam.title,
            description: exam.description,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            instructions: exam.settings?.instructions || ''
          },
          paper: questionsData,
          previousAnswers: existingActive.answers || [],
          isResume: true
        }
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

    console.log(`[ATTEMPT] Started attempt ${attempt._id} for student ${studentId} on exam ${examId} (attempt #${attemptNo})`);

    // ==================================================================
    // GET QUESTIONS FOR THE STUDENT
    // ==================================================================
    const questionsData = await getStudentQuestions(examId, studentId);

    // ==================================================================
    // RETURN ATTEMPT ID + EXAM META + QUESTIONS
    // ==================================================================
    res.status(201).json({
      success: true,
      message: 'Exam attempt started successfully',
      data: {
        attemptId: attempt._id,
        attemptNo: attempt.attemptNo,
        startedAt: attempt.startedAt,
        expectedEndTime,
        remainingMinutes: exam.duration,
        exam: {
          id: exam._id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          status: exam.status,
          instructions: exam.settings?.instructions || ''
        },
        paper: questionsData,
        previousAnswers: []
      }
    });

  } catch (error) {
    console.error('[ATTEMPT] Error starting exam attempt:', error);
    
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      // Try to find the existing attempt
      const existingAttempt = await ExamAttempt.findOne({
        exam: req.body.examId,
        student: getStudentId(req),
        status: 'started'
      }).populate('exam');
      
      if (existingAttempt) {
        console.log('[ATTEMPT] Duplicate detected, returning existing attempt:', existingAttempt._id);
        
        // Get questions
        const questionsData = await getStudentQuestions(req.body.examId, getStudentId(req));
        
        // Calculate remaining time
        const elapsedMinutes = Math.floor((new Date() - existingAttempt.startedAt) / 60000);
        const remainingMinutes = Math.max(0, existingAttempt.exam.duration - elapsedMinutes);
        
        return res.status(200).json({
          success: true,
          message: 'Resuming existing exam attempt',
          data: {
            attemptId: existingAttempt._id,
            attemptNo: existingAttempt.attemptNo,
            startedAt: existingAttempt.startedAt,
            expectedEndTime: new Date(existingAttempt.startedAt.getTime() + existingAttempt.exam.duration * 60 * 1000),
            remainingMinutes,
            exam: {
              id: existingAttempt.exam._id,
              title: existingAttempt.exam.title,
              description: existingAttempt.exam.description,
              duration: existingAttempt.exam.duration,
              totalMarks: existingAttempt.exam.totalMarks,
              instructions: existingAttempt.exam.settings?.instructions || ''
            },
            paper: questionsData,
            previousAnswers: existingAttempt.answers || [],
            isResume: true
          }
        });
      }
    }
    
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
      console.warn(`[ATTEMPT] Paper access denied for attempt ${attemptId}: ${accessCheck.reason}`);
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
      console.log(`[ATTEMPT] Paper access blocked for expired attempt ${attemptId}`);
      return res.status(403).json({
        success: false,
        error: 'Attempt time has expired',
        reason: 'ATTEMPT_EXPIRED'
      });
    }

    // ==================================================================
    // PHASE 7.1 SAFETY: Additional paper access check
    // ==================================================================
    const paperAccessCheck = checkPaperAccessAllowed({
      ...attempt,
      exam: { duration: exam.duration }
    });

    if (!paperAccessCheck.allowed) {
      console.warn(`[ATTEMPT] Paper access blocked for attempt ${attemptId}: ${paperAccessCheck.reason}`);
      return res.status(403).json({
        success: false,
        error: paperAccessCheck.message,
        reason: paperAccessCheck.reason
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

/**
 * PHASE 7.4 TASK 2: Get attempt details by attemptId
 * GET /api/v2/attempts/:attemptId
 */
async function getAttemptById(req, res) {
  try {
    const { attemptId } = req.params;
    const studentId = getStudentId(req);

    console.log('[Get Attempt By ID] Request:', { attemptId, studentId });

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId).populate('exam');
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    // Verify ownership
    if (attempt.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get questions
    const questionsData = await getStudentQuestions(
      attempt.exam._id.toString(),
      studentId
    );

    // Calculate remaining time
    const now = new Date();
    const elapsedMinutes = Math.floor((now - attempt.startedAt) / 60000);
    const remainingMinutes = Math.max(0, attempt.exam.duration - elapsedMinutes);

    // Check if time exceeded and auto-submit
    let status = attempt.status;
    if (remainingMinutes === 0 && status === 'started') {
      attempt.status = 'auto-submitted';
      attempt.submittedAt = now;
      await attempt.save();
      status = 'auto-submitted';
    }

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        attemptNo: attempt.attemptNo,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        status,
        duration: attempt.exam.duration,
        remainingMinutes,
        exam: {
          id: attempt.exam._id,
          title: attempt.exam.title,
          description: attempt.exam.description,
          totalMarks: attempt.exam.totalMarks,
          instructions: attempt.exam.settings?.instructions || ''
        },
        paper: questionsData,
        answers: attempt.answers || [],
        integrityLogs: attempt.integrityLogs || []
      }
    });

  } catch (error) {
    console.error('[Get Attempt By ID] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attempt',
      error: error.message
    });
  }
}

/**
 * PHASE 7.4 TASK 3: Save/update an answer
 * POST /api/v2/attempts/:attemptId/answer
 */
async function saveAnswer(req, res) {
  try {
    const { attemptId } = req.params;
    const { questionId, answer, questionIndex } = req.body;
    const studentId = getStudentId(req);

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    // Verify ownership
    if (attempt.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate attempt is active
    if (attempt.status !== 'started') {
      return res.status(400).json({
        success: false,
        message: `Cannot save answer. Attempt is ${attempt.status}`
      });
    }

    // Check timeout
    const now = new Date();
    const exam = await Exam.findById(attempt.exam);
    const elapsedMinutes = Math.floor((now - attempt.startedAt) / 60000);
    
    if (elapsedMinutes >= exam.duration) {
      // Auto-submit
      attempt.status = 'auto-submitted';
      attempt.submittedAt = now;
      await attempt.save();

      return res.status(400).json({
        success: false,
        message: 'Time limit exceeded. Exam auto-submitted.',
        autoSubmitted: true
      });
    }

    // Upsert answer
    const answerId = questionId || `q${questionIndex}`;
    const existingAnswerIndex = attempt.answers.findIndex(
      a => a.questionId === answerId
    );

    const answerData = {
      questionId: answerId,
      answer: answer || '',
      timestamp: now
    };

    if (existingAnswerIndex !== -1) {
      // Update existing
      attempt.answers[existingAnswerIndex] = answerData;
    } else {
      // Add new
      attempt.answers.push(answerData);
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Answer saved',
      data: {
        questionId: answerId,
        timestamp: now
      }
    });

  } catch (error) {
    console.error('[Save Answer] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save answer',
      error: error.message
    });
  }
}

/**
 * PHASE 7.4 TASK 5: Log integrity violation
 * POST /api/v2/attempts/:attemptId/log-violation
 */
async function logViolation(req, res) {
  try {
    const { attemptId } = req.params;
    const { type, details } = req.body;
    const studentId = getStudentId(req);

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    // Verify ownership
    if (attempt.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate type
    const validTypes = ['tab-switch', 'window-blur', 'fullscreen-exit', 'copy', 'paste', 'right-click'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid violation type'
      });
    }

    // Add log
    attempt.integrityLogs.push({
      type,
      timestamp: new Date(),
      details: details || ''
    });

    await attempt.save();

    // Count violations of this type
    const count = attempt.integrityLogs.filter(log => log.type === type).length;

    res.status(200).json({
      success: true,
      message: 'Violation logged',
      data: {
        type,
        count,
        totalViolations: attempt.integrityLogs.length
      }
    });

  } catch (error) {
    console.error('[Log Violation] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to log violation',
      error: error.message
    });
  }
}

/**
 * PHASE 7.4 TASK 6: Submit exam
 * POST /api/v2/attempts/:attemptId/submit
 */
async function submitExamAttempt(req, res) {
  try {
    const { attemptId } = req.params;
    const studentId = getStudentId(req);

    console.log('[Submit Exam Attempt] Request:', { attemptId, studentId });

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId).populate('exam');
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    // Verify ownership
    if (attempt.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if already submitted
    if (attempt.status !== 'started') {
      return res.status(400).json({
        success: false,
        message: `Attempt already ${attempt.status}`,
        submittedAt: attempt.submittedAt
      });
    }

    // Submit
    const now = new Date();
    attempt.status = 'submitted';
    attempt.submittedAt = now;
    await attempt.save();

    console.log('[Submit Exam Attempt] ✅ Submitted:', attemptId);

    res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        attemptId: attempt._id,
        submittedAt: now,
        status: 'submitted',
        answersCount: attempt.answers.length,
        violationsCount: attempt.integrityLogs.length
      }
    });

  } catch (error) {
    console.error('[Submit Exam Attempt] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to submit attempt',
      error: error.message
    });
  }
}

module.exports = {
  // PHASE 7.1 - New Attempt Lifecycle
  startExamAttempt,
  getActiveAttempt,
  getAttemptPaper,
  
  // PHASE 7.4 - Exam Attempt Engine
  getAttemptById,
  saveAnswer,
  logViolation,
  submitExamAttempt,
  
  // Legacy routes (kept for backward compatibility)
  startAttempt,
  recordViolation,
  recordHeartbeat,
  submitAnswerSheet
};
