/**
 * PHASE 6.4 — TASK 1
 * Centralized Model Loading
 * 
 * Ensures all mongoose models are registered before use
 * Prevents MissingSchemaError issues in tests and scripts
 */

// Load all models in correct order (dependencies first)
const User = require('./User');
const Class = require('./Class');
const Enrollment = require('./Enrollment');
const Exam = require('./Exam');
const Assignment = require('./Assignment');
const Attempt = require('./Attempt');
const ExamAttempt = require('./ExamAttempt');
const ExamPaper = require('./ExamPaper');
const QuestionPaper = require('./QuestionPaper');
const AnswerSheet = require('./AnswerSheet');
const Result = require('./Result');
const Evaluation = require('./Evaluation');
const Invite = require('./Invite');
const Announcement = require('./Announcement');
const ViolationLog = require('./ViolationLog');

// Export all models
module.exports = {
  User,
  Class,
  Enrollment,
  Exam,
  Assignment,
  Attempt,
  ExamAttempt,
  ExamPaper,
  QuestionPaper,
  AnswerSheet,
  Result,
  Evaluation,
  Invite,
  Announcement,
  ViolationLog
};
