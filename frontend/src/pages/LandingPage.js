import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="bg-dark text-white text-center py-5">
                <Container>
                    <Row className="justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                        <Col lg={8}>
                            <h1 className="display-4 fw-bold mb-4"> Welcome to Cloud Based Attendance & Leave Management Portal</h1>
                            <p className="lead mb-5">
                                Streamline your workforce management with our secure, real-time attendance tracking and comprehensive dashboard solutions.
                            </p>
                            <div className="d-flex justify-content-center gap-3">
                                <Link to="/login">
                                    <Button variant="primary" size="lg" className="px-5 rounded-pill">Login</Button>
                                </Link>
                                <Link to="/signup">
                                    <Button variant="outline-light" size="lg" className="px-5 rounded-pill">Signup</Button>
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section className="py-5 bg-light">
                <Container>
                    <h2 className="text-center mb-5 fw-bold">Key Features</h2>
                    <Row>
                        <Col md={4} className="mb-4">
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Body className="text-center p-4">
                                    <div className="display-6 text-primary mb-3">
                                        <i className="bi bi-clock-history"></i>
                                    </div>
                                    <Card.Title className="fw-bold">Real-time Tracking</Card.Title>
                                    <Card.Text>
                                        Check-in and check-out instantly. View your attendance history with precise timestamps.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Body className="text-center p-4">
                                    <div className="display-6 text-success mb-3">
                                        <i className="bi bi-speedometer2"></i>
                                    </div>
                                    <Card.Title className="fw-bold">Employee Dashboard</Card.Title>
                                    <Card.Text>
                                        A personal space for employees to manage their profile, view status, and track daily progress.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Body className="text-center p-4">
                                    <div className="display-6 text-warning mb-3">
                                        <i className="bi bi-shield-lock"></i>
                                    </div>
                                    <Card.Title className="fw-bold">Admin Controls</Card.Title>
                                    <Card.Text>
                                        Powerful tools for administrators to oversee workforce data, generate reports, and manage departments.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Footer */}
            <footer className="bg-dark text-white text-center py-3">
                <Container>
                    <p className="mb-0">&copy; 2026 CBALMS. All rights reserved.</p>
                </Container>
            </footer>
        </div>
    );
};

export default LandingPage;
