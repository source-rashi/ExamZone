/**
 * PHASE 8.1 — Validation Middleware Handler
 * Processes express-validator results
 */

const { validationResult } = require('express-validator');

/**
 * Handle validation errors
 * Returns 400 with detailed errors if validation fails
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  ...require('./auth.validation'),
  ...require('./class.validation'),
  ...require('./exam.validation'),
  ...require('./attempt.validation'),
  ...require('./evaluation.validation')
};
