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


const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

const resetPassword = async (payload) => {
  const response = await api.post('/auth/reset-password', payload);
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
  updateUserProfile,
  forgotPassword,
  resetPassword
};

export default authService;
