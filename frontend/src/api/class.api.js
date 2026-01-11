import apiClient from './client';

/**
 * Class API
 * Handles all class-related API calls
 */

/**
 * Get all classes for the current teacher
 */
export async function getTeacherClasses() {
  const response = await apiClient.get('/classes/teacher');
  return response.data;
}

/**
 * Get all classes the current student has joined
 */
export async function getStudentClasses() {
  const response = await apiClient.get('/classes/student');
  return response.data;
}

/**
 * Create a new class (teacher only)
 */
export async function createClass(classData) {
  const response = await apiClient.post('/classes', classData);
  return response.data;
}

/**
 * Join a class using class code (student only)
 */
export async function joinClass(classCode, studentData) {
  const response = await apiClient.post('/classes/join', {
    classCode,
    ...studentData
  });
  return response.data;
}

/**
 * Get class by ID (with access control)
 */
export async function getClassById(classId) {
  const response = await apiClient.get(`/classes/by-id/${classId}`);
  return response.data;
}

export const classAPI = {
  getTeacherClasses,
  getStudentClasses,
  createClass,
  joinClass,
  getClassById,
};

export default classAPI;
