import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Card, InputGroup, Spinner } from 'react-bootstrap';
import useToast from '../hooks/useToast';
import authService from '../services/authService';

// Parse hash fragment params (Supabase puts tokens in the URL hash, not query string)
const parseHashParams = (hash) => {
  if (!hash || hash.length <= 1) return {};
  const params = {};
  const pairs = hash.substring(1).split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  return params;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    // Supabase redirects with tokens in the hash fragment:
    // /reset-password#access_token=...&refresh_token=...&type=recovery
    // Or with errors:
    // /reset-password#error=access_denied&error_code=otp_expired&error_description=...
    const hashParams = parseHashParams(window.location.hash);

    // Check for Supabase error in hash
    if (hashParams.error) {
      const description = (hashParams.error_description || '').replace(/\+/g, ' ');
      const errorCode = hashParams.error_code || '';

      if (errorCode === 'otp_expired') {
        setError('The password reset link has expired. Please request a new one.');
      } else {
        setError(description || 'Password reset failed. Please request a new link.');
      }
      // Clean up hash from URL
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // Extract access_token from hash
    if (hashParams.access_token) {
      setAccessToken(hashParams.access_token);
      setTokenReady(true);
      // Clean up hash from URL so tokens aren't visible
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // Also check query params as fallback
    const queryParams = new URLSearchParams(window.location.search);
    const qAccessToken = queryParams.get('access_token') || '';
    if (qAccessToken) {
      setAccessToken(qAccessToken);
      setTokenReady(true);
      return;
    }

    // No tokens found at all
    setError('Invalid or missing reset token. Please request a new password reset link.');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        newPassword,
        accessToken
      };

      const response = await authService.resetPassword(payload);
      const message = response.message || 'Your password has been reset successfully.';
      setSuccessMessage(message);
      toast.success(message);

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Unable to reset password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="w-100" style={{ maxWidth: '480px' }}>
        <Card className="auth-card">
          <Card.Body>
            <div className="text-center mb-4">
              <div className="mb-3">
                <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h2>Reset Password</h2>
              <p className="text-muted">Set your new account password below.</p>
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
              <Form.Group id="newPassword" className="mb-3">
                <Form.Label>
                  <i className="bi bi-lock me-1"></i>New Password
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </Button>
                </InputGroup>
              </Form.Group>

              <Form.Group id="confirmPassword" className="mb-3">
                <Form.Label>
                  <i className="bi bi-shield-lock me-1"></i>Confirm Password
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </Button>
                </InputGroup>
              </Form.Group>

              <Form.Text className="text-muted d-block mb-3">
                Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
              </Form.Text>

              <Button className="w-100 mb-3" type="submit" disabled={isSubmitting || !tokenReady}>
                {isSubmitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-repeat me-2"></i>Reset Password
                  </>
                )}
              </Button>
            </Form>

            <div className="w-100 text-center mt-3">
              {error && (
                <div className="mb-2">
                  <Link to="/forgot-password" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
                    <i className="bi bi-arrow-repeat me-1"></i>Request a New Reset Link
                  </Link>
                </div>
              )}
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

export default ResetPassword;
