import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import adminService from '../services/adminService';
import attendanceService from '../services/attendanceService';
import leaveService from '../services/leaveService';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayLeaves, setTodayLeaves] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeave: 0
  });
  const [showAttendanceListModal, setShowAttendanceListModal] = useState(false);
  const [attendanceListType, setAttendanceListType] = useState('');
  const [attendanceListData, setAttendanceListData] = useState([]);
  
  // Leave management states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTodayLeavesModal, setShowTodayLeavesModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveRemarks, setLeaveRemarks] = useState('');
  const [processingLeave, setProcessingLeave] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState('Pending');

  useEffect(() => {
    fetchEmployees();
    fetchDashboardStats();
    fetchPendingLeaves();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await adminService.getDashboardStats();
      setDashboardStats(data.data || {
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        onLeave: 0
      });
    } catch (error) {
      console.error("Error fetching dashboard stats", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await adminService.getAllEmployees();
      setEmployees(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees", error);
      setLoading(false);
    }
  };

  const fetchPendingLeaves = async () => {
    try {
      const response = await leaveService.getAllLeaves('Pending');
      setPendingLeaves(response.data || []);
    } catch (error) {
      console.error("Error fetching pending leaves", error);
    }
  };

  const fetchAllLeaves = async (status = null) => {
    try {
      const response = await leaveService.getAllLeaves(status);
      setLeaveRequests(response.data || []);
    } catch (error) {
      console.error("Error fetching leaves", error);
    }
  };

  const fetchTodayLeaves = async () => {
    try {
      const response = await leaveService.getTodayLeaves();
      setTodayLeaves(response.data || []);
    } catch (error) {
      console.error("Error fetching today's leaves", error);
    }
  };

  const handleStatCardClick = async (type) => {
    try {
      const response = await adminService.getAttendanceList(type);
      setAttendanceListData(response.data || []);
      setAttendanceListType(type);
      setShowAttendanceListModal(true);
    } catch (error) {
      console.error(`Error fetching ${type} employees`, error);
      alert(`Failed to fetch ${type} employees`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewDetails = async (employeeId) => {
    try {
      const details = await adminService.getEmployeeDetails(employeeId);
      setSelectedEmployee(details.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching employee details", error);
    }
  };
  const downloadReport = async (type) => {
    try {
      const response = await adminService.getAttendanceReport(type);
      const data = response.data;
      const doc = new jsPDF();

      const title = type === 'daily' ? `Daily Attendance Report - ${new Date().toLocaleDateString()}` : `Monthly Attendance Report - Last 30 Days`;
      doc.text(title, 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

      // Define columns slightly differently based on type if needed, but standardizing helps
      const tableColumn = ["Name", "ID", "Dept", "Status", "Check In", "Check Out", "Date"];
      const tableRows = [];

      data.forEach(record => {
        let rowData;
        if (type === 'daily') {
          rowData = [
            record.full_name,
            record.employee_id,
            record.department,
            record.attendance_status,
            record.check_in,
            record.check_out,
            record.date
          ];
        } else {
          // Monthly
          rowData = [
            record.profiles?.full_name || 'N/A',
            record.profiles?.employee_id || '-',
            record.profiles?.department || '-',
            record.status,
            record.check_in || '-',
            record.check_out || '-',
            record.date
          ];
        }
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30
      });

      doc.save(`Admin_Report_${type}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (err) {
      console.error(err);
      alert("Failed to download report");
    }
  };

  const downloadEmployeeHistory = async () => {
    if (!selectedEmployee) return;
    try {
      const res = await attendanceService.getHistory(selectedEmployee.id);
      const history = res.data || [];

      const doc = new jsPDF();
      doc.text(`Attendance History - ${selectedEmployee.full_name}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Employee ID: ${selectedEmployee.employee_id}`, 14, 22);

      const tableColumn = ["Date", "Check In", "Check Out", "Status"];
      const tableRows = history.map(r => [r.date, r.check_in || '-', r.check_out || '-', r.status]);

      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
      doc.save(`${selectedEmployee.full_name}_Attendance.pdf`);

    } catch (err) {
      console.error(err);
      alert("Failed to download employee history");
    }
  };

  // Leave management handlers
  const handleOpenLeaveModal = async () => {
    await fetchAllLeaves(leaveFilter === 'All' ? null : leaveFilter);
    setShowLeaveModal(true);
  };

  const handleOpenTodayLeavesModal = async () => {
    await fetchTodayLeaves();
    setShowTodayLeavesModal(true);
  };

  const handleLeaveFilterChange = async (filter) => {
    setLeaveFilter(filter);
    await fetchAllLeaves(filter === 'All' ? null : filter);
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      setProcessingLeave(true);
      await leaveService.approveLeave(leaveId, leaveRemarks);
      alert('Leave approved successfully!');
      setLeaveRemarks('');
      await fetchAllLeaves(leaveFilter === 'All' ? null : leaveFilter);
      await fetchPendingLeaves();
      await fetchDashboardStats();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to approve leave');
    } finally {
      setProcessingLeave(false);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      setProcessingLeave(true);
      await leaveService.rejectLeave(leaveId, leaveRemarks);
      alert('Leave rejected successfully!');
      setLeaveRemarks('');
      await fetchAllLeaves(leaveFilter === 'All' ? null : leaveFilter);
      await fetchPendingLeaves();
      await fetchDashboardStats();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to reject leave');
    } finally {
      setProcessingLeave(false);
    }
  };

  return (
    <Container fluid className="mt-4 px-4">
      {/* Header */}
      {/* Header */}
      <div className="dashboard-header mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2>Admin Dashboard</h2>
            <p className="text-muted mb-0">Welcome, {user ? user.name : 'Admin'}! ({user?.email})</p>
          </div>
          <div className="mt-3 mt-md-0 d-flex gap-2 flex-wrap">
            <Button variant="warning" onClick={handleOpenTodayLeavesModal}>
              📅 Today's Leaves ({dashboardStats.onLeave})
            </Button>
            <Button variant="primary" onClick={handleOpenLeaveModal}>
              📋 Leave Requests {pendingLeaves.length > 0 && <Badge bg="danger" className="ms-1">{pendingLeaves.length}</Badge>}
            </Button>
            <Button variant="outline-primary" onClick={() => downloadReport('daily')}>
              Download Today's Report
            </Button>
            <Button variant="outline-success" onClick={() => downloadReport('monthly')}>
              Download Monthly Report
            </Button>
            <Button variant="info" className="ms-2" onClick={() => navigate('/profile')}>
              My Profile
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card text-center" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)', color: 'white' }}>
            <Card.Body>
              <h3>{dashboardStats.totalEmployees}</h3>
              <Card.Text>Total Employees</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card 
            className="stat-card text-center" 
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', cursor: 'pointer' }}
            onClick={() => handleStatCardClick('present')}
          >
            <Card.Body>
              <h3>{dashboardStats.presentToday}</h3>
              <Card.Text>Present Today</Card.Text>
              <small style={{ opacity: 0.8 }}>Click to view list</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card 
            className="stat-card text-center" 
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', cursor: 'pointer' }}
            onClick={handleOpenTodayLeavesModal}
          >
            <Card.Body>
              <h3>{dashboardStats.onLeave}</h3>
              <Card.Text>On Leave</Card.Text>
              <small style={{ opacity: 0.8 }}>Click to view list</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card 
            className="stat-card text-center" 
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: 'white', cursor: 'pointer' }}
            onClick={() => handleStatCardClick('absent')}
          >
            <Card.Body>
              <h3>{dashboardStats.absentToday}</h3>
              <Card.Text>Absent Today</Card.Text>
              <small style={{ opacity: 0.8 }}>Click to view list</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Employee List Table */}
      <Row className="mb-4">
        <Col>
          <Card className="content-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>All Employees</strong>
              <span className="badge bg-primary">{employees.length} Total</span>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading employees...</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Employee ID</th>
                      <th>Mobile</th>
                      <th>Current Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr><td colSpan="6" className="text-center text-muted py-4">No employees found</td></tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp.id}>
                          <td><strong>{emp.full_name}</strong></td>
                          <td>{emp.department}</td>
                          <td>{emp.employee_id}</td>
                          <td>{emp.mobile_number}</td>
                          <td>
                            <Badge bg={emp.present_status_of_employee === 'Present' ? 'success' : 'secondary'}>
                              {emp.present_status_of_employee || 'Absent'}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="info"
                              onClick={() => handleViewDetails(emp.id)}
                            >
                              View Details
                            </Button>
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

      {/* Employee Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Employee Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmployee && (
            <Container>
              <Row>
                <Col md={4} className="text-center mb-3">
                  <div className="profile-image-container mx-auto" style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.1)' }}>
                    {selectedEmployee.profile_photo ? (
                      <img
                        src={selectedEmployee.profile_photo}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100 bg-light text-muted">
                        No Photo
                      </div>
                    )}
                  </div>
                </Col>
                <Col md={8}>
                  <h4 className="mb-3">{selectedEmployee.full_name}</h4>
                  <p className="mb-2"><strong>Email:</strong> {selectedEmployee.email}</p>
                  <p className="mb-2"><strong>Employee ID:</strong> {selectedEmployee.employee_id}</p>
                  <p className="mb-2"><strong>Department:</strong> {selectedEmployee.department}</p>
                  <p className="mb-2"><strong>Mobile:</strong> {selectedEmployee.mobile_number}</p>
                  <p className="mb-2">
                    <strong>Current Status:</strong>{' '}
                    <Badge bg={selectedEmployee.present_status_of_employee === 'Present' ? 'success' : 'secondary'}>
                      {selectedEmployee.present_status_of_employee || 'Absent'}
                    </Badge>
                  </p>
                </Col>
              </Row>
              <Row className="mt-4">
                <Col>
                  <h5 className="mb-3">Recent Attendance</h5>
                  <Table size="sm" bordered>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployee.recentAttendance && selectedEmployee.recentAttendance.length > 0 ? (
                        selectedEmployee.recentAttendance.map((rec, idx) => (
                          <tr key={idx}>
                            <td>{rec.date}</td>
                            <td>{rec.check_in || '-'}</td>
                            <td>{rec.check_out || '-'}</td>
                            <td>
                              <Badge bg={rec.status === 'Present' ? 'success' : 'warning'}>
                                {rec.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" className="text-center text-muted">No recent records</td></tr>
                      )}
                    </tbody>
                  </Table>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col className="text-end">
                  <Button variant="success" onClick={downloadEmployeeHistory}>
                    Download Full Attendance History
                  </Button>
                </Col>
              </Row>
            </Container>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Present/Absent Employees List Modal */}
      <Modal show={showAttendanceListModal} onHide={() => setShowAttendanceListModal(false)} size="lg">
        <Modal.Header closeButton style={{ 
          background: attendanceListType === 'present' 
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
            : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', 
          color: 'white' 
        }}>
          <Modal.Title>
            {attendanceListType === 'present' ? '✓ Present Today' : '✗ Absent Today'} ({attendanceListData.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {attendanceListData.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">
                {attendanceListType === 'present' 
                  ? 'No employees have checked in today yet.' 
                  : 'All employees are present today!'}
              </p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Mobile</th>
                  {attendanceListType === 'present' && <th>Check In Time</th>}
                </tr>
              </thead>
              <tbody>
                {attendanceListData.map((emp, index) => (
                  <tr key={emp.id || index}>
                    <td>{index + 1}</td>
                    <td><strong>{emp.full_name}</strong></td>
                    <td>{emp.employee_id}</td>
                    <td>{emp.department}</td>
                    <td>{emp.mobile_number}</td>
                    {attendanceListType === 'present' && <td><Badge bg="success">{emp.check_in || '-'}</Badge></td>}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAttendanceListModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Leave Requests Management Modal */}
      <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)} size="xl">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: 'white' }}>
          <Modal.Title>📋 Leave Requests Management</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3 d-flex gap-2">
            <Button 
              variant={leaveFilter === 'Pending' ? 'warning' : 'outline-warning'}
              onClick={() => handleLeaveFilterChange('Pending')}
            >
              Pending
            </Button>
            <Button 
              variant={leaveFilter === 'Approved' ? 'success' : 'outline-success'}
              onClick={() => handleLeaveFilterChange('Approved')}
            >
              Approved
            </Button>
            <Button 
              variant={leaveFilter === 'Rejected' ? 'danger' : 'outline-danger'}
              onClick={() => handleLeaveFilterChange('Rejected')}
            >
              Rejected
            </Button>
            <Button 
              variant={leaveFilter === 'All' ? 'primary' : 'outline-primary'}
              onClick={() => handleLeaveFilterChange('All')}
            >
              All
            </Button>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No {leaveFilter !== 'All' ? leaveFilter.toLowerCase() : ''} leave requests found.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((leave, index) => (
                  <tr key={leave.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{leave.profiles?.full_name || 'N/A'}</strong>
                      <br />
                      <small className="text-muted">{leave.profiles?.employee_id}</small>
                    </td>
                    <td>{leave.profiles?.department || '-'}</td>
                    <td><Badge bg="info">{leave.leave_type}</Badge></td>
                    <td>{leave.start_date}</td>
                    <td>{leave.end_date}</td>
                    <td style={{ maxWidth: '200px' }}>
                      <small>{leave.reason || '-'}</small>
                    </td>
                    <td>
                      <Badge bg={
                        leave.status === 'Approved' ? 'success' : 
                        leave.status === 'Rejected' ? 'danger' : 'warning'
                      }>
                        {leave.status}
                      </Badge>
                    </td>
                    <td>
                      {leave.status === 'Pending' ? (
                        <div className="d-flex flex-column gap-1">
                          <div className="d-flex gap-1">
                            <Button 
                              size="sm" 
                              variant="success"
                              disabled={processingLeave}
                              onClick={() => handleApproveLeave(leave.id)}
                            >
                              ✓ Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="danger"
                              disabled={processingLeave}
                              onClick={() => handleRejectLeave(leave.id)}
                            >
                              ✗ Reject
                            </Button>
                          </div>
                          <Form.Control
                            size="sm"
                            type="text"
                            placeholder="Remarks (optional)"
                            value={selectedLeave === leave.id ? leaveRemarks : ''}
                            onChange={(e) => {
                              setSelectedLeave(leave.id);
                              setLeaveRemarks(e.target.value);
                            }}
                            onFocus={() => setSelectedLeave(leave.id)}
                          />
                        </div>
                      ) : (
                        <small className="text-muted">
                          {leave.admin_remarks || 'No remarks'}
                        </small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Today's Leaves Modal */}
      <Modal show={showTodayLeavesModal} onHide={() => setShowTodayLeavesModal(false)} size="lg">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white' }}>
          <Modal.Title>📅 Today's Leaves ({todayLeaves.length})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {todayLeaves.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No employees are on leave today.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Period</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {todayLeaves.map((leave, index) => (
                  <tr key={leave.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{leave.profiles?.full_name || 'N/A'}</strong>
                      <br />
                      <small className="text-muted">{leave.profiles?.employee_id}</small>
                    </td>
                    <td>{leave.profiles?.department || '-'}</td>
                    <td><Badge bg="warning" text="dark">{leave.leave_type}</Badge></td>
                    <td>
                      {leave.start_date} to {leave.end_date}
                    </td>
                    <td style={{ maxWidth: '250px' }}>
                      <small>{leave.reason || '-'}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTodayLeavesModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default AdminDashboard;
