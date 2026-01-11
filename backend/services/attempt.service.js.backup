const Attempt = require('../models/Attempt');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { EXAM_STATUS, ATTEMPT_STATUS, ATTEMPT_STATE_TRANSITIONS } = require('../utils/constants');

/**
 * Attempt Service
 * Business logic for exam attempt management
 */

/**
 * Validate attempt state transition
 * @param {String} currentStatus - Current attempt status
 * @param {String} newStatus - Desired new status
 * @throws {Error} If transition is invalid
 */
function validateAttemptTransition(currentStatus, newStatus) {
  const allowedTransitions = ATTEMPT_STATE_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid attempt transition: Cannot move from ${currentStatus} to ${newStatus}. ` +
      `Allowed transitions: ${allowedTransitions ? allowedTransitions.join(', ') : 'none'}`
    );
  }
}

/**
 * Check if student has reached attempt limit
 * @param {ObjectId} studentId - Student ID
 * @param {ObjectId} examId - Exam ID
 * @returns {Promise<Object>} Attempt status info
 */
async function checkAttemptLimit(studentId, examId) {
  // Get exam to check maxAttempts
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Count previous attempts
  const attemptCount = await Attempt.countDocuments({ 
    studentId, 
    examId 
  });

  const canAttempt = attemptCount < exam.maxAttempts;
  const remainingAttempts = exam.maxAttempts - attemptCount;

  return {
    canAttempt,
    attemptCount,
    maxAttempts: exam.maxAttempts,
    remainingAttempts: Math.max(0, remainingAttempts)
  };
}

/**
 * Validate if student can attempt exam (Phase 3.4)
 * @param {ObjectId} studentId - Student ID
 * @param {ObjectId} examId - Exam ID
 * @returns {Promise<Object>} Validation result
 */
async function validateAttempt(studentId, examId) {
  // Validate student exists
  const student = await User.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  if (student.role !== 'student') {
    throw new Error('Only students can attempt exams');
  }

  // Validate exam exists
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Phase 3.4: Check exam is LIVE
  if (exam.status !== EXAM_STATUS.LIVE) {
    throw new Error(`Exam is not live. Current status: ${exam.status}`);
  }

  // Check if exam time window is valid
  const now = new Date();
  if (exam.startTime && new Date(exam.startTime) > now) {
    throw new Error('Exam has not started yet');
  }
  if (exam.endTime && new Date(exam.endTime) < now) {
    throw new Error('Exam has ended');
  }

  // Check if student is enrolled in the class
  const enrollment = await Enrollment.findOne({ 
    classId: exam.classId, 
    studentId,
    status: 'active'
  });
  
  if (!enrollment) {
    throw new Error('You must be enrolled in the class to attempt this exam');
  }

  // Check attempt limit
  const attemptStatus = await checkAttemptLimit(studentId, examId);
  if (!attemptStatus.canAttempt) {
    throw new Error(`Maximum attempts (${exam.maxAttempts}) reached for this exam`);
  }

  // Check if student has an ongoing attempt
  const ongoingAttempt = await Attempt.findOne({ 
    studentId, 
    examId, 
    status: ATTEMPT_STATUS.IN_PROGRESS
  });
  
  if (ongoingAttempt) {
    throw new Error('You already have an ongoing attempt for this exam');
  }

  return {
    canAttempt: true,
    exam,
    student,
    attemptNumber: attemptStatus.attemptCount + 1,
    remainingAttempts: attemptStatus.remainingAttempts
  };
}

/**
 * Start a new exam attempt (Phase 3.4 updated)
 * @param {Object} data - Attempt data {studentId, examId, questionPaperId}
 * @returns {Promise<Object>} Created attempt
 */
async function startAttempt(data) {
  const { studentId, examId, questionPaperId } = data;

  if (!studentId || !examId) {
    throw new Error('studentId and examId are required');
  }

  // Validate attempt
  const validation = await validateAttempt(studentId, examId);

  // Create new attempt with IN_PROGRESS status
  const attempt = await Attempt.create({
    examId,
    studentId,
    questionPaperId: questionPaperId || null,
    attemptNumber: validation.attemptNumber,
    startedAt: new Date(),
    startTime: new Date(), // Legacy field
    status: ATTEMPT_STATUS.IN_PROGRESS,
    tabSwitchCount: 0,
    focusLossCount: 0
  });

  return attempt;
}

/**
 * Submit an exam attempt (Phase 3.4)
 * @param {ObjectId} attemptId - Attempt ID
 * @returns {Promise<Object>} Updated attempt
 */
async function submitAttempt(attemptId) {
  const attempt = await Attempt.findById(attemptId);
  
  if (!attempt) {
    throw new Error('Attempt not found');
  }

  // Validate state transition
  validateAttemptTransition(attempt.status, ATTEMPT_STATUS.SUBMITTED);

  // Check if exam is still open
  const exam = await Exam.findById(attempt.examId);
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Allow submission even if exam is closed (for overdue attempts)
  if (exam.status !== EXAM_STATUS.LIVE && exam.status !== EXAM_STATUS.CLOSED) {
    throw new Error(`Cannot submit attempt. Exam status: ${exam.status}`);
  }

  // Update attempt status
  attempt.status = ATTEMPT_STATUS.SUBMITTED;
  attempt.submittedAt = new Date();
  attempt.endTime = new Date(); // Legacy field
  await attempt.save();

  return attempt;
}

/**
 * Mark overdue attempts as submitted automatically
 * Should be called by a background job when exam closes
 * @param {ObjectId} examId - Exam ID
 * @returns {Promise<Number>} Number of attempts auto-submitted
 */
async function autoSubmitOverdueAttempts(examId) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  if (exam.status !== EXAM_STATUS.CLOSED) {
    throw new Error('Can only auto-submit attempts for closed exams');
  }

  // Find all in-progress attempts for this exam
  const overdueAttempts = await Attempt.find({
    examId,
    status: ATTEMPT_STATUS.IN_PROGRESS
  });

  // Mark them as submitted
  const now = new Date();
  const updatePromises = overdueAttempts.map(attempt => {
    attempt.status = ATTEMPT_STATUS.SUBMITTED;
    attempt.submittedAt = now;
    attempt.endTime = now;
    return attempt.save();
  });

  await Promise.all(updatePromises);

  return overdueAttempts.length;
}

/**
 * Get attempt by ID
 * @param {ObjectId} attemptId - Attempt ID
 * @returns {Promise<Object>} Attempt document
 */
async function getAttemptById(attemptId) {
  const attempt = await Attempt.findById(attemptId)
    .populate('examId', 'title duration totalMarks')
    .populate('studentId', 'name email');
  
  if (!attempt) {
    throw new Error('Attempt not found');
  }

  return attempt;
}

/**
 * Get all attempts for an exam
 * @param {ObjectId} examId - Exam ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of attempts
 */
async function getExamAttempts(examId, options = {}) {
  const { status, page = 1, limit = 50 } = options;

  const query = { examId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const attempts = await Attempt.find(query)
    .populate('studentId', 'name email')
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Attempt.countDocuments(query);

  return {
    attempts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get all attempts by a student
 * @param {ObjectId} studentId - Student ID
 * @param {ObjectId} examId - Exam ID (optional)
 * @returns {Promise<Array>} Array of attempts
 */
async function getStudentAttempts(studentId, examId = null) {
  const query = { studentId };
  if (examId) {
    query.examId = examId;
  }

  const attempts = await Attempt.find(query)
    .populate('examId', 'title totalMarks classId')
    .sort({ startTime: -1 })
    .lean();

  return attempts;
}

/**
 * Record tab switch violation
 * @param {ObjectId} attemptId - Attempt ID
 * @returns {Promise<Object>} Updated attempt
 */
async function recordTabSwitch(attemptId) {
  const attempt = await Attempt.findById(attemptId);
  
  if (!attempt) {
    throw new Error('Attempt not found');
  }

  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    throw new Error('Cannot record violation for non-active attempt');
  }

  attempt.tabSwitchCount += 1;
  await attempt.save();

  return attempt;
}

/**
 * Record focus loss violation
 * @param {ObjectId} attemptId - Attempt ID
 * @returns {Promise<Object>} Updated attempt
 */
async function recordFocusLoss(attemptId) {
  const attempt = await Attempt.findById(attemptId);
  
  if (!attempt) {
    throw new Error('Attempt not found');
  }

  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    throw new Error('Cannot record violation for non-active attempt');
  }

  attempt.focusLossCount += 1;
  await attempt.save();

  return attempt;
}

/**
 * Get attempt statistics for a student in an exam
 * @param {ObjectId} studentId - Student ID
 * @param {ObjectId} examId - Exam ID
 * @returns {Promise<Object>} Statistics
 */
async function getAttemptStatistics(studentId, examId) {
  const attempts = await Attempt.find({ studentId, examId }).lean();

  const stats = {
    totalAttempts: attempts.length,
    submitted: attempts.filter(a => a.status === ATTEMPT_STATUS.SUBMITTED).length,
    evaluated: attempts.filter(a => a.status === ATTEMPT_STATUS.EVALUATED).length,
    ongoing: attempts.filter(a => a.status === ATTEMPT_STATUS.IN_PROGRESS).length,
    averageTabSwitches: 0,
    averageFocusLoss: 0
  };

  if (attempts.length > 0) {
    stats.averageTabSwitches = attempts.reduce((sum, a) => sum + a.tabSwitchCount, 0) / attempts.length;
    stats.averageFocusLoss = attempts.reduce((sum, a) => sum + a.focusLossCount, 0) / attempts.length;
  }

  return stats;
}

/**
 * Record an integrity event (Phase 3.5)
 * @param {String} attemptId - Attempt ID
 * @param {String} eventType - Event type (tab_switch, focus_lost, fullscreen_exit, copy, paste, suspicious_activity)
 * @returns {Promise<Object>} Updated attempt
 * @throws {Error} If validation fails
 */
async function recordIntegrityEvent(attemptId, eventType) {
  const integrityService = require('./integrity.service');
  
  // Validate event type
  const validTypes = ['tab_switch', 'focus_lost', 'fullscreen_exit', 'copy', 'paste', 'suspicious_activity'];
  if (!validTypes.includes(eventType)) {
    throw new Error(`Invalid event type: ${eventType}. Valid types: ${validTypes.join(', ')}`);
  }
  
  // Use integrity service to log violation
  const attempt = await integrityService.logViolation(attemptId, eventType);
  
  return attempt;
}

/**
 * Record heartbeat for attempt (Phase 3.5)
 * @param {String} attemptId - Attempt ID
 * @returns {Promise<Object>} Updated attempt
 * @throws {Error} If validation fails
 */
async function recordHeartbeat(attemptId) {
  const integrityService = require('./integrity.service');
  
  // Use integrity service to record heartbeat
  const attempt = await integrityService.heartbeat(attemptId);
  
  return attempt;
}

/**
 * Submit answer sheet for attempt (Phase 3.6)
 * @param {String} attemptId - Attempt ID
 * @param {String} filePath - Path to answer sheet PDF
 * @returns {Promise<Object>} Updated attempt
 * @throws {Error} If validation fails
 */
async function submitAnswerSheet(attemptId, filePath) {
  const attempt = await Attempt.findById(attemptId);
  
  if (!attempt) {
    throw new Error('Attempt not found');
  }
  
  // Only IN_PROGRESS or SUBMITTED attempts can upload answer sheets
  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS && attempt.status !== ATTEMPT_STATUS.SUBMITTED) {
    throw new Error(`Cannot submit answer sheet: attempt is ${attempt.status}`);
  }
  
  // Validate file exists
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Answer sheet file not found: ${filePath}`);
  }
  
  // Update attempt
  attempt.answerSheetPath = filePath;
  await attempt.save();
  
  console.log(`✅ Answer sheet submitted for attempt ${attemptId}`);
  
  return attempt;
}

