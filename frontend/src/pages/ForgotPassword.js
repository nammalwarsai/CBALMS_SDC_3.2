import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { isValidEmail } from '../utils/validators';
import useToast from '../hooks/useToast';
import supabase from '../config/supabaseClient';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailInputRef = useRef(null);
  const toast = useToast();

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
    setSuccessMessage('');

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);

      // Call Supabase directly from the frontend so that the PKCE
      // code verifier is stored in the browser's localStorage.
      // This ensures the code exchange works when the user clicks
      // the recovery link and lands on the ResetPassword page.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetError) {
        throw resetError;
      }

      const message = 'If an account exists for this email, a password reset link has been sent. Please check your inbox.';
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      const errorMsg = err.message || 'Unable to process request';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="w-100" style={{ maxWidth: '450px' }}>
        <Card className="auth-card">
          <Card.Body>
            <div className="text-center mb-4">
              <div className="mb-3">
                <i className="bi bi-key-fill text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h2>Forgot Password</h2>
              <p className="text-muted">Enter your email to receive a password reset link.</p>
            </div>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                <i className="bi bi-exclamation-circle me-2"></i>{error}
              </Alert>
            )}

            {successMessage && (
              <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
                <i className="bi bi-check-circle me-2"></i>{successMessage}
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  onBlur={handleEmailBlur}
                  placeholder="Enter your email"
                  isInvalid={!!emailError}
                  aria-label="Email address"
                  autoComplete="email"
                />
                <Form.Control.Feedback type="invalid">{emailError}</Form.Control.Feedback>
              </Form.Group>

              <Button className="w-100 mb-3" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>Send Reset Link
                  </>
                )}
              </Button>
            </Form>

            <div className="w-100 text-center mt-3">
              <span className="text-muted">Remember your password? </span>
              <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
                Back to Login
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
