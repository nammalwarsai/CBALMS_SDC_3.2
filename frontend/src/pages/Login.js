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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
      console.error(err);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Log In</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Form.Group>
              <Form.Group id="password" className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </Form.Group>
              <Button className="w-100" type="submit">
                Log In
              </Button>
              <div className="text-center my-2">OR</div>
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
            <div className="w-100 text-center mt-3">
              Don't have an account? <a href="/signup">Sign Up</a>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;
