import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginAsAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to login. Please check your credentials (' + (err.response?.data?.error || err.message) + ')');
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="w-100" style={{ maxWidth: "450px" }}>
        <Card className="auth-card">
          <Card.Body>
            <div className="text-center mb-4">
              <h2>Welcome Back</h2>
              <p className="text-muted">Please login to your account</p>
            </div>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email" className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </Form.Group>
              <Form.Group id="password" className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </Form.Group>
              <Button className="w-100 mb-3" type="submit">
                Log In
              </Button>
              <div className="text-center my-3 text-muted">
                <span>OR</span>
              </div>
              <Button
                variant="secondary"
                className="w-100"
                onClick={() => {
                  loginAsAdmin();
                  navigate('/admin-dashboard');
                }}
                type="button"
              >
                Login as Admin
              </Button>
            </Form>
            <div className="w-100 text-center mt-4">
              <span className="text-muted">Don't have an account? </span>
              <a href="/signup" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Sign Up</a>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Login;
