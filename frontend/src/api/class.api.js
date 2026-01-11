import apiClient from './client';

/**
 * Class API — PHASE 5.1
 * Handles all class-related API calls with real User references
 */

/**
 * Get all my classes (works for both teachers and students)
 */
export async function getMyClasses() {
  const response = await apiClient.get('/classes/my');
  return response.data;
}

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
 * Teacher ID is automatically extracted from JWT
 */
export async function createClass(classData) {
  // Ensure both name and title are sent
  const dataToSend = {
    ...classData,
    name: classData.name || classData.title,
    title: classData.title || classData.name
  };
  const response = await apiClient.post('/classes', dataToSend);
  return response.data;
}

/**
 * Join a class using class code (student only)
 * User info is automatically extracted from JWT
 */
export async function joinClass(classCode) {
  const response = await apiClient.post('/classes/join', {
    classCode
  });
  return response.data;
}

/**
 * Get class by ID with populated teacher and students
 */
export async function getClassById(classId) {
  const response = await apiClient.get(`/classes/by-id/${classId}`);
  return response.data;
}

export const classAPI = {
  getMyClasses,
  getTeacherClasses,
  getStudentClasses,
  createClass,
  joinClass,
  getClassById,
};

export default classAPI;
