/**
 * PHASE 7.4 — Exam Attempt API
 * Frontend API calls for exam attempts
 */

import apiClient from './apiClient';

const BASE_URL = '/attempts';

/**
 * Start a new exam attempt
 * POST /api/v2/attempts/start
 */
export const startAttempt = async (examId) => {
  const response = await apiClient.post(`${BASE_URL}/start`, { examId });
  return response.data;
};

/**
 * Get attempt details
 * GET /api/v2/attempts/:attemptId
 */
export const getAttempt = async (attemptId) => {
  const response = await apiClient.get(`${BASE_URL}/${attemptId}`);
  return response.data;
};

/**
 * Save an answer
 * POST /api/v2/attempts/:attemptId/answer
 */
export const saveAnswer = async (attemptId, questionId, answer, questionIndex) => {
  const response = await apiClient.post(`${BASE_URL}/${attemptId}/answer`, {
    questionId,
    answer,
    questionIndex
  });
  return response.data;
};

/**
 * Log integrity violation
 * POST /api/v2/attempts/:attemptId/log-violation
 */
export const logViolation = async (attemptId, type, details = '') => {
  const response = await apiClient.post(`${BASE_URL}/${attemptId}/log-violation`, {
    type,
    details
  });
  return response.data;
};

/**
 * Submit exam attempt
 * POST /api/v2/attempts/:attemptId/submit
 */
export const submitAttempt = async (attemptId) => {
  const response = await apiClient.post(`${BASE_URL}/${attemptId}/submit`);
  return response.data;
};

export default {
  startAttempt,
  getAttempt,
  saveAnswer,
  logViolation,
  submitAttempt
};
