import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      // Determine if we have a session token or if 'user' object has it (mock vs real)
      // Our backend login returns { session: { access_token }, user }
      // The context might store the whole object.
      // Let's assume we store the login response or extracting token.
      // Adjust logic: we will store { token, user } in localStorage or just token.
      // For now, let's assume we store the object that has .token or .session.access_token

      // Adaptation: The plan says we store token/session.
      // Let's assume localStorage 'token' or inside 'user'
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
