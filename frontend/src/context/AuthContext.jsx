import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth.api';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Restore user session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const data = await authAPI.getMe();
          setUser(data.user);
          setToken(savedToken);
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const loginWithGoogle = async (googleToken, role = null) => {
    try {
      setLoading(true);
      const data = await authAPI.googleLogin(googleToken, role);
      
      // Store token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set axios default header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      setToken(data.token);
      setUser(data.user);
      
      return data.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    // For email/password login - data already includes token and user
    setUser(userData);
    // Token is already in localStorage from the signup/login page
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    loginWithGoogle,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
