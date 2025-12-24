import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [adminComment, setAdminComment] = useState('');

  // Mock data for pending leave requests
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, employee: 'John Doe', type: 'Sick', startDate: '2025-12-25', endDate: '2025-12-26', reason: 'Fever', status: 'Pending' },
    { id: 2, employee: 'Jane Smith', type: 'Casual', startDate: '2025-12-27', endDate: '2025-12-27', reason: 'Personal work', status: 'Pending' },
    { id: 3, employee: 'Bob Johnson', type: 'Earned', startDate: '2025-12-30', endDate: '2026-01-02', reason: 'Vacation', status: 'Pending' },
  ]);

  // Mock data for attendance
  const attendanceData = [
    { employee: 'John Doe', date: '2025-12-20', checkIn: '09:00 AM', checkOut: '05:30 PM', status: 'Present' },
    { employee: 'Jane Smith', date: '2025-12-20', checkIn: '09:15 AM', checkOut: '05:45 PM', status: 'Late' },
    { employee: 'Bob Johnson', date: '2025-12-20', checkIn: '09:00 AM', checkOut: '05:30 PM', status: 'Present' },
    { employee: 'Alice Williams', date: '2025-12-20', checkIn: '-', checkOut: '-', status: 'Absent' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleApproveLeave = (leave) => {
    setSelectedLeave(leave);
    setShowApprovalModal(true);
  };

  const handleLeaveAction = (action) => {
    const updatedRequests = leaveRequests.map(leave => 
      leave.id === selectedLeave.id 
        ? { ...leave, status: action === 'approve' ? 'Approved' : 'Rejected' }
        : leave
    );
    setLeaveRequests(updatedRequests);
    setShowApprovalModal(false);
    setAdminComment('');
    alert(`Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
  };

  const handleGenerateReport = () => {
    alert('Generating attendance report...');
  };

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Admin Dashboard</h2>
            <div>
              <Button variant="info" className="me-2" onClick={() => navigate('/profile')}>
                My Profile
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          </div>
          <p className="text-muted">Welcome, {user ? user.name : 'Admin'}! ({user?.email})</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center bg-primary text-white">
            <Card.Body>
              <h3>48</h3>
              <Card.Text>Total Employees</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <h3>42</h3>
              <Card.Text>Present Today</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center bg-warning text-white">
            <Card.Body>
              <h3>3</h3>
              <Card.Text>Pending Leaves</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center bg-danger text-white">
            <Card.Body>
              <h3>6</h3>
              <Card.Text>Absent Today</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Pending Leave Requests</strong>
              <Badge bg="warning">{leaveRequests.filter(l => l.status === 'Pending').length} Pending</Badge>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.employee}</td>
                      <td>{leave.type}</td>
                      <td>{leave.startDate}</td>
                      <td>{leave.endDate}</td>
                      <td>{leave.reason}</td>
                      <td>
                        <Badge bg={
                          leave.status === 'Approved' ? 'success' : 
                          leave.status === 'Rejected' ? 'danger' : 'warning'
                        }>
                          {leave.status}
                        </Badge>
                      </td>
                      <td>
                        {leave.status === 'Pending' && (
                          <Button 
                            size="sm" 
                            variant="primary" 
                            onClick={() => handleApproveLeave(leave)}
                          >
                            Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Today's Attendance</strong>
              <Button size="sm" variant="success" onClick={handleGenerateReport}>
                Generate Report
              </Button>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((record, index) => (
                    <tr key={index}>
                      <td>{record.employee}</td>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>
                        <Badge bg={
                          record.status === 'Present' ? 'success' : 
                          record.status === 'Late' ? 'warning' : 'danger'
                        }>
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

      {/* Leave Approval Modal */}
      <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Review Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLeave && (
            <>
              <p><strong>Employee:</strong> {selectedLeave.employee}</p>
              <p><strong>Leave Type:</strong> {selectedLeave.type}</p>
              <p><strong>Duration:</strong> {selectedLeave.startDate} to {selectedLeave.endDate}</p>
              <p><strong>Reason:</strong> {selectedLeave.reason}</p>
              <Form.Group className="mb-3">
                <Form.Label>Admin Comment (Optional)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Add any comments..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleLeaveAction('reject')}>
            Reject
          </Button>
          <Button variant="success" onClick={() => handleLeaveAction('approve')}>
            Approve
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
