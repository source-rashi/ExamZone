/**
 * PHASE 8.1 — Evaluation Validation Rules
 */

const { body, param } = require('express-validator');
const mongoose = require('mongoose');

const attemptIdValidation = [
  param('attemptId')
    .notEmpty().withMessage('Attempt ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid attempt ID format');
      }
      return true;
    })
];

const submitEvaluationValidation = [
  param('attemptId')
    .notEmpty().withMessage('Attempt ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid attempt ID format');
      }
      return true;
    }),
  
  body('score')
    .notEmpty().withMessage('Score is required')
    .isFloat({ min: 0 }).withMessage('Score must be non-negative'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Feedback cannot exceed 2000 characters'),
  
  body('perQuestionMarks')
    .optional()
    .isArray().withMessage('Per question marks must be an array'),
  
  body('perQuestionMarks.*.questionId')
    .if(body('perQuestionMarks').exists())
    .notEmpty().withMessage('Question ID is required'),
  
  body('perQuestionMarks.*.marksAwarded')
    .if(body('perQuestionMarks').exists())
    .isFloat({ min: 0 }).withMessage('Marks awarded must be non-negative'),
  
  body('perQuestionMarks.*.maxMarks')
    .if(body('perQuestionMarks').exists())
    .isFloat({ min: 0 }).withMessage('Max marks must be non-negative'),
  
  body('perQuestionMarks.*.feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Question feedback cannot exceed 1000 characters')
];

module.exports = {
  attemptIdValidation,
  submitEvaluationValidation
};
