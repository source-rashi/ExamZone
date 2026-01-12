/**
 * PHASE 6.1 — Exam Service (Refactored)
 * Simplified business logic for exam management
 */

const Exam = require('../models/Exam');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');

/**
 * Create a new exam (draft state)
 */
async function createExam(data, teacherId) {
  const { classId, title, description, mode, startTime, endTime, duration, attemptsAllowed, numberOfSets, totalMarks, questionSource, questionSourceType, questionContent } = data;

  // Verify class exists
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error('Class not found');
  }

  // Verify teacher owns this class
  if (classDoc.teacher.toString() !== teacherId) {
    throw new Error('Only the class teacher can create exams');
  }

  // Validate times if provided
  if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
    throw new Error('End time must be after start time');
  }

  // Prepare question source if provided
  let questionSourceData = null;
  if (questionSourceType && (questionContent || questionSourceType === 'pdf')) {
    questionSourceData = {
      type: questionSourceType,
      content: questionSourceType !== 'pdf' ? questionContent : '',
      filePath: questionSourceType === 'pdf' ? data.questionFilePath : ''
    };
  }

  // Create exam
  const exam = await Exam.create({
    classId,
    createdBy: teacherId,
    title: title.trim(),
    description: description?.trim() || '',
    mode: mode || 'online',
    startTime: startTime ? new Date(startTime) : null,
    endTime: endTime ? new Date(endTime) : null,
    duration: parseInt(duration) || 60,
    attemptsAllowed: parseInt(attemptsAllowed) || 1,
    numberOfSets: parseInt(numberOfSets) || 1,
    totalMarks: parseInt(totalMarks) || 100,
    questionSource: questionSourceData,
    generationStatus: 'none',
    lockedAfterGeneration: false,
    status: 'draft'
  });

  return exam;
}

/**
 * Update an exam (respects locking)
 */
async function updateExam(examId, data, teacherId) {
  const exam = await Exam.findById(examId);

  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify teacher owns the exam
  if (exam.createdBy.toString() !== teacherId) {
    throw new Error('Only the exam creator can update it');
  }

  // Can only update drafts or ready (not published/running/closed)
  if (['published', 'running', 'closed', 'evaluated'].includes(exam.status)) {
    throw new Error(`Cannot update exam with status: ${exam.status}`);
  }

  // PHASE 6.8 - Prevent editing after preparation
  if (exam.lockedAfterGeneration) {
    // Prevent changes to critical fields
    const lockedFields = ['numberOfSets', 'questionSource'];
    const attemptedChanges = lockedFields.filter(field => data[field] !== undefined);
    
    if (attemptedChanges.length > 0) {
      throw new Error(`Cannot modify ${attemptedChanges.join(', ')} after exam is prepared. Reset exam to draft to make changes.`);
    }
  }

  // PHASE 6.8 - Prevent editing after prepared status
  if (['prepared', 'generated'].includes(exam.status)) {
    const restrictedFields = ['numberOfSets', 'questionSource', 'totalMarks'];
    const attemptedChanges = restrictedFields.filter(field => data[field] !== undefined);
    
    if (attemptedChanges.length > 0) {
      throw new Error(`Cannot modify ${attemptedChanges.join(', ')} after exam is prepared. Use reset to return to draft.`);
    }
  }

  // Update allowed fields
  const allowedUpdates = {
    title: data.title,
    description: data.description,
    mode: data.mode,
    startTime: data.startTime ? new Date(data.startTime) : exam.startTime,
    endTime: data.endTime ? new Date(data.endTime) : exam.endTime,
    duration: data.duration !== undefined ? parseInt(data.duration) : exam.duration,
    attemptsAllowed: data.attemptsAllowed !== undefined ? parseInt(data.attemptsAllowed) : exam.attemptsAllowed,
    totalMarks: data.totalMarks !== undefined ? parseInt(data.totalMarks) : exam.totalMarks
  };

  // Allow numberOfSets and questionSource only if not locked
  if (!exam.lockedAfterGeneration) {
    if (data.numberOfSets !== undefined) {
      allowedUpdates.numberOfSets = parseInt(data.numberOfSets);
    }
    if (data.questionSource !== undefined) {
      allowedUpdates.questionSource = data.questionSource;
    }
  }

  // Validate times if provided
  if (allowedUpdates.startTime && allowedUpdates.endTime && 
      new Date(allowedUpdates.endTime) <= new Date(allowedUpdates.startTime)) {
    throw new Error('End time must be after start time');
  }

  Object.assign(exam, allowedUpdates);
  await exam.save();

  return exam;
}

