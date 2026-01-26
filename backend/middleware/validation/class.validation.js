/**
 * PHASE 8.1 — Class Validation Rules
 */

const { body, param } = require('express-validator');
const mongoose = require('mongoose');

const createClassValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Class name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Class name must be 2-200 characters'),
  
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ min: 2, max: 100 }).withMessage('Subject must be 2-100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
];

const joinClassValidation = [
  body('inviteCode')
    .trim()
    .notEmpty().withMessage('Invite code is required')
    .isLength({ min: 6, max: 10 }).withMessage('Invalid invite code format'),
  
  body('rollNumber')
    .optional()
    .isInt({ min: 1 }).withMessage('Roll number must be a positive integer')
];

const classIdValidation = [
  param('classId')
    .notEmpty().withMessage('Class ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid class ID format');
      }
      return true;
    })
];

module.exports = {
  createClassValidation,
  joinClassValidation,
  classIdValidation
};
