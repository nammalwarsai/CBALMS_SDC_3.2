/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Returns { isValid, errors[] }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('One number');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('One special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: getPasswordStrength(password)
  };
};

/**
 * Get password strength level
 */
const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

  if (score <= 2) return { level: 'Weak', color: '#EF4444', percent: 25 };
  if (score <= 3) return { level: 'Fair', color: '#F59E0B', percent: 50 };
  if (score <= 4) return { level: 'Good', color: '#3B82F6', percent: 75 };
  return { level: 'Strong', color: '#10B981', percent: 100 };
};

/**
 * Validate mobile number
 */
export const isValidMobile = (mobile) => {
  const mobileRegex = /^[0-9+\-\s()]{7,15}$/;
  return mobileRegex.test(mobile);
};