/**
 * Publish an exam (make it visible to students)
 * PHASE 6.0-6.7 - Enforce lifecycle safety
 */
async function publishExam(examId, teacherId) {
  const exam = await Exam.findById(examId).populate('classId');

  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify teacher owns the exam
  if (exam.createdBy.toString() !== teacherId) {
    throw new Error('Only the exam creator can publish it');
  }

  // PHASE 6.7 - Can only publish from 'generated' status
  if (exam.status !== 'generated') {
    throw new Error(`Cannot publish exam with status: ${exam.status}. Exam must be in 'generated' status.`);
  }

  // PHASE 6.7 - Must have student papers generated
  if (!exam.studentPapers || exam.studentPapers.length === 0) {
    throw new Error('Cannot publish exam: Student papers must be generated first.');
  }

  // PHASE 6.3 - Must have question sets generated
  if (exam.generationStatus !== 'generated') {
    throw new Error('Please generate question papers before publishing the exam');
  }

  // Validate required fields
  if (!exam.startTime || !exam.endTime) {
    throw new Error('Start time and end time are required to publish');
  }

  exam.status = 'published';
  exam.publishedAt = new Date();
  await exam.save();

  return exam;
}

/**
 * Close an exam (prevent new attempts)
 */
async function closeExam(examId, teacherId) {
  const exam = await Exam.findById(examId);

  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify teacher owns the exam
  if (exam.createdBy.toString() !== teacherId) {
    throw new Error('Only the exam creator can close it');
  }

  // Can only close published or running exams
  if (!['published', 'running'].includes(exam.status)) {
    throw new Error(`Cannot close exam with status: ${exam.status}`);
  }

  exam.status = 'closed';
  exam.closedAt = new Date();
  await exam.save();

  return exam;
}

/**
 * Get all exams for a class (teacher view)
 */
async function getClassExams(classId, teacherId) {
  // Verify class exists and teacher owns it
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error('Class not found');
  }

  if (classDoc.teacher.toString() !== teacherId) {
    throw new Error('Only the class teacher can view all exams');
  }

  const exams = await Exam.find({ classId })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  return exams;
}

/**
 * Get exams for a student (only published/running exams)
 */
async function getStudentExams(classId, studentId) {
  // Verify student is enrolled in class
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error('Class not found');
  }

  const isEnrolled = classDoc.students.some(s => s.toString() === studentId);
  if (!isEnrolled) {
    throw new Error('You are not enrolled in this class');
  }

  // Only show published or running exams
  const exams = await Exam.find({
    classId,
    status: { $in: ['published', 'running', 'closed'] }
  })
    .populate('createdBy', 'name')
    .sort({ startTime: -1 });

  return exams;
}

/**
 * PHASE 6.2.5 — Generate Question Sets & Random Student Assignment
 * Creates empty sets and randomly assigns students to sets
 */
