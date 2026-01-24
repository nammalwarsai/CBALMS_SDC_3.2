import React, { useContext, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Table, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import attendanceService from '../services/attendanceService';

const EmployeeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('Not Checked In'); // 'Not Checked In', 'Checked In', 'Checked Out'
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Sick',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Fetch initial data
  useEffect(() => {
    if (user?.id) {
      fetchAttendanceData();
    }
  }, [user]);

  const fetchAttendanceData = async () => {
    try {
      const [historyRes, statusRes] = await Promise.all([
        attendanceService.getHistory(user.id),
        attendanceService.getStatus(user.id)
      ]);

      setAttendanceHistory(historyRes.data || []);
      setAttendanceStatus(statusRes.status);
      setIsCheckedIn(statusRes.status === 'Checked In');
      setLoading(false);
    } catch (error) {
      console.error("Error fetching attendance data", error);
      setLoading(false);
    }
  };

  // Mock data for leave history (Task only mentioned removing dummy data for attendance? Or all? "remove all the dummy data in the .../employee-dashboard". I should handle leave history too but I don't have backend for leaves yet. I will keep mock leave for now or clear it to empty array if instructed STRICTLY "remove all dummy data". The request says "remove all the dummy data". I'll clear it.)
  const leaveHistory = [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCheckIn = async () => {
    try {
      await attendanceService.checkIn(user.id);
      alert('Checked in successfully!');
      fetchAttendanceData(); // Refresh data
    } catch (error) {
      alert(error.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceService.checkOut(user.id);
      alert('Checked out successfully!');
      fetchAttendanceData();
    } catch (error) {
      alert(error.response?.data?.error || 'Check-out failed');
    }
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

  const generateAttendancePDF = () => {
    const doc = new jsPDF();
    doc.text(`${user ? user.name : 'Employee'} - Attendance Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableColumn = ["Date", "Check In", "Check Out", "Status"];
    const tableRows = [];

    attendanceHistory.forEach(record => {
      const rowData = [
        record.date,
        record.check_in || '-',
        record.check_out || '-',
        record.status
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30
    });

    doc.save(`Attendance_Report_${user ? user.name : 'Employee'}.pdf`);
  };

  return (
    <Container fluid className="mt-4 px-4">
      {/* Header */}
      <div className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2>Employee Dashboard</h2>
            <p className="text-muted mb-0">Welcome, {user ? user.name : 'User'}! ({user?.email})</p>
          </div>
          <div className="mt-3 mt-md-0">
            <Button variant="info" className="me-2" onClick={() => navigate('/profile')}>
              My Profile
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card text-center">
            <Card.Body>
              <Card.Title className="mb-3">Check In/Out</Card.Title>
              {attendanceStatus === 'Checked In' ? (
                <Button variant="warning" size="lg" onClick={handleCheckOut}>
                  Check Out
                </Button>
              ) : attendanceStatus === 'Not Checked In' ? (
                <Button variant="success" size="lg" onClick={handleCheckIn}>
                  Check In
                </Button>
              ) : (
                <Button variant="secondary" size="lg" disabled>
                  Checked Out
                </Button>
              )}
              <p className="mt-3 mb-0">
                <Badge bg={
                  attendanceStatus === 'Checked In' ? 'success' :
                    attendanceStatus === 'Checked Out' ? 'danger' : 'secondary'
                }>
                  {attendanceStatus}
                </Badge>
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card text-center bg-light">
            <Card.Body>
              <h3>--</h3>
              <Card.Text className="text-muted">Leave Balance</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card text-center" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
            <Card.Body>
              <h3>{attendanceHistory.filter(r => r.status === 'Present').length}</h3>
              <Card.Text>Days Present</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card text-center bg-light">
            <Card.Body>
              <h3>--</h3>
              <Card.Text className="text-muted">Days Absent</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Leave Form and History */}
      <Row>
        <Col lg={6} className="mb-4">
          <Card className="content-card">
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
                <Form.Group className="mb-4">
                  <Form.Label>Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="reason"
                    required
                    value={leaveForm.reason}
                    onChange={handleLeaveChange}
                    placeholder="Please provide a reason for your leave"
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100">
                  Submit Leave Request
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="content-card">
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
                  {leaveHistory.length === 0 ? (
                    <tr><td colSpan="4" className="text-center text-muted">No leave history found</td></tr>
                  ) : (
                    leaveHistory.map((leave, index) => (
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
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Attendance History */}
      <Row>
        <Col>
          <Card className="content-card">


            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Attendance History</strong>
              <Button variant="primary" size="sm" onClick={generateAttendancePDF}>
                Download Report
              </Button>
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
                  {attendanceHistory.length === 0 ? (
                    <tr><td colSpan="4" className="text-center text-muted">No attendance records found</td></tr>
                  ) : (
                    attendanceHistory.map((record, index) => (
                      <tr key={index}>
                        <td>{record.date}</td>
                        <td>{record.check_in || '-'}</td>
                        <td>{record.check_out || '-'}</td>
                        <td>
                          <Badge bg={record.status === 'Present' ? 'success' : 'warning'}>
                            {record.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
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
