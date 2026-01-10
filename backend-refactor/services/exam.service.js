const Exam = require('../models/Exam');
const Class = require('../models/Class');
const User = require('../models/User');

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
 * Publish an exam (change status from draft to published)
 * @param {ObjectId} examId - Exam ID
 * @param {ObjectId} teacherId - Teacher ID (for authorization)
 * @returns {Promise<Object>} Updated exam
 */
async function publishExam(examId, teacherId) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify teacher owns this exam
  if (exam.createdBy.toString() !== teacherId.toString()) {
    throw new Error('Unauthorized: You did not create this exam');
  }

  // Check if exam is already published
  if (exam.status === 'published' || exam.status === 'ongoing' || exam.status === 'closed') {
    throw new Error(`Cannot publish exam with status: ${exam.status}`);
  }

  // Validate exam has required fields
  if (!exam.title || !exam.startTime || !exam.endTime) {
    throw new Error('Exam must have title, start time, and end time before publishing');
  }

  // Validate time range
  if (new Date(exam.startTime) >= new Date(exam.endTime)) {
    throw new Error('End time must be after start time');
  }

  // Change status to published
  exam.status = 'published';
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

/**
 * Close an exam (change status to closed)
 * @param {ObjectId} examId - Exam ID
 * @param {ObjectId} teacherId - Teacher ID (for authorization)
 * @returns {Promise<Object>} Updated exam
 */
async function closeExam(examId, teacherId) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify teacher owns this exam
  if (exam.createdBy.toString() !== teacherId.toString()) {
    throw new Error('Unauthorized: You did not create this exam');
  }

  if (exam.status === 'closed') {
    throw new Error('Exam is already closed');
  }

  if (exam.status === 'draft') {
    throw new Error('Cannot close an unpublished exam');
  }

  exam.status = 'closed';
  await exam.save();

  return exam;
}

module.exports = {
  createExam,
  publishExam,
  getExamById,
  getClassExams,
  getTeacherExams,
  updateExam,
  deleteExam,
  closeExam
};
