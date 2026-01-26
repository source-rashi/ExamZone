import apiClient from './client';

/**
 * PHASE 7.0 — Exam API (ALIGNED)
 * Handles all exam-related API calls with correct endpoints
 */

/**
 * Create a new exam (draft)
 */
export async function createExam(examData) {
  const response = await apiClient.post('/exams', examData);
  return response.data.data || response.data;
}

/**
 * Publish an exam
 */
export async function publishExam(examId) {
  const response = await apiClient.post(`/exams/${examId}/publish`);
  return response.data.data || response.data;
}

/**
 * Get exams for a specific class
 */
export async function getClassExams(classId) {
  const response = await apiClient.get(`/exams/class/${classId}`);
  return response.data.data || response.data;
}

/**
 * Get student exams for a class (students only see published/running/closed)
 */
export async function getStudentExams(classId) {
  const response = await apiClient.get(`/exams/student/${classId}`);
  return response.data.data || response.data;
}

/**
 * Get exam by ID (role-filtered: students only see published+)
 */
export async function getExamById(examId) {
  const response = await apiClient.get(`/exams/${examId}`);
  return response.data.success ? response.data.data : response.data;
}

/**
 * Update exam (draft only, teacher only)
 */
export async function updateExam(examId, examData) {
  const response = await apiClient.patch(`/exams/${examId}`, examData);
  return response.data;
}

/**
 * Delete exam (teacher only)
 */
export async function deleteExam(examId) {
  const response = await apiClient.delete(`/exams/${examId}`);
  return response.data;
}

/**
 * Generate AI question papers for exam (Phase 6.3, teacher only)
 */
export async function generateQuestionPapers(examId) {
  const response = await apiClient.post(`/exams/${examId}/generate-papers`);
  return response.data;
}

/**
 * Generate student-specific PDF papers (Phase 6.4, teacher only)
 */
export async function generateStudentPapers(examId) {
  const response = await apiClient.post(`/exams/${examId}/generate-student-papers`);
  return response.data;
}

/**
 * Get full exam details with sets and papers (Phase 6.4, teacher only)
 */
export async function getExamDetails(examId) {
  const response = await apiClient.get(`/exams/${examId}/details`);
  return response.data;
}

/**
 * PHASE 7.0 - Get my paper as a student (SECURE)
 * Uses new secure endpoint
 */
export async function getMyPaper(examId) {
  const response = await apiClient.get(`/student/exams/${examId}/my-paper`);
  return response.data.success ? response.data.data : response.data;
}

/**
 * PHASE 7.3.5 - Download my paper PDF as a student (SECURE)
 * Returns blob for download
 */
export async function downloadMyPaper(examId) {
  const response = await apiClient.get(`/student/exams/${examId}/my-paper/pdf`, {
    responseType: 'blob'
  });
  return response.data;
}

export const examAPI = {
  createExam,
  publishExam,
  getClassExams,
  getStudentExams,
  getExamById,
  updateExam,
  deleteExam,
  generateQuestionPapers,
  generateStudentPapers,
  getExamDetails,
  getMyPaper,
  downloadMyPaper
};

export default examAPI;
