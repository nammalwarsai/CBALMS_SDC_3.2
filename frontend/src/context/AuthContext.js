import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error("Session check failed", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    // data.user should be returned from login
    // authService sets localStorage, we set state
    if (data.user) {
      setUser(data.user);
    }
    return data.user;
  };

  const loginAsAdmin = async () => {
    // Deprecated or redirect to login
    return login('admin@example.com', 'admin_password_placeholder');
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data.user) {
      setUser(data.user);
    }
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsAdmin, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
