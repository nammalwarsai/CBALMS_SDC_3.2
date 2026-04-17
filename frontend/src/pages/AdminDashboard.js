import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import attendanceService from '../services/attendanceService';
import leaveService from '../services/leaveService';
import Sidebar from '../components/layout/Sidebar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AdminStatsCards from '../components/admin/AdminStatsCards';
import EmployeeTable from '../components/admin/EmployeeTable';
import ThemeToggle from '../components/common/ThemeToggle';
import NotificationBell from '../components/common/NotificationBell';
import useToast from '../hooks/useToast';
import { formatDate } from '../utils/dateUtils';
import { getGreeting, arrayToCSV, downloadCSV } from '../utils/helpers';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayLeaves, setTodayLeaves] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeave: 0
  });
  const [showAttendanceListModal, setShowAttendanceListModal] = useState(false);
  const [attendanceListType, setAttendanceListType] = useState('');
  const [attendanceListData, setAttendanceListData] = useState([]);
  const [attendanceListLoading, setAttendanceListLoading] = useState(false);

  // Leave management states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTodayLeavesModal, setShowTodayLeavesModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveRemarks, setLeaveRemarks] = useState('');
const [processingLeave, setProcessingLeave] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState('Pending');

  const fetchDashboardStats = useCallback(async () => {
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
      toast.error('Failed to fetch dashboard stats');
    }
  }, [toast]);

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await adminService.getAllEmployees();
      setEmployees(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees", error);
      toast.error('Failed to fetch employees');
      setLoading(false);
    }
  }, [toast]);

  const fetchPendingLeaves = useCallback(async () => {
    try {
      const response = await leaveService.getAllLeaves('Pending');
      setPendingLeaves(response.data || []);
    } catch (error) {
      console.error("Error fetching pending leaves", error);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchDashboardStats();
    fetchPendingLeaves();
  }, [fetchEmployees, fetchDashboardStats, fetchPendingLeaves]);

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
    // UI-05: Show modal immediately with loading spinner
    setAttendanceListType(type);
    setAttendanceListData([]);
    setAttendanceListLoading(true);
    setShowAttendanceListModal(true);
    try {
      const response = await adminService.getAttendanceList(type);
      setAttendanceListData(response.data || []);
    } catch (error) {
      console.error(`Error fetching ${type} employees`, error);
      toast.error(`Failed to fetch ${type} employees`);
    } finally {
      setAttendanceListLoading(false);
    }
  };

  const handleLogout = () => {
    setConfirmConfig({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      variant: 'danger',
      icon: 'bi-box-arrow-right'
    });
    setConfirmAction(() => () => {
      logout();
      navigate('/login');
    });
    setShowConfirmDialog(true);
  };

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleViewDetails = async (employeeId) => {
    try {
      const details = await adminService.getEmployeeDetails(employeeId);
      setSelectedEmployee(details.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching employee details", error);
      toast.error('Failed to fetch employee details');
    }
  };
  const downloadReport = async (type) => {
    try {
      const [response, { default: jsPDF }, { default: autoTable }] = await Promise.all([
        adminService.getAttendanceReport(type),
        import('jspdf'),
        import('jspdf-autotable')
      ]);
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
      toast.success(`${type === 'daily' ? 'Daily' : 'Monthly'} report downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to download report');
    }
  };

  const exportEmployeesCSV = () => {
    const columns = [
      { key: 'full_name', label: 'Name' },
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'department', label: 'Department' },
      { key: 'mobile_number', label: 'Mobile' },
      { key: 'present_status_of_employee', label: 'Status' }
    ];
    const csv = arrayToCSV(employees, columns);
    downloadCSV(csv, `Employees_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Employee list exported!');
  };

  const downloadEmployeeHistory = async () => {
    if (!selectedEmployee) return;
    try {
      const [res, { default: jsPDF }, { default: autoTable }] = await Promise.all([
        attendanceService.getHistory(selectedEmployee.id),
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      const history = res.data || [];

      const doc = new jsPDF();
      doc.text(`Attendance History - ${selectedEmployee.full_name}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Employee ID: ${selectedEmployee.employee_id}`, 14, 22);

      const tableColumn = ["Date", "Check In", "Check Out", "Status"];
      const tableRows = history.map(r => [r.date, r.check_in || '-', r.check_out || '-', r.status]);

      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
      doc.save(`${selectedEmployee.full_name}_Attendance.pdf`);
      toast.success('Employee attendance history downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download employee history');
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
      toast.success('Leave approved successfully!');
      setLeaveRemarks('');
      await Promise.all([
        fetchAllLeaves(leaveFilter === 'All' ? null : leaveFilter),
        fetchPendingLeaves(),
        fetchDashboardStats()
      ]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve leave');
    } finally {
      setProcessingLeave(false);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      setProcessingLeave(true);
      await leaveService.rejectLeave(leaveId, leaveRemarks);
      toast.success('Leave rejected successfully!');
      setLeaveRemarks('');
      await Promise.all([
        fetchAllLeaves(leaveFilter === 'All' ? null : leaveFilter),
        fetchPendingLeaves(),
        fetchDashboardStats()
      ]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject leave');
    } finally {
      setProcessingLeave(false);
    }
  };

  return (
    <div className="d-flex ds-page-shell">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} isAdmin={true} collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

      {/* Main Content */}
      <div className="main-content flex-grow-1 ds-main-content">
        <Container fluid className={`mt-4 px-4 pb-4 dashboard-main-content ds-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {/* ── Admin Premium Hero Banner ── */}
          <div className="admin-hero-banner">
            <div className="admin-hero-overlay"></div>
            <div className="admin-hero-content">
              <div>
                <h1 className="admin-hero-title">
                  {getGreeting()}, {user ? user.name.split(' ')[0] : 'Admin'}!
                </h1>
                <p className="admin-hero-subtitle mb-0">
                  <i className="bi bi-shield-check me-2 text-warning"></i>
                  System Administrator &bull; Manage your organization's resources
                </p>
              </div>
              
              <div className="d-flex gap-3 mt-3 mt-md-0 flex-wrap">
                <div className="d-flex align-items-center gap-2 me-2">
                  <ThemeToggle />
                  <NotificationBell />
                </div>
                <Button variant="light" className="premium-badge text-dark fw-bold border-0 shadow-lg" onClick={() => navigate('/profile')} style={{ padding: '0.5rem 1rem' }}>
                  <i className="bi bi-person-circle fs-6 me-1"></i>Profile
                </Button>
                <Button variant="warning" className="premium-badge border-0 shadow-lg" onClick={handleOpenTodayLeavesModal} style={{ padding: '0.5rem 1rem' }}>
                  <i className="bi bi-calendar2-x fs-6 me-1"></i>Off Today <Badge bg="dark" className="ms-1">{dashboardStats.onLeave}</Badge>
                </Button>
                <Button variant="info" className="premium-badge text-white border-0 bg-info shadow-lg" onClick={handleOpenLeaveModal} style={{ padding: '0.5rem 1rem' }}>
                  <i className="bi bi-envelope-paper fs-6 me-1"></i>Leaves {pendingLeaves.length > 0 && <Badge bg="danger" className="ms-1">{pendingLeaves.length}</Badge>}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <AdminStatsCards
            loading={loading}
            dashboardStats={dashboardStats}
            onStatCardClick={handleStatCardClick}
            onOpenTodayLeavesModal={handleOpenTodayLeavesModal}
          />

          {/* Employee List Table */}
          <Row className="mb-4">
            <Col>
              <EmployeeTable
                employees={employees}
                loading={loading}
                onViewDetails={handleViewDetails}
                onExportCSV={exportEmployeesCSV}
                onDownloadReport={downloadReport}
              />
            </Col>
          </Row>

          {/* Employee Details Modal */}
          <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
            <Modal.Header closeButton className="ds-modal-header ds-modal-header--primary">
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
                       <Table size="sm" bordered className="ds-table">
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
                                <td>{formatDate(rec.date)}</td>
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
                      <Button variant="success" className="ds-action-btn" onClick={downloadEmployeeHistory}>
                        Download Full Attendance History
                      </Button>
                    </Col>
                  </Row>
                </Container>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" className="ds-action-btn" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Present/Absent Employees List Modal */}
          <Modal show={showAttendanceListModal} onHide={() => setShowAttendanceListModal(false)} size="lg">
            <Modal.Header
              closeButton
              className={`ds-modal-header ${attendanceListType === 'present' ? 'ds-modal-header--success' : 'ds-modal-header--danger'}`}
            >
              <Modal.Title>
                <i className={`bi ${attendanceListType === 'present' ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
                {attendanceListType === 'present' ? 'Present Today' : 'Absent Today'} ({attendanceListData.length})
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {attendanceListLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-3">Loading {attendanceListType} employees...</p>
                </div>
              ) : attendanceListData.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">
                    {attendanceListType === 'present'
                      ? 'No employees have checked in today yet.'
                      : 'All employees are present today!'}
                  </p>
                </div>
              ) : (
                <Table striped bordered hover responsive className="ds-table">
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
              <Button variant="secondary" className="ds-action-btn" onClick={() => setShowAttendanceListModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Leave Requests Management Modal */}
          <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)} size="xl">
            <Modal.Header closeButton className="ds-modal-header ds-modal-header--primary">
              <Modal.Title><i className="bi bi-envelope-paper me-2"></i>Leave Requests Management</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3 d-flex gap-2 ds-filter-group flex-wrap">
                <Button
                  variant={leaveFilter === 'Pending' ? 'warning' : 'outline-warning'}
                  className="ds-action-btn"
                  onClick={() => handleLeaveFilterChange('Pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={leaveFilter === 'Approved' ? 'success' : 'outline-success'}
                  className="ds-action-btn"
                  onClick={() => handleLeaveFilterChange('Approved')}
                >
                  Approved
                </Button>
                <Button
                  variant={leaveFilter === 'Rejected' ? 'danger' : 'outline-danger'}
                  className="ds-action-btn"
                  onClick={() => handleLeaveFilterChange('Rejected')}
                >
                  Rejected
                </Button>
                <Button
                  variant={leaveFilter === 'All' ? 'primary' : 'outline-primary'}
                  className="ds-action-btn"
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
                <Table striped bordered hover responsive className="ds-table">
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
                        <td>{formatDate(leave.start_date)}</td>
                        <td>{formatDate(leave.end_date)}</td>
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
                                  className="ds-action-btn"
                                  disabled={processingLeave}
                                  onClick={() => handleApproveLeave(leave.id)}
                                  aria-label={`Approve leave for ${leave.profiles?.full_name}`}
                                >
                                  <i className="bi bi-check-lg me-1"></i>Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  className="ds-action-btn"
                                  disabled={processingLeave}
                                  onClick={() => handleRejectLeave(leave.id)}
                                  aria-label={`Reject leave for ${leave.profiles?.full_name}`}
                                >
                                  <i className="bi bi-x-lg me-1"></i>Reject
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
              <Button variant="secondary" className="ds-action-btn" onClick={() => setShowLeaveModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Today's Leaves Modal */}
          <Modal show={showTodayLeavesModal} onHide={() => setShowTodayLeavesModal(false)} size="lg">
            <Modal.Header closeButton className="ds-modal-header ds-modal-header--warning">
              <Modal.Title><i className="bi bi-calendar-event me-2"></i>Today's Leaves ({todayLeaves.length})</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {todayLeaves.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No employees are on leave today.</p>
                </div>
              ) : (
                <Table striped bordered hover responsive className="ds-table">
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
                          {formatDate(leave.start_date)} to {formatDate(leave.end_date)}
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
              <Button variant="secondary" className="ds-action-btn" onClick={() => setShowTodayLeavesModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Confirm Dialog */}
          <ConfirmDialog
            show={showConfirmDialog}
            onHide={() => setShowConfirmDialog(false)}
            onConfirm={confirmAction || (() => { })}
            {...confirmConfig}
          />
        </Container>
      </div>
    </div>
  );
};

export default AdminDashboard;
