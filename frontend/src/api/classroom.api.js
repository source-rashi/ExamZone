import apiClient from './client';

const BASE_URL = '/api/v2/classroom';

// ==================== ANNOUNCEMENTS ====================

export async function createAnnouncement(classId, data) {
  const response = await apiClient.post(`${BASE_URL}/${classId}/announcements`, data);
  return response.data;
}

export async function getAnnouncements(classId) {
  const response = await apiClient.get(`${BASE_URL}/${classId}/announcements`);
  return response.data;
}

export async function deleteAnnouncement(classId, announcementId) {
  const response = await apiClient.delete(`${BASE_URL}/${classId}/announcements/${announcementId}`);
  return response.data;
}

// ==================== EXAMS ====================

export async function createExam(classId, data) {
  const response = await apiClient.post(`${BASE_URL}/${classId}/exams`, data);
  return response.data;
}

export async function getExams(classId) {
  const response = await apiClient.get(`${BASE_URL}/${classId}/exams`);
  return response.data;
}

// ==================== ASSIGNMENTS ====================

export async function createAssignment(classId, data) {
  const response = await apiClient.post(`${BASE_URL}/${classId}/assignments`, data);
  return response.data;
}

export async function getAssignments(classId) {
  const response = await apiClient.get(`${BASE_URL}/${classId}/assignments`);
  return response.data;
}

// ==================== MEMBERS ====================

export async function getMembers(classId) {
  const response = await apiClient.get(`${BASE_URL}/${classId}/members`);
  return response.data;
}
