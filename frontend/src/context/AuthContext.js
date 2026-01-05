import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const user = authService.login(email, password);
    setUser(user);
    return user;
  };

  const loginAsAdmin = () => {
    const user = authService.loginAsAdmin();
    setUser(user);
    return user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const register = (userData) => {
    const user = authService.register(userData);
    setUser(user);
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsAdmin, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
