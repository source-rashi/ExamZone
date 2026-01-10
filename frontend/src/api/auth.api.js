import apiClient from './client';

export const authAPI = {
  /**
   * Login with Google OAuth token
   * @param {string} googleToken - Google OAuth credential token
   * @returns {Promise<{token: string, user: object}>}
   */
  googleLogin: async (googleToken) => {
    const response = await apiClient.post('/auth/google', {
      token: googleToken,
    });
    return response.data;
  },

  /**
   * Get current authenticated user
   * @returns {Promise<{user: object}>}
   */
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
