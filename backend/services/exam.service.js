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
  const { classId, title, description, mode, startTime, endTime, duration, attemptsAllowed, setsPerStudent, totalMarks } = data;

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
    setsPerStudent: parseInt(setsPerStudent) || 1,
    totalMarks: parseInt(totalMarks) || 100,
    status: 'draft'
  });

  return exam;
}

/**
 * Publish an exam (make it visible to students)
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

  // Can only publish drafts
  if (exam.status !== 'draft') {
    throw new Error(`Cannot publish exam with status: ${exam.status}`);
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
  exam.generationStatus = 'ready';
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
  exam.generationStatus = 'draft';
  exam.lockedAfterGeneration = false;
  await exam.save();

  return exam;
}

module.exports = {
  createExam,
  publishExam,
  closeExam,
  getClassExams,
  getStudentExams,
  generateQuestionSets,
  resetExamGeneration
};
