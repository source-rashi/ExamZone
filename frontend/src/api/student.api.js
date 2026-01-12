import apiClient from './client';

/**
 * Student API Layer
 * TASK 6 - Student exam paper delivery
 */
export const studentAPI = {
  /**
   * Get student's own paper for an exam
   * @param {string} examId - Exam ID
   * @returns {Promise<{rollNumber: number, setId: string, pdfPath: string, generatedAt: Date}>}
   */
  getMyPaper: async (examId) => {
    const response = await apiClient.get(`/exams/${examId}/my-paper`);
    return response.data;
  },

  /**
   * Download student's own paper PDF
   * @param {string} examId - Exam ID
   * @param {number} rollNumber - Student's roll number
   * @returns {Promise<Blob>}
   */
  downloadMyPaper: async (examId, rollNumber) => {
    const response = await apiClient.get(`/exams/${examId}/papers/${rollNumber}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },
};
