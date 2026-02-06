import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Form, Button, Alert, Card, InputGroup, Spinner } from 'react-bootstrap';
import { isValidEmail } from '../utils/validators';
import useToast from '../hooks/useToast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const emailInputRef = useRef(null);

  // Auto-focus email field
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      toast.success('Login successful! Redirecting...');
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="auth-container">
      <div className="w-100" style={{ maxWidth: "450px" }}>
        <Card className="auth-card">
          <Card.Body>
            <div className="text-center mb-4">
              <div className="mb-3">
                <i className="bi bi-cloud-check text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h2>Welcome Back</h2>
              <p className="text-muted">Please login to your account</p>
            </div>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                <i className="bi bi-exclamation-circle me-2"></i>{error}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email" className="mb-3">
                <Form.Label>
                  <i className="bi bi-envelope me-1"></i>Email Address
                </Form.Label>
                <Form.Control 
                  type="email" 
                  required 
                  ref={emailInputRef}
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  onBlur={handleEmailBlur}
                  placeholder="Enter your email"
                  isInvalid={!!emailError}
                  aria-label="Email address"
                  autoComplete="email"
                />
                <Form.Control.Feedback type="invalid">{emailError}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group id="password" className="mb-3">
                <Form.Label>
                  <i className="bi bi-lock me-1"></i>Password
                </Form.Label>
                <InputGroup>
                  <Form.Control 
                    type={showPassword ? 'text' : 'password'}
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your password"
                    aria-label="Password"
                    autoComplete="current-password"
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
              </Form.Group>
              <div className="text-end mb-3">
                <small>
                  <span className="text-muted" style={{ cursor: 'default' }}>
                    <i className="bi bi-question-circle me-1"></i>Forgot Password? Contact your administrator.
                  </span>
                </small>
              </div>
              <Button className="w-100 mb-3" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Logging In...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>Log In
                  </>
                )}
              </Button>
            </Form>
            <div className="w-100 text-center mt-4">
              <span className="text-muted">Don't have an account? </span>
              <Link to="/signup" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Sign Up</Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Login;
