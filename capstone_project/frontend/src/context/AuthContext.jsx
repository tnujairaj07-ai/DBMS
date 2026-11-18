import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('learnlink_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('learnlink_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('learnlink_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: userData, access_token } = res.data.data;
      setUser(userData);
      setToken(access_token);
      localStorage.setItem('learnlink_token', access_token);
      localStorage.setItem('learnlink_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const register = async (registrationData) => {
    const res = await api.post('/auth/register', registrationData);
    if (res.data.success) {
      const { user: userData, access_token } = res.data.data;
      setUser(userData);
      setToken(access_token);
      localStorage.setItem('learnlink_token', access_token);
      localStorage.setItem('learnlink_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem('learnlink_user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('learnlink_token');
    localStorage.removeItem('learnlink_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
