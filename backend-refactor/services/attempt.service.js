const Attempt = require('../models/Attempt');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

/**
 * Attempt Service
 * Business logic for exam attempt management
 */

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
 * Start a new exam attempt
 * @param {ObjectId} studentId - Student ID
 * @param {ObjectId} examId - Exam ID
 * @returns {Promise<Object>} Created attempt
 */
async function startAttempt(studentId, examId) {
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

  // Check exam status
  if (exam.status !== 'published' && exam.status !== 'ongoing') {
    throw new Error(`Exam is not available. Status: ${exam.status}`);
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
    status: 'started' 
  });
  
  if (ongoingAttempt) {
    throw new Error('You already have an ongoing attempt for this exam');
  }

  // Calculate attempt number
  const attemptNumber = attemptStatus.attemptCount + 1;

  // Create new attempt
  const attempt = await Attempt.create({
    examId,
    studentId,
    attemptNumber,
    startTime: new Date(),
    status: 'started',
    tabSwitchCount: 0,
    focusLossCount: 0
  });

  // Update exam status to ongoing if this is the first attempt
  if (exam.status === 'published') {
    exam.status = 'ongoing';
    await exam.save();
  }

  return attempt;
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
 * Submit an attempt
 * @param {ObjectId} attemptId - Attempt ID
 * @param {ObjectId} studentId - Student ID (for authorization)
 * @returns {Promise<Object>} Updated attempt
 */
async function submitAttempt(attemptId, studentId) {
  const attempt = await Attempt.findById(attemptId);
  
  if (!attempt) {
    throw new Error('Attempt not found');
  }

  // Verify student owns this attempt
  if (attempt.studentId.toString() !== studentId.toString()) {
    throw new Error('Unauthorized: This is not your attempt');
  }

  // Check if already submitted
  if (attempt.status !== 'started') {
    throw new Error(`Cannot submit attempt with status: ${attempt.status}`);
  }

  // Update attempt
  attempt.status = 'submitted';
  attempt.endTime = new Date();
  await attempt.save();

  return attempt;
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

  if (attempt.status !== 'started') {
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

  if (attempt.status !== 'started') {
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
    submitted: attempts.filter(a => a.status === 'submitted').length,
    evaluated: attempts.filter(a => a.status === 'evaluated').length,
    ongoing: attempts.filter(a => a.status === 'started').length,
    averageTabSwitches: 0,
    averageFocusLoss: 0
  };

  if (attempts.length > 0) {
    stats.averageTabSwitches = attempts.reduce((sum, a) => sum + a.tabSwitchCount, 0) / attempts.length;
    stats.averageFocusLoss = attempts.reduce((sum, a) => sum + a.focusLossCount, 0) / attempts.length;
  }

  return stats;
}

module.exports = {
  checkAttemptLimit,
  startAttempt,
  getAttemptById,
  getExamAttempts,
  getStudentAttempts,
  submitAttempt,
  recordTabSwitch,
  recordFocusLoss,
  getAttemptStatistics
};
