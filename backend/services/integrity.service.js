/**
 * Integrity Service - Phase 3.5
 * Manages exam security, violation tracking, and auto-submission
 */

const Attempt = require('../models/Attempt');
const Exam = require('../models/Exam');
const { ATTEMPT_STATUS, EXAM_STATUS } = require('../utils/constants');
const attemptService = require('./attempt.service');

/**
 * Log a violation event for an attempt
 * @param {string} attemptId - Attempt ID
 * @param {string} type - Violation type (tab_switch, focus_lost, fullscreen_exit, copy, paste, suspicious_activity)
 * @returns {Promise<Object>} Updated attempt
 * @throws {Error} If attempt not found or not in valid state
 */
async function logViolation(attemptId, type) {
  const attempt = await Attempt.findById(attemptId).populate('examId');
  
  if (!attempt) {
    throw new Error('Attempt not found');
  }
  
  // Only log violations for IN_PROGRESS attempts
  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    throw new Error(`Cannot log violation: attempt is ${attempt.status}, expected ${ATTEMPT_STATUS.IN_PROGRESS}`);
  }
  
  // Check if exam is still LIVE
  if (attempt.examId.status !== EXAM_STATUS.LIVE) {
    throw new Error(`Cannot log violation: exam is ${attempt.examId.status}, expected ${EXAM_STATUS.LIVE}`);
  }
  
  // Initialize integrity if not present
  if (!attempt.integrity) {
    attempt.integrity = {
      tabSwitches: 0,
      focusLostCount: 0,
      fullscreenExitCount: 0,
      copyEvents: 0,
      pasteEvents: 0,
      violations: [],
      lastActiveAt: new Date(),
      autoSubmitted: false
    };
  }
  
  // Increment specific counter based on violation type
  switch (type) {
    case 'tab_switch':
      attempt.integrity.tabSwitches += 1;
      break;
    case 'focus_lost':
      attempt.integrity.focusLostCount += 1;
      break;
    case 'fullscreen_exit':
      attempt.integrity.fullscreenExitCount += 1;
      break;
    case 'copy':
      attempt.integrity.copyEvents += 1;
      break;
    case 'paste':
      attempt.integrity.pasteEvents += 1;
      break;
    case 'suspicious_activity':
      // Generic counter - no specific field, just logged in violations array
      break;
    default:
      throw new Error(`Invalid violation type: ${type}`);
  }
  
  // Add to violations array for audit trail
  attempt.integrity.violations.push({
    type,
    timestamp: new Date()
  });
  
  // Update last active timestamp
  attempt.integrity.lastActiveAt = new Date();
  
  await attempt.save();
  
  // Check if timeout exceeded after logging violation
  const autoSubmitted = await autoSubmitIfTimeout(attempt);
  
  // If auto-submitted, return the submitted attempt
  if (autoSubmitted) {
    return autoSubmitted;
  }
  
  return attempt;
}

/**
 * Record a heartbeat to track student activity
 * @param {string} attemptId - Attempt ID
 * @returns {Promise<Object>} Updated attempt
 * @throws {Error} If attempt not found or not in valid state
 */
async function heartbeat(attemptId) {
  const attempt = await Attempt.findById(attemptId).populate('examId');
  
  if (!attempt) {
    throw new Error('Attempt not found');
  }
  
  // Only accept heartbeats for IN_PROGRESS attempts
  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    throw new Error(`Cannot heartbeat: attempt is ${attempt.status}, expected ${ATTEMPT_STATUS.IN_PROGRESS}`);
  }
  
  // Check if exam is still LIVE
  if (attempt.examId.status !== EXAM_STATUS.LIVE) {
    throw new Error(`Cannot heartbeat: exam is ${attempt.examId.status}, expected ${EXAM_STATUS.LIVE}`);
  }
  
  // Initialize integrity if not present
  if (!attempt.integrity) {
    attempt.integrity = {
      tabSwitches: 0,
      focusLostCount: 0,
      fullscreenExitCount: 0,
      copyEvents: 0,
      pasteEvents: 0,
      violations: [],
      lastActiveAt: new Date(),
      autoSubmitted: false
    };
  }
  
  // Update last active timestamp
  attempt.integrity.lastActiveAt = new Date();
  
  await attempt.save();
  
  // Check if timeout exceeded
  const autoSubmitted = await autoSubmitIfTimeout(attempt);
  
  // If auto-submitted, return the submitted attempt
  if (autoSubmitted) {
    return autoSubmitted;
  }
  
  // Otherwise return the updated attempt
  return attempt;
}

/**
 * Auto-submit attempt if time exceeded
 * @param {Object} attempt - Attempt document (must be populated with examId)
 * @returns {Promise<Object|null>} Submitted attempt or null if not submitted
 */
async function autoSubmitIfTimeout(attempt) {
  // Only check IN_PROGRESS attempts
  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    return null;
  }
  
  // Ensure examId is populated
  if (!attempt.examId || !attempt.examId.durationMinutes) {
    const populatedAttempt = await Attempt.findById(attempt._id).populate('examId');
    attempt = populatedAttempt;
  }
  
  const exam = attempt.examId;
  const durationMs = exam.durationMinutes * 60 * 1000;
  const startedAt = new Date(attempt.startedAt);
  const now = new Date();
  const elapsed = now - startedAt;
  
  // If time exceeded, auto-submit
  if (elapsed > durationMs) {
    // Mark as auto-submitted
    attempt.integrity = attempt.integrity || {};
    attempt.integrity.autoSubmitted = true;
    await attempt.save();
    
    // Submit the attempt
    const submittedAttempt = await attemptService.submitAttempt(attempt._id);
    
    return submittedAttempt;
  }
  
  return null;
}

module.exports = {
  logViolation,
  heartbeat,
  autoSubmitIfTimeout
};
