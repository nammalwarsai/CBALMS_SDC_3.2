import api from './api';

const register = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  if (response.data.session) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', response.data.session.access_token);
  }
  return response.data;
};

const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.session) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', response.data.session.access_token);
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await api.get('/auth/me');
    return response.data.user;
  } catch (error) {
    // timestamp expired etc.
    logout();
    return null;
  }
};

// Admin login mock removal and replacing with real login if admin rights are checked in backend
// For now, mapping loginAsAdmin to login but we should handle role checks in UI or separate endpoint if needed.
// Integrating into general login flow is better.
const loginAsAdmin = async () => {
  // This was a mock helper. We should ideally remove it or make it use the real login 
  // with hardcoded admin creds if valid, OR just ask user to login.
  // To keep signature valid for now:
  console.warn("loginAsAdmin is deprecated. Use login() with admin credentials.");
  return null;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  loginAsAdmin // Keep for temporary compatibility, maybe remove later
};

export default authService;
