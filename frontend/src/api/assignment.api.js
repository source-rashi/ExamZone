import apiClient from './client';

// Create assignment with file upload
export const createAssignment = async (classId, formData) => {
  const response = await apiClient.post(`/classes/${classId}/assignments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data || response.data;
};

// Get all assignments for a class
export const getAssignments = async (classId) => {
  const response = await apiClient.get(`/classes/${classId}/assignments`);
  return response.data.data || response.data;
};

// Download assignment file
export const downloadAssignment = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

// Submit assignment
export const submitAssignment = async (assignmentId, formData) => {
  const response = await apiClient.post(`/assignments/${assignmentId}/submit`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get submissions for an assignment (teacher only)
export const getSubmissions = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/submissions`);
  return response.data.data || response.data;
};

// Download submission file
export const downloadSubmission = async (submissionId) => {
  const response = await apiClient.get(`/submissions/${submissionId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};
