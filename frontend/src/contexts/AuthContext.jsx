import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData, sessionId) => {
    console.log('AuthContext login called with:', { userData, sessionId }); // Debug log
    // For session auth, we store sessionId instead of authToken
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    console.log('AuthContext user state updated:', userData); // Debug log
  };

  const logout = () => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};