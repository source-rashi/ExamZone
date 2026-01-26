/**
 * PHASE 8.1 — Attempt Validation Rules
 */

const { body, param } = require('express-validator');
const mongoose = require('mongoose');

const startAttemptValidation = [
  body('examId')
    .notEmpty().withMessage('Exam ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid exam ID format');
      }
      return true;
    })
];

const saveAnswerValidation = [
  param('attemptId')
    .notEmpty().withMessage('Attempt ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid attempt ID format');
      }
      return true;
    }),
  
  body('questionId')
    .notEmpty().withMessage('Question ID is required')
    .trim(),
  
  body('answer')
    .optional()
    .trim()
    .isLength({ max: 10000 }).withMessage('Answer cannot exceed 10000 characters'),
  
  body('questionIndex')
    .optional()
    .isInt({ min: 0 }).withMessage('Question index must be non-negative')
];

const submitAttemptValidation = [
  param('attemptId')
    .notEmpty().withMessage('Attempt ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid attempt ID format');
      }
      return true;
    })
];

const logViolationValidation = [
  param('attemptId')
    .notEmpty().withMessage('Attempt ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid attempt ID format');
      }
      return true;
    }),
  
  body('type')
    .notEmpty().withMessage('Violation type is required')
    .isIn(['tab-switch', 'window-blur', 'fullscreen-exit', 'copy', 'paste', 'right-click'])
    .withMessage('Invalid violation type'),
  
  body('details')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Details cannot exceed 500 characters')
];

module.exports = {
  startAttemptValidation,
  saveAnswerValidation,
  submitAttemptValidation,
  logViolationValidation
};
