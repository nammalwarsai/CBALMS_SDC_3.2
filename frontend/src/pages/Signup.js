import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Form, Button, Alert, Card, InputGroup, Spinner } from 'react-bootstrap';
import { validatePassword, isValidEmail, isValidMobile } from '../utils/validators';
import PasswordStrengthIndicator from '../components/common/PasswordStrengthIndicator';
import useToast from '../hooks/useToast';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    mobileNumber: '',
    employeeId: '',
    role: 'employee'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const nameInputRef = useRef(null);

  // Auto-focus first field
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    switch (name) {
      case 'email':
        if (value && !isValidEmail(value)) errors.email = 'Invalid email format';
        else delete errors.email;
        break;
      case 'mobileNumber':
        if (value && !isValidMobile(value)) errors.mobileNumber = 'Invalid mobile number';
        else delete errors.mobileNumber;
        break;
      case 'confirmPassword':
        if (value && value !== formData.password) errors.confirmPassword = 'Passwords do not match';
        else delete errors.confirmPassword;
        break;
      case 'password':
        if (value) {
          const { isValid } = validatePassword(value);
          if (!isValid) errors.password = 'Password does not meet requirements';
          else delete errors.password;
        }
        // Also revalidate confirm password
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;
      default:
        break;
    }
    
    setFieldErrors(errors);
  };

  const handleBlur = (e) => {
    validateField(e.target.name, e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const { isValid: passwordValid } = validatePassword(formData.password);
    if (!passwordValid) {
      setError('Password does not meet strength requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.mobileNumber && !isValidMobile(formData.mobileNumber)) {
      setError('Please enter a valid mobile number');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        ...formData,
        role: 'employee', // Force employee role
        fullName: formData.name
      });
      toast.success('Account created successfully! Welcome to CBALMS.');
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create account';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="w-100" style={{ maxWidth: "550px" }}>
        <Card className="auth-card">
          <Card.Body>
            <div className="text-center mb-4">
              <div className="mb-3">
                <i className="bi bi-person-plus text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h2>Create Account</h2>
              <p className="text-muted">Join our attendance management system</p>
            </div>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                <i className="bi bi-exclamation-circle me-2"></i>{error}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="name" className="mb-3">
                <Form.Label><i className="bi bi-person me-1"></i>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  required
                  ref={nameInputRef}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  aria-label="Full name"
                  autoComplete="name"
                />
              </Form.Group>
              <Form.Group id="email" className="mb-3">
                <Form.Label><i className="bi bi-envelope me-1"></i>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your email"
                  isInvalid={!!fieldErrors.email}
                  aria-label="Email address"
                  autoComplete="email"
                />
                <Form.Control.Feedback type="invalid">{fieldErrors.email}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group id="department" className="mb-3">
                <Form.Label><i className="bi bi-building me-1"></i>Department</Form.Label>
                <Form.Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  aria-label="Department"
                >
                  <option value="">Select Department</option>
                  <option value="CSE">CSE</option>
                  <option value="EEE">EEE</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="CE">CE</option>
                  <option value="AI/DS">AI/DS</option>
                  <option value="IT">IT</option>
                </Form.Select>
              </Form.Group>
              <Form.Group id="mobileNumber" className="mb-3">
                <Form.Label><i className="bi bi-phone me-1"></i>Mobile Number</Form.Label>
                <Form.Control
                  type="tel"
                  name="mobileNumber"
                  required
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your mobile number"
                  isInvalid={!!fieldErrors.mobileNumber}
                  aria-label="Mobile number"
                  autoComplete="tel"
                />
                <Form.Control.Feedback type="invalid">{fieldErrors.mobileNumber}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group id="employeeId" className="mb-3">
                <Form.Label><i className="bi bi-card-text me-1"></i>Employee ID</Form.Label>
                <Form.Control
                  type="text"
                  name="employeeId"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="Enter your employee ID"
                  aria-label="Employee ID"
                />
              </Form.Group>
              <Form.Group id="password" className="mb-3">
                <Form.Label><i className="bi bi-lock me-1"></i>Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Create a strong password"
                    isInvalid={!!fieldErrors.password}
                    aria-label="Password"
                    autoComplete="new-password"
                  />
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </Button>
                </InputGroup>
                <PasswordStrengthIndicator password={formData.password} />
              </Form.Group>
              <Form.Group id="confirmPassword" className="mb-4">
                <Form.Label><i className="bi bi-lock-fill me-1"></i>Confirm Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Confirm your password"
                    isInvalid={!!fieldErrors.confirmPassword}
                    aria-label="Confirm password"
                    autoComplete="new-password"
                  />
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    tabIndex={-1}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </Button>
                </InputGroup>
                <Form.Control.Feedback type="invalid">{fieldErrors.confirmPassword}</Form.Control.Feedback>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <small className="text-success">
                    <i className="bi bi-check-circle me-1"></i>Passwords match
                  </small>
                )}
              </Form.Group>
              <Button className="w-100" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus me-2"></i>Create Account
                  </>
                )}
              </Button>
            </Form>
            <div className="w-100 text-center mt-4">
              <span className="text-muted">Already have an account? </span>
              <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Log In</Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
