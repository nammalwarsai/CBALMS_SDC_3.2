import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
// Assuming attendanceService has a method to get all today's attendance or we use adminService for it?
// The controller `attendanceController` didn't have `getAllToday` explicitly shown in my previous `view_file` (it had checkIn, checkOut, getHistory, getStatus).
// I might need to add `getAllAttendance(date)` to backend or use `adminService` to fetch it if I added it there.
// Checking adminRoutes.js: router.get('/employees', ...); router.get('/employees/:id', ...).
// It seems I am missing an endpoint to get "Today's Attendance" for ALL employees.
// I will check attendanceController again in my thought process... it didn't have it.
// I'll add `getTodayAttendance` to attendanceController and route.
// For now, I will comment out the fetching of today's attendance until I add the backend support or I'll just fetch employees and show their status if available.
// actually I can filter employees who have attendance today if I fetch strict "today's attendance".
// Let's implement Employee Table first as primarily requested.

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]); // Keep empty for now as backend missing
  const [attendanceData, setAttendanceData] = useState([]); // Keep empty until backend API added

  useEffect(() => {
    fetchEmployees();
  }, []);

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

      {/* Stats Row (Placeholders for now until aggregation API exists) */}
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center bg-primary text-white">
            <Card.Body>
              <h3>{employees.length}</h3>
              <Card.Text>Total Employees</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <h3>--</h3>
              <Card.Text>Present Today</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Employee List Table */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <strong>All Employees</strong>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center"><Spinner animation="border" /></div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Employee ID</th>
                      <th>Mobile</th>
                      <th>Current Status Of Employee </th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr><td colSpan="6" className="text-center">No employees found</td></tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp.id}>
                          <td>{emp.full_name}</td>
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
                  <div
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      backgroundColor: '#e9ecef',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {selectedEmployee.profile_photo ? (
                      <img
                        src={selectedEmployee.profile_photo}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span className="text-muted">Photo</span>
                    )}
                  </div>
                </Col>
                <Col md={8}>
                  <h4>{selectedEmployee.full_name}</h4>
                  <p><strong>Email:</strong> {selectedEmployee.email}</p>
                  <p><strong>Employee ID:</strong> {selectedEmployee.employee_id}</p>
                  <p><strong>Department:</strong> {selectedEmployee.department}</p>
                  <p><strong>Mobile:</strong> {selectedEmployee.mobile_number}</p>
                  <p><strong>Current Status Of Employee:</strong> {selectedEmployee.present_status_of_employee || 'Absent'}</p>
                </Col>
              </Row>
              <Row className="mt-4">
                <Col>
                  <h5>Recent Attendance</h5>
                  <Table size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>In</th>
                        <th>Out</th>
                        <th>Status For today</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployee.recentAttendance && selectedEmployee.recentAttendance.length > 0 ? (
                        selectedEmployee.recentAttendance.map((rec, idx) => (
                          <tr key={idx}>
                            <td>{rec.date}</td>
                            <td>{rec.check_in || '-'}</td>
                            <td>{rec.check_out || '-'}</td>
                            <td>{rec.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4">No recent records</td></tr>
                      )}
                    </tbody>
                  </Table>
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

    </Container>
  );
};

export default AdminDashboard;
