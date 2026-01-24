import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import adminService from '../services/adminService';
import attendanceService from '../services/attendanceService';

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
          <div className="mt-3 mt-md-0 d-flex gap-2">
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
              <h3>{employees.length}</h3>
              <Card.Text>Total Employees</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card text-center" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
            <Card.Body>
              <h3>--</h3>
              <Card.Text>Present Today</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card text-center" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white' }}>
            <Card.Body>
              <h3>--</h3>
              <Card.Text>On Leave</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card text-center" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: 'white' }}>
            <Card.Body>
              <h3>--</h3>
              <Card.Text>Absent Today</Card.Text>
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

    </Container>
  );
};

export default AdminDashboard;
