import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Button, Alert, Card, InputGroup, Spinner } from 'react-bootstrap';
import useToast from '../hooks/useToast';
import authService from '../services/authService';

const readHashParams = () => {
  const hash = window.location.hash?.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash || '';

  return new URLSearchParams(hash);
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenData = useMemo(() => {
    const hashParams = readHashParams();
    const accessToken = searchParams.get('access_token') || hashParams.get('access_token') || '';
    const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token') || '';
    const recoveryToken = searchParams.get('token') || hashParams.get('token') || '';
    const email = searchParams.get('email') || hashParams.get('email') || '';
    const hashError = hashParams.get('error_description') || hashParams.get('error') || '';

    return {
      accessToken,
      refreshToken,
      recoveryToken,
      email,
      hashError
    };
  }, [searchParams]);

  useEffect(() => {
    if (tokenData.hashError) {
      setError(decodeURIComponent(tokenData.hashError));
      return;
    }

    if (!tokenData.accessToken && !tokenData.recoveryToken) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    if (window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  }, [tokenData]);

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

      const response = await authService.resetPassword({
        newPassword,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        recoveryToken: tokenData.recoveryToken,
        email: tokenData.email
      });

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

              <Button
                className="w-100 mb-3"
                type="submit"
                disabled={isSubmitting || (!tokenData.accessToken && !tokenData.recoveryToken)}
              >
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
