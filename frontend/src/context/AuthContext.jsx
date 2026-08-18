import React, { createContext, useState, useEffect } from 'react';
import { api, setToken } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate token on mount
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('paisatrack_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await api.get('/auth/me');
        setUser(userData);
      } catch (err) {
        console.error('Session validation failed:', err.message);
        // Only clear token if the backend explicitly rejected credentials (401/403)
        if (err.status === 401 || err.status === 403) {
          setToken(null);
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.post('/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setError(null);
    try {
      const data = await api.post('/auth/register', { name, email, password });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Forgot password helper
  const forgotPassword = async (email, newPassword) => {
    setError(null);
    try {
      const data = await api.post('/auth/forgot-password', { email, newPassword });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        forgotPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
