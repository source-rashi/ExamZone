import apiClient from './client';

/**
 * Teacher API Layer
 * All endpoints use JWT authentication via apiClient interceptor
 */
export const teacherAPI = {
  /**
   * Get all classes for the logged-in teacher
   * @returns {Promise<{classes: Array}>}
   */
  getMyClasses: async () => {
    const response = await apiClient.get('/classes/teacher');
    return response.data;
  },

  /**
   * Create a new class (PHASE 5.1)
   * @param {Object} data - Class data
   * @param {string} data.name - Class name
   * @param {string} data.subject - Subject
   * @param {string} [data.description] - Optional description
   * @returns {Promise<{class: Object}>}
   */
  createClass: async (data) => {
    const response = await apiClient.post('/classes', data);
    return response.data;
  },

  /**
   * Get details of a specific class (PHASE 5.1)
   * Returns populated teacher and students data
   * @param {string} classId - Class ID
   * @returns {Promise<{class: Object}>}
   */
  getClassDetails: async (classId) => {
    const response = await apiClient.get(`/classes/${classId}`);
    return response.data;
  },

  /**
   * Invite a student to a class
   * @param {string} classId - Class ID
   * @param {string} email - Student email
   * @returns {Promise<{invite: Object}>}
   */
  inviteStudent: async (classId, email) => {
    const response = await apiClient.post(`/classes/${classId}/invite`, { email });
    return response.data;
  },

  /**
   * Create an exam for a class
   * @param {string} classId - Class ID
   * @param {Object} data - Exam data
   * @param {string} data.title - Exam title
   * @param {string} [data.description] - Exam description
   * @param {number} data.duration - Duration in minutes
   * @param {number} data.totalMarks - Total marks
   * @param {number} data.maxAttempts - Maximum attempts allowed
   * @param {Object} data.aiConfig - AI evaluation config
   * @param {number} data.aiConfig.minPassPercentage - Minimum pass percentage
   * @param {boolean} data.aiConfig.strictMode - Strict evaluation mode
   * @returns {Promise<{exam: Object}>}
   */
  createExam: async (classId, data) => {
    const response = await apiClient.post(`/classes/${classId}/exams`, data);
    return response.data;
  },

  /**
   * Publish an exam (make it available to students)
   * @param {string} examId - Exam ID
   * @returns {Promise<{exam: Object}>}
   */
  publishExam: async (examId) => {
    const response = await apiClient.post(`/exams/${examId}/publish`);
    return response.data;
  },

  /**
   * Generate answer papers for an exam (PHASE 6.3)
   * Creates question sets
   * @param {string} examId - Exam ID
   * @returns {Promise<{message: string, numberOfSets: number, totalQuestions: number}>}
   */
  generatePapers: async (examId) => {
    const response = await apiClient.post(`/exams/${examId}/generate-papers`);
    return response.data;
  },

  /**
   * Generate student-specific PDF papers (PHASE 6.4)
   * Creates individual PDFs for each student
   * @param {string} examId - Exam ID
   * @returns {Promise<{message: string, papersGenerated: number}>}
   */
  generateStudentPapers: async (examId) => {
    const response = await apiClient.post(`/exams/${examId}/generate-student-papers`);
    return response.data;
  },
};
