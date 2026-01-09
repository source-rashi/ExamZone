/**
 * User roles constants
 * Defines all allowed roles in the system
 */

const ROLES = {
  TEACHER: 'teacher',
  STUDENT: 'student'
};

/**
 * Array of all valid roles
 */
const VALID_ROLES = Object.values(ROLES);

/**
 * Check if a role is valid
 * @param {string} role - Role to validate
 * @returns {boolean} True if role is valid
 */
const isValidRole = (role) => {
  return VALID_ROLES.includes(role);
};

/**
 * Get role display name
 * @param {string} role - Role to get display name for
 * @returns {string} Display name
 */
const getRoleDisplayName = (role) => {
  const displayNames = {
    [ROLES.TEACHER]: 'Teacher',
    [ROLES.STUDENT]: 'Student'
  };
  return displayNames[role] || 'Unknown';
};

module.exports = {
  ROLES,
  VALID_ROLES,
  isValidRole,
  getRoleDisplayName
};
