import apiClient from './client';

/**
 * PHASE 7.0 — Student API Layer (SECURE)
 * Aligned with backend contracts
 */
export const studentAPI = {
  /**
   * Get student's own paper metadata for an exam
   * @param {string} examId - Exam ID
   * @returns {Promise<Object>} Complete paper data with student, exam, and paper info
   */
  getMyPaper: async (examId) => {
    const response = await apiClient.get(`/api/v2/student/exams/${examId}/my-paper`);
    // Backend returns { success: true, data: {...} }
    return response.data.success ? response.data.data : response.data;
  },

  /**
   * Download student's own paper PDF
   * @param {string} examId - Exam ID
   * @returns {Promise<Blob>} PDF file blob
   */
  downloadMyPaper: async (examId) => {
    const response = await apiClient.get(`/api/v2/student/exams/${examId}/my-paper/pdf`, {
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
