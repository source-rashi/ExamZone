/**
 * Invite Service
 * Handles invitation creation and acceptance
 */

const crypto = require('crypto');
const Invite = require('../models/Invite');
const Class = require('../models/Class');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const enrollmentService = require('./enrollment.service');
const mailService = require('./mail.service');
const { classInviteEmail } = require('../utils/emailTemplates');
const { ROLES } = require('../utils/roles');

/**
 * Generate cryptographically secure token
 * @returns {String} Secure random token
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create and send class invitation
 * @param {String} teacherId - ID of teacher creating invite
 * @param {String} classId - ID of class to invite to
 * @param {String} email - Email address to invite
 * @param {String} role - Role for invitee (default: student)
 * @returns {Promise<Object>} Created invite
 */
async function createInvite(teacherId, classId, email, role = ROLES.STUDENT) {
  // Validate class exists and teacher has access
  const classDoc = await Class.findById(classId);
  
  if (!classDoc) {
    throw new Error('Class not found');
  }
  
  if (classDoc.teacherId.toString() !== teacherId.toString()) {
    throw new Error('Only the class teacher can send invites');
  }
  
  // Check if user is already enrolled
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  
  if (existingUser) {
    const existingEnrollment = await Enrollment.findOne({
      classId,
      studentId: existingUser._id
    });
    
    if (existingEnrollment) {
      throw new Error('User is already enrolled in this class');
    }
  }
  
  // Check for existing pending invite
  const existingInvite = await Invite.findOne({
    email: email.toLowerCase(),
    classId,
    accepted: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (existingInvite) {
    throw new Error('Pending invite already exists for this email');
  }
  
  // Generate secure token
  const token = generateSecureToken();
  
  // Set expiry (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  // Create invite
  const invite = await Invite.create({
    email: email.toLowerCase(),
    classId,
    role,
    token,
    expiresAt,
    createdBy: teacherId
  });
  
  // Populate references
  await invite.populate('classId createdBy');
  
  // Send invitation email (async, non-blocking)
  sendInviteEmail(invite).catch(error => {
    console.error('Failed to send invite email:', error.message);
  });
  
  return invite;
}

/**
 * Send invitation email
 * @param {Object} invite - Invite document
 * @returns {Promise<Object>} Send result
 */
async function sendInviteEmail(invite) {
  const acceptUrl = `${process.env.APP_URL || 'http://localhost:3000'}/invite/${invite.token}`;
  
  const emailContent = classInviteEmail({
    className: invite.classId.title,
    teacherName: invite.createdBy.name,
    role: invite.role,
    acceptUrl,
    expiresAt: invite.expiresAt
  });
  
  return await mailService.sendMail(
    invite.email,
    `You're invited to join ${invite.classId.title}`,
    emailContent
  );
}

/**
 * Accept invitation and enroll user in class
 * @param {String} token - Invitation token
 * @param {String} userId - ID of user accepting invite
 * @returns {Promise<Object>} Enrollment result
 */
async function acceptInvite(token, userId) {
  // Find valid invite
  const invite = await Invite.findValidInvite(token);
  
  if (!invite) {
    throw new Error('Invalid or expired invitation');
  }
  
  // Get user
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Verify email matches
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error('This invitation is for a different email address');
  }
  
  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    classId: invite.classId,
    studentId: userId
  });
  
  if (existingEnrollment) {
    // Mark invite as accepted anyway
    invite.accepted = true;
    invite.acceptedBy = userId;
    invite.acceptedAt = new Date();
    await invite.save();
    
    throw new Error('You are already enrolled in this class');
  }
  
  // Create enrollment using enrollmentService (auto-assigns rollNumber)
  console.log('[Invite Accept] Creating enrollment:', {
    classId: invite.classId,
    studentId: userId,
    enrolledBy: invite.createdBy
  });
  
  const enrollment = await enrollmentService.enrollStudent({
    classId: invite.classId,
    studentId: userId,
    enrolledBy: invite.createdBy
  });
  
  console.log('[Invite Accept] Enrollment created:', {
    id: enrollment._id,
    rollNumber: enrollment.rollNumber,
    status: enrollment.status
  });
  
  // Mark invite as accepted
  invite.accepted = true;
  invite.acceptedBy = userId;
  invite.acceptedAt = new Date();
  await invite.save();
  
  // Populate enrollment
  await enrollment.populate('classId studentId');
  
  return {
    enrollment,
    class: invite.classId,
    message: `Successfully joined ${invite.classId.title}`
  };
}

/**
 * Get pending invites for a class
 * @param {String} classId - Class ID
 * @returns {Promise<Array>} Pending invites
 */
async function getPendingInvites(classId) {
  return await Invite.findPendingInvites(classId);
}

/**
 * Cancel/delete an invite
 * @param {String} inviteId - Invite ID
 * @param {String} teacherId - Teacher ID (for authorization)
 * @returns {Promise<void>}
 */
async function cancelInvite(inviteId, teacherId) {
  const invite = await Invite.findById(inviteId).populate('classId');
  
  if (!invite) {
    throw new Error('Invite not found');
  }
  
  if (invite.classId.teacherId.toString() !== teacherId.toString()) {
    throw new Error('Only the class teacher can cancel invites');
  }
  
  if (invite.accepted) {
    throw new Error('Cannot cancel accepted invite');
  }
  
  await Invite.findByIdAndDelete(inviteId);
}

/**
 * Clean up expired invites (utility function)
 * @returns {Promise<Number>} Number of deleted invites
 */
async function cleanupExpiredInvites() {
  const result = await Invite.deleteMany({
    accepted: false,
    expiresAt: { $lt: new Date() }
  });
  
  return result.deletedCount;
}

module.exports = {
  createInvite,
  acceptInvite,
  getPendingInvites,
  cancelInvite,
  cleanupExpiredInvites,
  sendInviteEmail
};
