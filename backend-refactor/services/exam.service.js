const Exam = require('../models/Exam');
const Class = require('../models/Class');
const User = require('../models/User');
const { EXAM_STATUS, EXAM_STATE_TRANSITIONS } = require('../utils/constants');

/**
 * Exam Service
 * Business logic for exam management
 */

/**
 * Create a new exam
 * @param {Object} data - Exam data {classId, title, createdBy, ...}
 * @returns {Promise<Object>} Created exam
 */
async function createExam(data) {
  const { classId, title, createdBy, ...examData } = data;

  if (!classId || !title || !createdBy) {
    throw new Error('classId, title, and createdBy are required');
  }

  // Validate teacher exists
  const teacher = await User.findById(createdBy);
  if (!teacher) {
    throw new Error('Teacher not found');
  }

  if (teacher.role !== 'teacher') {
    throw new Error('Only teachers can create exams');
  }

  // Validate class exists and teacher owns it
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error('Class not found');
  }

  if (classDoc.teacherId?.toString() !== createdBy.toString() && 
      classDoc.teacher?.toString() !== createdBy.toString()) {
    throw new Error('Unauthorized: You do not own this class');
  }

  // Create exam with default status "draft"
  const exam = await Exam.create({
    classId,
    createdBy,
    title,
    description: examData.description || '',
    duration: examData.duration || 60,
    totalMarks: examData.totalMarks || 100,
    maxAttempts: examData.maxAttempts || 1,
    evaluationMode: examData.evaluationMode || 'manual',
    startTime: examData.startTime,
    endTime: examData.endTime,
    status: 'draft',
    settings: {
      tabSwitchLimit: examData.tabSwitchLimit || 3,
      allowPdfUpload: examData.allowPdfUpload !== false,
      allowEditor: examData.allowEditor || false
    }
  });

  return exam;
}

/**
 * Validate state transition
 * @param {String} currentStatus - Current exam status
 * @param {String} newStatus - Desired new status
 * @throws {Error} If transition is invalid
 */
