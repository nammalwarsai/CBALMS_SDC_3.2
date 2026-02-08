import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Card, InputGroup, Spinner } from 'react-bootstrap';
import useToast from '../hooks/useToast';
import supabase from '../config/supabaseClient';

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
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const hasHandledEvent = useRef(false);

  useEffect(() => {
    // The Supabase client automatically detects tokens/codes in the URL
    // (both PKCE ?code= and implicit #access_token= flows) and fires
    // the appropriate auth state change event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (hasHandledEvent.current) return;

      if (event === 'PASSWORD_RECOVERY') {
        hasHandledEvent.current = true;
        setSessionReady(true);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Some Supabase versions fire SIGNED_IN instead of PASSWORD_RECOVERY
        // for recovery flows. Check if we came from a recovery link.
        hasHandledEvent.current = true;
        setSessionReady(true);
        setLoading(false);
      }
    });

    // Also try to get the current session in case the event already fired
    // before the listener was attached
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !hasHandledEvent.current) {
        hasHandledEvent.current = true;
        setSessionReady(true);
        setLoading(false);
      }
    });

    // Set a timeout to stop loading and show error if no session is detected
    const timeout = setTimeout(() => {
      if (!hasHandledEvent.current) {
        setLoading(false);
        setError('Invalid or missing reset token. Please request a new password reset link.');
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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

      // Use the Supabase client to update the password directly.
      // The session was established by the auth state change event
      // when the user landed on this page from the recovery email link.
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      const message = 'Your password has been reset successfully.';
      setSuccessMessage(message);
      toast.success(message);

      // Sign out from the Supabase client session so token doesn't linger
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMsg = err.message || 'Unable to reset password';
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

            {loading && (
              <div className="text-center mb-3">
                <Spinner animation="border" size="sm" className="me-2" />
                Verifying your reset link...
              </div>
            )}

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

              <Button className="w-100 mb-3" type="submit" disabled={isSubmitting || !sessionReady}>
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
