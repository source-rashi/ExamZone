import apiClient from './client';

/**
 * PHASE 7.1 — Student API Layer
 * Includes attempt lifecycle management
 */
export const studentAPI = {
  // ==================================================================
  // PHASE 7.1 — ATTEMPT LIFECYCLE
  // ==================================================================
  
  /**
   * Start a new exam attempt
   * @param {string} examId - Exam ID
   * @returns {Promise<Object>} Attempt data with attemptId, attemptNo, startedAt, expectedEndTime, exam
   */
  startExamAttempt: async (examId) => {
    const response = await apiClient.post('/attempts/start', { examId });
    return response.data.success ? response.data.data : response.data;
  },

  /**
   * Get active attempt for an exam (if exists)
   * @param {string} examId - Exam ID
   * @returns {Promise<Object|null>} Active attempt data or null
   */
  getActiveAttempt: async (examId) => {
    const response = await apiClient.get(`/attempts/${examId}/active`);
    return response.data.success ? response.data.data : response.data;
  },

  /**
   * Get exam paper through attempt
   * @param {string} attemptId - Attempt ID
   * @returns {Promise<Object>} Paper with questions, attemptInfo, exam metadata
   */
  getAttemptPaper: async (attemptId) => {
    const response = await apiClient.get(`/attempts/${attemptId}/paper`);
    return response.data.success ? response.data.data : response.data;
  },

  // ==================================================================
  // PHASE 7.0 — PAPER ACCESS (LEGACY)
  // ==================================================================
  
  /**
   * Get student's own paper metadata for an exam
   * @param {string} examId - Exam ID
   * @returns {Promise<Object>} Complete paper data with student, exam, and paper info
   */
  getMyPaper: async (examId) => {
    const response = await apiClient.get(`/student/exams/${examId}/my-paper`);
    return response.data.success ? response.data.data : response.data;
  },

  /**
   * Download student's own paper PDF
   * @param {string} examId - Exam ID
   * @returns {Promise<Blob>} PDF file blob
   */
  downloadMyPaper: async (examId) => {
    const response = await apiClient.get(`/student/exams/${examId}/my-paper/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  /**
   * Alternative: Download via paper routes
   * @param {string} examId - Exam ID
   * @returns {Promise<Blob>} PDF file blob
   */
  downloadPaper: async (examId) => {
    const response = await apiClient.get(`/api/papers/student/${examId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default studentAPI;
