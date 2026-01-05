import React, { useContext, useState } from 'react';
import { jsPDF } from 'jspdf';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Table, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Sick',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Mock data for attendance history
  const attendanceHistory = [
    { date: '2025-12-20', checkIn: '09:00 AM', checkOut: '05:30 PM', status: 'Present' },
    { date: '2025-12-19', checkIn: '09:15 AM', checkOut: '05:45 PM', status: 'Late' },
    { date: '2025-12-18', checkIn: '09:00 AM', checkOut: '05:30 PM', status: 'Present' },
  ];

  // Mock data for leave history
  const leaveHistory = [
    { type: 'Sick', startDate: '2025-12-10', endDate: '2025-12-11', status: 'Approved' },
    { type: 'Casual', startDate: '2025-12-05', endDate: '2025-12-05', status: 'Pending' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    alert('Checked in successfully!');
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    alert('Checked out successfully!');
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();

    // Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Leave Request Application", 20, 20);

    doc.setFontSize(12);
    doc.text(`Employee Name: ${user ? user.name : 'N/A'}`, 20, 40);
    doc.text(`Employee ID: ${user ? user.employeeId : 'N/A'}`, 20, 50);
    doc.text(`Department: ${user ? user.department : 'N/A'}`, 20, 60);

    doc.text(`Leave Type: ${leaveForm.leaveType}`, 20, 80);
    doc.text(`Start Date: ${leaveForm.startDate}`, 20, 90);
    doc.text(`End Date: ${leaveForm.endDate}`, 20, 100);
    doc.text(`Reason:`, 20, 120);
    doc.text(leaveForm.reason, 20, 130);

    doc.save(`leave_request_${leaveForm.startDate}.pdf`);

    alert('Leave application submitted successfully! PDF downloaded.');
    setLeaveForm({
      leaveType: 'Sick',
      startDate: '',
      endDate: '',
      reason: ''
    });
  };

  const handleLeaveChange = (e) => {
    setLeaveForm({
      ...leaveForm,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Employee Dashboard</h2>
            <div>
              <Button variant="info" className="me-2" onClick={() => navigate('/profile')}>
                My Profile
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          </div>
          <p className="text-muted">Welcome, {user ? user.name : 'User'}! ({user?.email})</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Check In/Out</Card.Title>
              {!isCheckedIn ? (
                <Button variant="success" onClick={handleCheckIn}>
                  Check In
                </Button>
              ) : (
                <Button variant="warning" onClick={handleCheckOut}>
                  Check Out
                </Button>
              )}
              <p className="mt-2 mb-0">
                <Badge bg={isCheckedIn ? 'success' : 'secondary'}>
                  {isCheckedIn ? 'Checked In' : 'Not Checked In'}
                </Badge>
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <h3>12</h3>
              <Card.Text className="text-muted">Leave Balance</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <h3>22</h3>
              <Card.Text className="text-muted">Days Present</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <h3>2</h3>
              <Card.Text className="text-muted">Days Absent</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <strong>Apply for Leave</strong>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleLeaveSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Leave Type</Form.Label>
                  <Form.Select
                    name="leaveType"
                    value={leaveForm.leaveType}
                    onChange={handleLeaveChange}
                  >
                    <option value="Sick">Sick Leave</option>
                    <option value="Casual">Casual Leave</option>
                    <option value="Earned">Earned Leave</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    required
                    value={leaveForm.startDate}
                    onChange={handleLeaveChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    required
                    value={leaveForm.endDate}
                    onChange={handleLeaveChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="reason"
                    required
                    value={leaveForm.reason}
                    onChange={handleLeaveChange}
                  />
                </Form.Group>
                <Button type="submit" variant="primary">
                  Submit Leave Request
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <strong>Leave History</strong>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveHistory.map((leave, index) => (
                    <tr key={index}>
                      <td>{leave.type}</td>
                      <td>{leave.startDate}</td>
                      <td>{leave.endDate}</td>
                      <td>
                        <Badge bg={leave.status === 'Approved' ? 'success' : 'warning'}>
                          {leave.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <strong>Attendance History</strong>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((record, index) => (
                    <tr key={index}>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>
                        <Badge bg={record.status === 'Present' ? 'success' : 'warning'}>
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EmployeeDashboard;
