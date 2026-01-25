/**
 * PHASE 7.0 — Student Identity Validation
 * Defensive guards for student authentication context
 */

const { ROLES } = require('./roles');

/**
 * Validate that req.user exists and contains all required fields
 * @param {Object} req - Express request object
 * @throws {Error} If validation fails
 */
function validateStudentUser(req) {
  if (!req.user) {
    throw new Error('Authentication required: req.user is undefined');
  }

  if (!req.user.id) {
    throw new Error('Invalid user context: user.id is missing');
  }

  if (!req.user.role) {
    throw new Error('Invalid user context: user.role is missing');
  }

  if (!req.user.email) {
    throw new Error('Invalid user context: user.email is missing');
  }

  if (req.user.role !== ROLES.STUDENT) {
    throw new Error(`Access denied: Expected student role, got ${req.user.role}`);
  }
}

/**
 * Safely extract student ID from request
 * @param {Object} req - Express request object
 * @returns {string} Student ID
 * @throws {Error} If student context is invalid
 */
function getStudentId(req) {
  validateStudentUser(req);
  return req.user.id;
}

/**
 * Create standardized student context object
 * @param {Object} req - Express request object
 * @returns {Object} Validated student context
 */
function getStudentContext(req) {
  validateStudentUser(req);
  
  return {
    studentId: req.user.id,
    email: req.user.email,
    name: req.user.name || 'Unknown Student',
    role: req.user.role
  };
}

/**
 * Middleware wrapper to enforce student identity validation
 * Use this AFTER authenticate + studentOnly for extra safety
 */
function enforceStudentIdentity(req, res, next) {
  try {
    validateStudentUser(req);
    next();
  } catch (error) {
    console.error('[Student Identity] Validation failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid student authentication context',
      error: error.message
    });
  }
}

module.exports = {
  validateStudentUser,
  getStudentId,
  getStudentContext,
  enforceStudentIdentity
};