function validateStateTransition(currentStatus, newStatus) {
  const allowedTransitions = EXAM_STATE_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid state transition: Cannot move from ${currentStatus} to ${newStatus}. ` +
      `Allowed transitions: ${allowedTransitions ? allowedTransitions.join(', ') : 'none'}`
    );
  }
}

/**
 * Publish an exam (DRAFT → PUBLISHED)
 * @param {ObjectId} examId - Exam ID
 * @param {ObjectId} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated exam
 */
async function publishExam(examId, userId) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify user owns this exam
  if (exam.createdBy.toString() !== userId.toString()) {
    throw new Error('Unauthorized: Only the exam creator can publish this exam');
  }

  // Validate state transition
  validateStateTransition(exam.status, EXAM_STATUS.PUBLISHED);

  // Validate exam has required fields
  if (!exam.title) {
    throw new Error('Exam must have a title before publishing');
  }
  
  if (!exam.startTime || !exam.endTime) {
    throw new Error('Exam must have start time and end time before publishing');
  }

  // Validate time range
  const startTime = new Date(exam.startTime);
  const endTime = new Date(exam.endTime);
  
  if (startTime >= endTime) {
    throw new Error('End time must be after start time');
  }

  // Set durationMinutes if not set
  if (!exam.durationMinutes && exam.duration) {
    exam.durationMinutes = exam.duration;
  }

  // Change status to published
  exam.status = EXAM_STATUS.PUBLISHED;
  exam.publishedAt = new Date();
  await exam.save();

  return exam;
}

/**
 * Start an exam (PUBLISHED → LIVE)
 * Typically triggered automatically when startTime is reached
 * @param {ObjectId} examId - Exam ID
 * @returns {Promise<Object>} Updated exam
 */
async function startExam(examId) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Validate state transition
  validateStateTransition(exam.status, EXAM_STATUS.LIVE);

  const now = new Date();
  const startTime = new Date(exam.startTime);
  
  // Check if exam can be started
  if (startTime > now) {
    throw new Error(`Exam cannot be started yet. Start time is ${exam.startTime}`);
  }

  // Change status to live
  exam.status = EXAM_STATUS.LIVE;
  await exam.save();

  return exam;
}

/**
 * Close an exam (LIVE → CLOSED)
 * Can be manually triggered or automatically when endTime is reached
 * @param {ObjectId} examId - Exam ID
 * @param {ObjectId} userId - User ID (for authorization, optional for auto-close)
 * @returns {Promise<Object>} Updated exam
 */
async function closeExam(examId, userId = null) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  // If userId provided, verify authorization
  if (userId && exam.createdBy.toString() !== userId.toString()) {
    throw new Error('Unauthorized: Only the exam creator can close this exam');
  }

  // Validate state transition
  validateStateTransition(exam.status, EXAM_STATUS.CLOSED);

  // Change status to closed
  exam.status = EXAM_STATUS.CLOSED;
  exam.closedAt = new Date();
  await exam.save();

  return exam;
}

/**
 * Start evaluation process (CLOSED → EVALUATING)
 * @param {ObjectId} examId - Exam ID
 * @param {ObjectId} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated exam
 */
async function startEvaluation(examId, userId) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify user owns this exam
  if (exam.createdBy.toString() !== userId.toString()) {
    throw new Error('Unauthorized: Only the exam creator can start evaluation');
  }

  // Validate state transition
  validateStateTransition(exam.status, EXAM_STATUS.EVALUATING);

  // Change status to evaluating
  exam.status = EXAM_STATUS.EVALUATING;
  await exam.save();

  return exam;
}

/**
 * Publish results (EVALUATING → RESULT_PUBLISHED)
 * @param {ObjectId} examId - Exam ID
 * @param {ObjectId} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated exam
 */
async function publishResults(examId, userId) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify user owns this exam
  if (exam.createdBy.toString() !== userId.toString()) {
    throw new Error('Unauthorized: Only the exam creator can publish results');
  }

  // Validate state transition
  validateStateTransition(exam.status, EXAM_STATUS.RESULT_PUBLISHED);

  // Change status to result_published
  exam.status = EXAM_STATUS.RESULT_PUBLISHED;
  await exam.save();

  return exam;
}

/**
 * Get exam by ID
 * @param {ObjectId} examId - Exam ID
 * @returns {Promise<Object>} Exam document
 */
async function getExamById(examId) {
  const exam = await Exam.findById(examId)
    .populate('classId', 'code title subject')
    .populate('createdBy', 'name email');
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  return exam;
}

/**
 * Get all exams for a class
 * @param {ObjectId} classId - Class ID
 * @param {Object} options - Query options (status, pagination)
 * @returns {Promise<Array>} Array of exams
 */
async function getClassExams(classId, options = {}) {
  const { status, page = 1, limit = 20 } = options;

  const query = { classId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const exams = await Exam.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Exam.countDocuments(query);

  return {
    exams,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get all exams created by a teacher
 * @param {ObjectId} teacherId - Teacher ID
 * @returns {Promise<Array>} Array of exams
 */
async function getTeacherExams(teacherId) {
  const exams = await Exam.find({ createdBy: teacherId })
    .populate('classId', 'code title')
    .sort({ createdAt: -1 })
    .lean();

  return exams;
}

/**
 * Update exam details
 * @param {ObjectId} examId - Exam ID
 * @param {ObjectId} teacherId - Teacher ID (for authorization)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated exam
 */
async function updateExam(examId, teacherId, updates) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify teacher owns this exam
  if (exam.createdBy.toString() !== teacherId.toString()) {
    throw new Error('Unauthorized: You did not create this exam');
  }

  // Cannot update published/ongoing/closed exams
  if (exam.status !== 'draft') {
    throw new Error(`Cannot update exam with status: ${exam.status}`);
  }

  // Apply updates (whitelist allowed fields)
  const allowedUpdates = [
    'title', 'description', 'duration', 'totalMarks', 
    'maxAttempts', 'evaluationMode', 'startTime', 'endTime', 'settings'
  ];
  
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      exam[key] = updates[key];
    }
  });

  await exam.save();
  return exam;
}

/**
 * Delete exam (only if draft)
 * @param {ObjectId} examId - Exam ID
 * @param {ObjectId} teacherId - Teacher ID (for authorization)
 * @returns {Promise<Boolean>} Success status
 */
async function deleteExam(examId, teacherId) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify teacher owns this exam
  if (exam.createdBy.toString() !== teacherId.toString()) {
    throw new Error('Unauthorized: You did not create this exam');
  }

  // Can only delete draft exams
  if (exam.status !== 'draft') {
    throw new Error('Can only delete draft exams');
  }

  await Exam.findByIdAndDelete(examId);
  return true;
}

module.exports = {
  createExam,
  publishExam,
  startExam,
  closeExam,
  startEvaluation,
  publishResults,
  getExamById,
  getClassExams,
  getTeacherExams,
  updateExam,
  deleteExam
};