/**
 * Evaluate attempt using AI (Phase 3.6)
 * @param {String} attemptId - Attempt ID
 * @returns {Promise<Object>} Updated attempt with evaluation results
 * @throws {Error} If validation fails
 */
async function evaluateAttempt(attemptId) {
  const attempt = await Attempt.findById(attemptId);
  
  if (!attempt) {
    throw new Error('Attempt not found');
  }
  
  // Only SUBMITTED attempts can be evaluated
  if (attempt.status !== ATTEMPT_STATUS.SUBMITTED) {
    throw new Error(`Cannot evaluate: attempt is ${attempt.status}. Only SUBMITTED attempts can be evaluated`);
  }
  
  // Answer sheet must be uploaded
  if (!attempt.answerSheetPath) {
    throw new Error('Answer sheet not uploaded');
  }
  
  // Call AI service
  const aiService = require('./ai.service');
  const result = await aiService.evaluateAttempt(attemptId.toString(), attempt.answerSheetPath);
  
  // Update attempt with results
  attempt.aiResult = {
    score: result.score,
    feedback: result.feedback,
    evaluatedAt: result.evaluatedAt
  };
  
  // Also update the main score field
  attempt.score = result.score;
  
  // Update status to EVALUATED
  validateAttemptTransition(attempt.status, ATTEMPT_STATUS.EVALUATED);
  attempt.status = ATTEMPT_STATUS.EVALUATED;
  attempt.evaluatedAt = result.evaluatedAt;
  
  await attempt.save();
  
  console.log(`✅ Attempt ${attemptId} evaluated: score=${result.score}`);
  
  return attempt;
}

module.exports = {
  checkAttemptLimit,
  validateAttempt,
  startAttempt,
  submitAttempt,
  autoSubmitOverdueAttempts,
  getAttemptById,
  getExamAttempts,
  getStudentAttempts,
  recordTabSwitch,
  recordFocusLoss,
  getAttemptStatistics,
  recordIntegrityEvent,
  recordHeartbeat,
  submitAnswerSheet,
  evaluateAttempt
};