async function generateQuestionSets(examId, teacherId) {
  const exam = await Exam.findById(examId).populate('classId');

  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify teacher owns the exam
  if (exam.createdBy.toString() !== teacherId) {
    throw new Error('Only the exam creator can generate question sets');
  }

  // Can only generate for draft or ready exams
  if (exam.generationStatus === 'generated') {
    throw new Error('Question sets already generated. Reset exam to regenerate.');
  }

  // Get all enrolled students with roll numbers
  const enrollments = await Enrollment.find({ 
    classId: exam.classId._id,
    status: 'active'
  }).sort({ rollNumber: 1 });

  if (enrollments.length === 0) {
    throw new Error('No students enrolled in this class');
  }

  // Extract roll numbers
  const rollNumbers = enrollments.map(e => e.rollNumber);

  // Shuffle roll numbers randomly
  const shuffledRolls = [...rollNumbers];
  for (let i = shuffledRolls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledRolls[i], shuffledRolls[j]] = [shuffledRolls[j], shuffledRolls[i]];
  }

  // Distribute students into sets
  const numberOfSets = exam.numberOfSets || 1;
  const setMap = [];
  const studentsPerSet = Math.ceil(shuffledRolls.length / numberOfSets);

  for (let i = 0; i < numberOfSets; i++) {
    const setId = String.fromCharCode(65 + i); // A, B, C, etc.
    const startIdx = i * studentsPerSet;
    const endIdx = Math.min(startIdx + studentsPerSet, shuffledRolls.length);
    const assignedRollNumbers = shuffledRolls.slice(startIdx, endIdx);

    setMap.push({
      setId,
      assignedRollNumbers
    });
  }

  // Update exam
  exam.setMap = setMap;
  exam.generationStatus = 'generated';
  exam.lockedAfterGeneration = true;
  await exam.save();

  return {
    exam,
    setMap,
    totalStudents: rollNumbers.length
  };
}

/**
 * Reset exam generation (unlock and clear sets)
 */
async function resetExamGeneration(examId, teacherId) {
  const exam = await Exam.findById(examId);

  if (!exam) {
    throw new Error('Exam not found');
  }

  // Verify teacher owns the exam
  if (exam.createdBy.toString() !== teacherId) {
    throw new Error('Only the exam creator can reset the exam');
  }

  // Can only reset if not published
  if (exam.status === 'published' || exam.status === 'running') {
    throw new Error('Cannot reset a published or running exam');
  }

  // Clear generation data
  exam.setMap = [];
  exam.generationStatus = 'none';
  exam.lockedAfterGeneration = false;
  await exam.save();

  return exam;
}

/**
 * Get exam preparation data (for PDF generation)
 * Returns structured payload with all exam details and student mappings
 */
async function getExamPreparationData(examId) {
  const exam = await Exam.findById(examId)
    .populate('classId', 'name title code')
    .populate('createdBy', 'name email')
    .lean();

  if (!exam) {
    throw new Error('Exam not found');
  }

  // Get all enrollments with student details
  const enrollments = await Enrollment.find({
    classId: exam.classId._id,
    status: 'active'
  })
    .populate('studentId', 'name email')
    .sort({ rollNumber: 1 })
    .lean();

  // Build roll-to-student map
  const studentMap = {};
  enrollments.forEach(enrollment => {
    studentMap[enrollment.rollNumber] = {
      rollNumber: enrollment.rollNumber,
      studentId: enrollment.studentId._id,
      name: enrollment.studentId.name,
      email: enrollment.studentId.email
    };
  });

  // Build set-to-students map
  const setDetails = exam.setMap?.map(set => ({
    setId: set.setId,
    students: set.assignedRollNumbers.map(rollNum => studentMap[rollNum]).filter(Boolean)
  })) || [];

  return {
    exam: {
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      totalMarks: exam.totalMarks,
      duration: exam.duration,
      mode: exam.mode,
      startTime: exam.startTime,
      endTime: exam.endTime,
      status: exam.status,
      generationStatus: exam.generationStatus,
      numberOfSets: exam.numberOfSets
    },
    class: {
      _id: exam.classId._id,
      name: exam.classId.name || exam.classId.title,
      code: exam.classId.code
    },
    teacher: {
      _id: exam.createdBy._id,
      name: exam.createdBy.name,
      email: exam.createdBy.email
    },
    questionSource: exam.questionSource || null,
    setMap: exam.setMap || [],
    setDetails,
    totalStudents: enrollments.length
  };
}

/**
 * Get exam by ID with generated sets
 * PHASE 6.3 - For teacher review panel
 */
async function getExamById(examId, userId) {
  const exam = await Exam.findById(examId)
    .populate('classId', 'name subject')
    .populate('createdBy', 'name email');

  if (!exam) {
    throw new Error('Exam not found');
  }

  // Return exam with generated sets
  return exam;
}

module.exports = {
  createExam,
  updateExam,
  publishExam,
  closeExam,
  getClassExams,
  getStudentExams,
  generateQuestionSets,
  resetExamGeneration,
  getExamPreparationData,
  getExamById
};
