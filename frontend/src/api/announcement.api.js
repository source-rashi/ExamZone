import apiClient from './client';

/**
 * PHASE 5.2 — Announcement API
 * Handles classroom announcements
 */

/**
 * Create a new announcement
 * @param {string} classId - Class ID
 * @param {Object} data - Announcement data
 * @param {string} data.content - Announcement content
 * @returns {Promise<{announcement: Object}>}
 */
export async function createAnnouncement(classId, data) {
  const response = await apiClient.post(`/classes/${classId}/announcements`, data);
  return response.data;
}

/**
 * Get all announcements for a class
 * @param {string} classId - Class ID
 * @returns {Promise<{announcements: Array}>}
 */
export async function getAnnouncements(classId) {
  const response = await apiClient.get(`/classes/${classId}/announcements`);
  return response.data;
}

/**
 * Delete an announcement
 * @param {string} announcementId - Announcement ID
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteAnnouncement(announcementId) {
  const response = await apiClient.delete(`/announcements/${announcementId}`);
  return response.data;
}

export const announcementAPI = {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
};

export default announcementAPI;
