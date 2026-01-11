/**
 * Role-Based Access Control Middleware
 * Restricts routes to specific user roles
 */

const { ROLES } = require('../utils/roles');

/**
 * Middleware factory to allow only specific roles
 * @param {...String} allowedRoles - Roles that can access the route
 * @returns {Function} Express middleware
 */
function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    
    next();
  };
}

/**
 * Middleware to allow only teachers
 */
function teacherOnly(req, res, next) {
  return allowRoles(ROLES.TEACHER)(req, res, next);
}

/**
 * Middleware to allow only students
 */
function studentOnly(req, res, next) {
  return allowRoles(ROLES.STUDENT)(req, res, next);
}

/**
 * Middleware to allow both teachers and students
 */
function authenticated(req, res, next) {
  return allowRoles(ROLES.TEACHER, ROLES.STUDENT)(req, res, next);
}

module.exports = {
  allowRoles,
  teacherOnly,
  studentOnly,
  authenticated
};
