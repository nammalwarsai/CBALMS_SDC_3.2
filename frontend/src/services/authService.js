const login = (email, password) => {
  // Mock login - accept any credentials
  const mockUser = {
    name: email.split('@')[0],
    email: email,
    role: 'employee',
    mobileNumber: '1234567890',
    employeeId: 'EMP' + Math.floor(Math.random() * 10000),
    department: 'General',
    profilePhotoUrl: 'https://via.placeholder.com/150'
  };
  localStorage.setItem('user', JSON.stringify(mockUser));
  return mockUser;
};

const loginAsAdmin = () => {
  const mockAdmin = {
    name: 'Admin User',
    email: 'admin@company.com',
    role: 'admin',
    mobileNumber: '9876543210',
    employeeId: 'ADMIN001',
    department: 'Administration',
    profilePhotoUrl: 'https://via.placeholder.com/150'
  };
  localStorage.setItem('user', JSON.stringify(mockAdmin));
  return mockAdmin;
};

const register = (userData) => {
  // Mock registration
  const mockUser = {
    name: userData.name,
    email: userData.email,
    role: userData.role || 'employee',
    department: userData.department || 'General',
    mobileNumber: userData.mobileNumber || '',
    employeeId: userData.employeeId || '',
    profilePhotoUrl: 'https://via.placeholder.com/150'
  };
  localStorage.setItem('user', JSON.stringify(mockUser));
  return mockUser;
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const authService = {
  login,
  loginAsAdmin,
  register,
  logout,
  getCurrentUser,
};

export default authService;
