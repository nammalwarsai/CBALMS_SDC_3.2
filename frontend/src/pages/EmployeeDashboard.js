import React, { useContext, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import attendanceService from '../services/attendanceService';
import leaveService from '../services/leaveService';
import CalendarComponent from '../components/CalendarComponent';

const EmployeeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('Not Checked In'); // 'Not Checked In', 'Checked In', 'Checked Out'
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
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
      fetchLeaveHistory();
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

  const fetchLeaveHistory = async () => {
    try {
      setLeaveLoading(true);
      const response = await leaveService.getMyLeaves();
      setLeaveHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching leave history", error);
    } finally {
      setLeaveLoading(false);
    }
  };

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

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();

    // Validate dates
    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      alert('End date must be after or equal to start date');
      return;
    }

    try {
      setSubmittingLeave(true);
      await leaveService.applyLeave({
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason
      });

      alert('Leave application submitted successfully!');
      setLeaveForm({
        leaveType: 'Sick',
        startDate: '',
        endDate: '',
        reason: ''
      });

      // Refresh leave history
      fetchLeaveHistory();
    } catch (error) {
      console.error('Leave application error:', error);
      alert(error.response?.data?.error || 'Failed to submit leave application');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      await leaveService.cancelLeave(leaveId);
      alert('Leave request cancelled successfully');
      fetchLeaveHistory();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cancel leave request');
    }
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
              {(() => {
                // Check if today is a leave day
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${day}`;

                // Weekend Check
                const todayDate = new Date();
                const dayOfWeek = todayDate.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                  return (
                    <div className="d-flex flex-column align-items-center">
                      <Button variant="secondary" size="lg" disabled>
                        Weekend
                      </Button>
                      <small className="text-danger mt-2 fw-bold">
                        Check-in disabled on weekends.
                      </small>
                    </div>
                  );
                }

                const isOnLeave = leaveHistory.some(l => {
                  const start = new Date(l.start_date);
                  const end = new Date(l.end_date);
                  const current = new Date(todayStr);
                  return current >= start && current <= end && l.status === 'Approved';
                });

                if (isOnLeave) {
                  return (
                    <div className="d-flex flex-column align-items-center">
                      <Button variant="secondary" size="lg" disabled>
                        Leave Period
                      </Button>
                      <small className="text-danger mt-2 fw-bold">
                        You cannot check in during leave.
                      </small>
                    </div>
                  );
                }

                if (attendanceStatus === 'Checked In') {
                  return (
                    <Button variant="warning" size="lg" onClick={handleCheckOut}>
                      Check Out
                    </Button>
                  );
                } else if (attendanceStatus === 'Not Checked In') {
                  return (
                    <Button variant="success" size="lg" onClick={handleCheckIn}>
                      Check In
                    </Button>
                  );
                } else {
                  return (
                    <Button variant="secondary" size="lg" disabled>
                      Checked Out
                    </Button>
                  );
                }
              })()}
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
                <Button type="submit" variant="primary" className="w-100" disabled={submittingLeave}>
                  {submittingLeave ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Leave Request'
                  )}
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
              {leaveLoading ? (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveHistory.length === 0 ? (
                      <tr><td colSpan="5" className="text-center text-muted">No leave history found</td></tr>
                    ) : (
                      leaveHistory.map((leave) => (
                        <tr key={leave.id}>
                          <td>{leave.leave_type}</td>
                          <td>{leave.start_date}</td>
                          <td>{leave.end_date}</td>
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
                                variant="outline-danger"
                                onClick={() => handleCancelLeave(leave.id)}
                              >
                                Cancel
                              </Button>
                            )}
                            {leave.status !== 'Pending' && (
                              <span className="text-muted small">
                                {leave.admin_remarks || '-'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Calendar Section - START */}
      <Row className="mb-4">
        <Col>
          <CalendarComponent
            attendanceHistory={attendanceHistory}
            leaveHistory={leaveHistory}
          />
        </Col>
      </Row>
      {/* Calendar Section - END */}

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
