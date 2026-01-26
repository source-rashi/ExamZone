/**
 * PHASE 8.1 — Exam Validation Rules
 */

const { body, param } = require('express-validator');
const mongoose = require('mongoose');

const createExamValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Exam title is required')
    .isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('mode')
    .notEmpty().withMessage('Exam mode is required')
    .isIn(['online', 'offline', 'hybrid']).withMessage('Invalid exam mode'),
  
  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .isISO8601().withMessage('Invalid start time format'),
  
  body('endTime')
    .notEmpty().withMessage('End time is required')
    .isISO8601().withMessage('Invalid end time format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 1, max: 1440 }).withMessage('Duration must be 1-1440 minutes'),
  
  body('attemptsAllowed')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Attempts allowed must be 1-10'),
  
  body('paperConfig.subject')
    .notEmpty().withMessage('Subject is required')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Subject must be 1-100 characters'),
  
  body('paperConfig.difficulty')
    .notEmpty().withMessage('Difficulty is required')
    .isIn(['easy', 'medium', 'hard', 'mixed']).withMessage('Invalid difficulty level'),
  
  body('paperConfig.questionsPerSet')
    .notEmpty().withMessage('Questions per set is required')
    .isInt({ min: 1, max: 100 }).withMessage('Questions per set must be 1-100'),
  
  body('paperConfig.totalMarksPerSet')
    .notEmpty().withMessage('Total marks per set is required')
    .isInt({ min: 1, max: 1000 }).withMessage('Total marks must be 1-1000'),
  
  body('paperConfig.marksMode')
    .optional()
    .isIn(['auto', 'manual']).withMessage('Invalid marks mode'),
  
  body('numberOfSets')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Number of sets must be 1-50')
];

const examIdValidation = [
  param('examId')
    .notEmpty().withMessage('Exam ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid exam ID format');
      }
      return true;
    })
];

module.exports = {
  createExamValidation,
  examIdValidation
};
