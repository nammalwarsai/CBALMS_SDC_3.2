import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    const features = [
        {
            icon: 'bi-clock-history',
            color: 'primary',
            title: 'Real-time Tracking',
            description: 'Check-in and check-out instantly. View your attendance history with precise timestamps.'
        },
        {
            icon: 'bi-speedometer2',
            color: 'success',
            title: 'Employee Dashboard',
            description: 'A personal space for employees to manage their profile, view status, and track daily progress.'
        },
        {
            icon: 'bi-shield-lock',
            color: 'warning',
            title: 'Admin Controls',
            description: 'Powerful tools for administrators to oversee workforce data, generate reports, and manage departments.'
        },
        {
            icon: 'bi-calendar-check',
            color: 'info',
            title: 'Leave Management',
            description: 'Apply for leaves, track balances, and get instant approvals with our streamlined leave workflow.'
        },
        {
            icon: 'bi-graph-up',
            color: 'danger',
            title: 'Analytics & Reports',
            description: 'Comprehensive reports with visual charts for attendance trends, leave usage, and workforce insights.'
        },
        {
            icon: 'bi-cloud-check',
            color: 'secondary',
            title: 'Cloud-Based',
            description: 'Access from anywhere, anytime. Your data is securely stored in the cloud with real-time sync.'
        }
    ];

    const testimonials = [
        {
            name: 'Dr. Rahul Sharma',
            role: 'HOD, Computer Science',
            quote: 'CBALMS has simplified our department\'s attendance tracking. The admin dashboard gives me instant visibility.'
        },
        {
            name: 'Priya Patel',
            role: 'Senior Faculty',
            quote: 'The leave management system is intuitive. I can apply and track leaves without any paperwork.'
        },
        {
            name: 'Arun Kumar',
            role: 'IT Administrator',
            quote: 'Setting up and managing the system was seamless. The reports feature saves us hours every month.'
        }
    ];

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section text-white text-center py-5" style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #4338CA 100%)',
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center'
            }}>
                <Container>
                    <Row className="justify-content-center align-items-center">
                        <Col lg={8} className="animate-fade-in">
                            <div className="mb-4">
                                <i className="bi bi-cloud-check" style={{ fontSize: '4rem', opacity: 0.9 }}></i>
                            </div>
                            <h1 className="display-4 fw-bold mb-4">
                                Cloud Based Attendance & Leave Management Portal
                            </h1>
                            <p className="lead mb-5" style={{ opacity: 0.9, fontSize: '1.2rem' }}>
                                Streamline your workforce management with our secure, real-time attendance tracking and comprehensive dashboard solutions.
                            </p>
                            <div className="d-flex justify-content-center gap-3 flex-wrap">
                                <Link to="/login">
                                    <Button variant="light" size="lg" className="px-5 rounded-pill fw-bold" style={{ color: '#4F46E5' }}>
                                        <i className="bi bi-box-arrow-in-right me-2"></i>Login
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button variant="outline-light" size="lg" className="px-5 rounded-pill fw-bold">
                                        <i className="bi bi-person-plus me-2"></i>Signup
                                    </Button>
                                </Link>
                            </div>
                            {/* Trust badges */}
                            <div className="mt-5 d-flex justify-content-center gap-4 flex-wrap" style={{ opacity: 0.8 }}>
                                <span><i className="bi bi-shield-check me-1"></i>Secure</span>
                                <span><i className="bi bi-cloud-check me-1"></i>Cloud Based</span>
                                <span><i className="bi bi-phone me-1"></i>Mobile Friendly</span>
                                <span><i className="bi bi-lightning me-1"></i>Real-time</span>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section className="py-5 bg-light">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="fw-bold mb-3">
                            <i className="bi bi-stars text-primary me-2"></i>Key Features
                        </h2>
                        <p className="text-muted">Everything you need for effective attendance and leave management</p>
                    </div>
                    <Row>
                        {features.map((feature, index) => (
                            <Col md={4} className="mb-4" key={index}>
                                <Card className={`h-100 shadow-sm border-0 feature-card stagger-item stagger-delay-${index + 1}`}>
                                    <Card.Body className="text-center p-4">
                                        <div className={`display-6 text-${feature.color} mb-3`}>
                                            <i className={`bi ${feature.icon}`}></i>
                                        </div>
                                        <Card.Title className="fw-bold">{feature.title}</Card.Title>
                                        <Card.Text className="text-muted">
                                            {feature.description}
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Testimonials Section */}
            <section className="py-5">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="fw-bold mb-3">
                            <i className="bi bi-chat-quote text-primary me-2"></i>What People Say
                        </h2>
                        <p className="text-muted">Trusted by faculty and staff across departments</p>
                    </div>
                    <Row>
                        {testimonials.map((testimonial, index) => (
                            <Col md={4} className="mb-4" key={index}>
                                <Card className="h-100 border-0 shadow-sm">
                                    <Card.Body className="p-4">
                                        <div className="mb-3 text-warning">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className="bi bi-star-fill me-1"></i>
                                            ))}
                                        </div>
                                        <Card.Text className="mb-3 fst-italic text-muted">
                                            "{testimonial.quote}"
                                        </Card.Text>
                                        <div className="d-flex align-items-center">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{
                                                width: 40, height: 40,
                                                background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                                                color: 'white', fontWeight: 700, fontSize: '0.85rem'
                                            }}>
                                                {testimonial.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                            </div>
                                            <div>
                                                <strong>{testimonial.name}</strong>
                                                <br />
                                                <small className="text-muted">{testimonial.role}</small>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* CTA Section */}
            <section className="py-5 text-white text-center" style={{
                background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)'
            }}>
                <Container>
                    <h3 className="fw-bold mb-3">Ready to Get Started?</h3>
                    <p className="mb-4" style={{ opacity: 0.8 }}>Join hundreds of employees already using CBALMS</p>
                    <Link to="/signup">
                        <Button variant="primary" size="lg" className="px-5 rounded-pill fw-bold">
                            Create Free Account
                        </Button>
                    </Link>
                </Container>
            </section>

            {/* Footer */}
            <footer className="bg-dark text-white text-center py-4">
                <Container>
                    <p className="mb-1">&copy; 2026 CBALMS. All rights reserved.</p>
                    <small className="text-muted">Cloud Based Attendance & Leave Management System</small>
                </Container>
            </footer>
        </div>
    );
};

export default LandingPage;
