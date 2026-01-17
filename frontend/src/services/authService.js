import api from './api';

const saveUserToStorage = (user, session) => {
  if (session) {
    localStorage.setItem('token', session.access_token);
  }

  // Create a safe user object without large data like base64 images
  // We don't want to blow up localStorage quota (typically 5MB)
  const safeUser = { ...user };
  delete safeUser.profilePhotoUrl;
  // If we need the photo, we rely on the app ensuring it's fetched via API or context state locally

  localStorage.setItem('user', JSON.stringify(safeUser));
};

const register = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  if (response.data.session) {
    saveUserToStorage(response.data.user, response.data.session);
  }
  return response.data;
};

const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.session) {
    saveUserToStorage(response.data.user, response.data.session);
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

const updateUserProfile = async (data) => {
  const response = await api.put('/auth/update-profile', data);
  if (response.data.user) {
    // We don't have a new session token usually, just update user
    saveUserToStorage(response.data.user, null);
  }
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  loginAsAdmin, // Keep for temporary compatibility, maybe remove later
  updateUserProfile
};

export default authService;
