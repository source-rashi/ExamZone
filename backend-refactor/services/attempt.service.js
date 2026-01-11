/**
 * PHASE 6.1 — Attempt Service
 * Business logic for exam attempts
 */

const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const Class = require('../models/Class');

/**
 * Check if student is eligible to start an attempt
 */
async function checkAttemptEligibility(examId, studentId) {
  const exam = await Exam.findById(examId).populate('classId');

  if (!exam) {
    throw new Error('Exam not found');
  }

  // Check if student is enrolled in class
  const isEnrolled = exam.classId.students.some(s => s.toString() === studentId);
  if (!isEnrolled) {
    throw new Error('You are not enrolled in this class');
  }

  // Check exam status
  if (!['published', 'running'].includes(exam.status)) {
    throw new Error(`Exam is ${exam.status}. Cannot start attempt.`);
  }

  // Check time window
  const now = new Date();
  if (exam.startTime && now < exam.startTime) {
    throw new Error('Exam has not started yet');
  }
  if (exam.endTime && now > exam.endTime) {
    throw new Error('Exam has ended');
  }

  // Count existing attempts
  const attemptCount = await ExamAttempt.countDocuments({
    exam: examId,
    student: studentId
  });

  if (attemptCount >= exam.attemptsAllowed) {
    throw new Error(`Maximum attempts (${exam.attemptsAllowed}) reached`);
  }

  // Check for active attempt
  const activeAttempt = await ExamAttempt.findOne({
    exam: examId,
    student: studentId,
    status: 'started'
  });

  if (activeAttempt) {
    throw new Error('You already have an active attempt');
  }

  return {
    eligible: true,
    attemptNo: attemptCount + 1,
    attemptsRemaining: exam.attemptsAllowed - attemptCount
  };
}

/**
 * Start a new exam attempt
 */
async function startAttempt(examId, studentId) {
  // Check eligibility
  const eligibility = await checkAttemptEligibility(examId, studentId);

  // Update exam status to running if it's published
  const exam = await Exam.findById(examId);
  if (exam.status === 'published') {
    exam.status = 'running';
    await exam.save();
  }

  // Create attempt
  const attempt = await ExamAttempt.create({
    exam: examId,
    student: studentId,
    attemptNo: eligibility.attemptNo,
    status: 'started',
    startedAt: new Date(),
    integrityLogs: [],
    answers: []
  });

  return attempt;
}

/**
 * Submit an exam attempt
 */
async function submitAttempt(attemptId, studentId, data = {}) {
  const attempt = await ExamAttempt.findById(attemptId);

  if (!attempt) {
    throw new Error('Attempt not found');
  }

  // Verify ownership
  if (attempt.student.toString() !== studentId) {
    throw new Error('This attempt does not belong to you');
  }

  // Can only submit started attempts
  if (attempt.status !== 'started') {
    throw new Error(`Attempt is already ${attempt.status}`);
  }

  // Update attempt
  attempt.status = 'submitted';
  attempt.submittedAt = new Date();
  
  if (data.answers) {
    attempt.answers = data.answers;
  }
  
  if (data.uploadedFile) {
    attempt.uploadedFile = data.uploadedFile;
  }

  await attempt.save();

  return attempt;
}

/**
 * Auto-submit an attempt (for timeout scenarios)
 */
async function autoSubmitAttempt(attemptId) {
  const attempt = await ExamAttempt.findById(attemptId);

  if (!attempt) {
    throw new Error('Attempt not found');
  }

  if (attempt.status !== 'started') {
    return attempt; // Already submitted
  }

  attempt.status = 'auto-submitted';
  attempt.submittedAt = new Date();
  await attempt.save();

  return attempt;
}

/**
 * Get student's attempts for an exam
 */
async function getStudentAttempts(examId, studentId) {
  const attempts = await ExamAttempt.find({
    exam: examId,
    student: studentId
  }).sort({ attemptNo: 1 });

  return attempts;
}

module.exports = {
  checkAttemptEligibility,
  startAttempt,
  submitAttempt,
  autoSubmitAttempt,
  getStudentAttempts
};
