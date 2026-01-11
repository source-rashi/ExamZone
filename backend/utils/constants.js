/**
 * Application Constants
 * Centralized enums and constants for exam system
 */

/**
 * Exam lifecycle states
 */
const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  LIVE: 'live',
  CLOSED: 'closed',
  EVALUATING: 'evaluating',
  RESULT_PUBLISHED: 'result_published'
};

/**
 * Attempt lifecycle states
 */
const ATTEMPT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  EVALUATED: 'evaluated'
};

/**
 * Valid exam state transitions
 * Maps current state to allowed next states
 */
const EXAM_STATE_TRANSITIONS = {
  [EXAM_STATUS.DRAFT]: [EXAM_STATUS.PUBLISHED],
  [EXAM_STATUS.PUBLISHED]: [EXAM_STATUS.LIVE, EXAM_STATUS.DRAFT],
  [EXAM_STATUS.LIVE]: [EXAM_STATUS.CLOSED],
  [EXAM_STATUS.CLOSED]: [EXAM_STATUS.EVALUATING],
  [EXAM_STATUS.EVALUATING]: [EXAM_STATUS.RESULT_PUBLISHED],
  [EXAM_STATUS.RESULT_PUBLISHED]: []
};

/**
 * Valid attempt state transitions
 */
const ATTEMPT_STATE_TRANSITIONS = {
  [ATTEMPT_STATUS.NOT_STARTED]: [ATTEMPT_STATUS.IN_PROGRESS],
  [ATTEMPT_STATUS.IN_PROGRESS]: [ATTEMPT_STATUS.SUBMITTED],
  [ATTEMPT_STATUS.SUBMITTED]: [ATTEMPT_STATUS.EVALUATED],
  [ATTEMPT_STATUS.EVALUATED]: []
};

module.exports = {
  EXAM_STATUS,
  ATTEMPT_STATUS,
  EXAM_STATE_TRANSITIONS,
  ATTEMPT_STATE_TRANSITIONS
};
