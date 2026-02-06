import React, { useContext, useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import attendanceService from '../services/attendanceService';
import leaveService from '../services/leaveService';
import CalendarComponent from '../components/CalendarComponent';
import Sidebar from '../components/layout/Sidebar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { StatCardSkeleton, TableRowSkeleton } from '../components/common/SkeletonLoaders';
import useAttendanceStatus from '../hooks/useAttendanceStatus';
import useToast from '../hooks/useToast';
import { calculateWorkingDays, getMinLeaveDate } from '../utils/dateUtils';
import { getGreeting, arrayToCSV, downloadCSV } from '../utils/helpers';

const LEAVE_POLICY = {
  Sick: 12,
  Casual: 10,
  Earned: 15
};

const EmployeeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [attendanceStatus, setAttendanceStatus] = useState('Not Checked In');
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

  // Confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({});

  // Use custom hook for attendance status logic
  const { canCheckIn, canCheckOut, isCheckedOut, reason, statusBadgeVariant } = useAttendanceStatus(leaveHistory, attendanceStatus);

  // Fetch initial data
  useEffect(() => {
    if (user?.id) {
      fetchAttendanceData();
      fetchLeaveHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAttendanceData = async () => {
    try {
      const [historyRes, statusRes] = await Promise.all([
        attendanceService.getHistory(user.id),
        attendanceService.getStatus(user.id)
      ]);

      setAttendanceHistory(historyRes.data || []);
      setAttendanceStatus(statusRes.status);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching attendance data", error);
      toast.error('Failed to fetch attendance data');
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
      toast.error('Failed to fetch leave history');
    } finally {
      setLeaveLoading(false);
    }
  };

  // Calculate leave balance
  const leaveBalance = useMemo(() => {
    const used = { Sick: 0, Casual: 0, Earned: 0 };
    leaveHistory.forEach(leave => {
      if (leave.status === 'Approved' && used.hasOwnProperty(leave.leave_type)) {
        const days = calculateWorkingDays(leave.start_date, leave.end_date);
        used[leave.leave_type] += days;
      }
    });
    return {
      Sick: Math.max(0, LEAVE_POLICY.Sick - used.Sick),
      Casual: Math.max(0, LEAVE_POLICY.Casual - used.Casual),
      Earned: Math.max(0, LEAVE_POLICY.Earned - used.Earned),
      total: Math.max(0, (LEAVE_POLICY.Sick + LEAVE_POLICY.Casual + LEAVE_POLICY.Earned) - (used.Sick + used.Casual + used.Earned)),
      used
    };
  }, [leaveHistory]);

  // Calculate days absent
  const daysAbsent = useMemo(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    let workingDays = 0;
    const current = new Date(startOfYear);
    while (current <= today) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) workingDays++;
      current.setDate(current.getDate() + 1);
    }
    const daysPresent = attendanceHistory.filter(r => r.status === 'Present').length;
    const leaveDays = leaveHistory
      .filter(l => l.status === 'Approved')
      .reduce((sum, l) => sum + calculateWorkingDays(l.start_date, l.end_date), 0);
    return Math.max(0, workingDays - daysPresent - leaveDays);
  }, [attendanceHistory, leaveHistory]);

  // Leave usage chart data
  const leaveUsageData = useMemo(() => {
    return [
      { name: 'Sick Used', value: leaveBalance.used.Sick, fill: '#EF4444' },
      { name: 'Casual Used', value: leaveBalance.used.Casual, fill: '#F59E0B' },
      { name: 'Earned Used', value: leaveBalance.used.Earned, fill: '#3B82F6' },
      { name: 'Remaining', value: leaveBalance.total, fill: '#10B981' }
    ].filter(d => d.value > 0);
  }, [leaveBalance]);

  // Monthly attendance summary
  const monthlyAttendanceData = useMemo(() => {
    const monthMap = {};
    attendanceHistory.forEach(record => {
      const month = record.date?.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { present: 0, absent: 0 };
      if (record.status === 'Present') monthMap[month].present++;
      else monthMap[month].absent++;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: month.substring(5),
        Present: data.present,
        Absent: data.absent
      }));
  }, [attendanceHistory]);

  // Leave duration display
  const leaveDuration = useMemo(() => {
    if (leaveForm.startDate && leaveForm.endDate) {
      return calculateWorkingDays(leaveForm.startDate, leaveForm.endDate);
    }
    return 0;
  }, [leaveForm.startDate, leaveForm.endDate]);

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

  const handleCheckIn = async () => {
    try {
      await attendanceService.checkIn(user.id);
      toast.success('Checked in successfully!');
      fetchAttendanceData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceService.checkOut(user.id);
      toast.success('Checked out successfully!');
      fetchAttendanceData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-out failed');
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();

    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      toast.error('End date must be after or equal to start date');
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

      toast.success('Leave application submitted successfully!');
      setLeaveForm({ leaveType: 'Sick', startDate: '', endDate: '', reason: '' });
      fetchLeaveHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit leave application');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleCancelLeave = (leaveId) => {
    setConfirmConfig({
      title: 'Cancel Leave',
      message: 'Are you sure you want to cancel this leave request?',
      confirmText: 'Cancel Leave',
      variant: 'danger',
      icon: 'bi-x-circle'
    });
    setConfirmAction(() => async () => {
      try {
        await leaveService.cancelLeave(leaveId);
        toast.success('Leave request cancelled successfully');
        fetchLeaveHistory();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to cancel leave request');
      }
    });
    setShowConfirmDialog(true);
  };

  const handleLeaveChange = (e) => {
    setLeaveForm({ ...leaveForm, [e.target.name]: e.target.value });
  };

  const generateAttendancePDF = () => {
    const doc = new jsPDF();
    doc.text(`${user ? user.name : 'Employee'} - Attendance Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableColumn = ["Date", "Check In", "Check Out", "Status"];
    const tableRows = attendanceHistory.map(record => ([
      record.date, record.check_in || '-', record.check_out || '-', record.status
    ]));

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
    doc.save(`Attendance_Report_${user ? user.name : 'Employee'}.pdf`);
    toast.success('Report downloaded successfully!');
  };

  const exportAttendanceCSV = () => {
    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'check_in', label: 'Check In' },
      { key: 'check_out', label: 'Check Out' },
      { key: 'status', label: 'Status' }
    ];
    const csv = arrayToCSV(attendanceHistory, columns);
    downloadCSV(csv, `Attendance_${user?.name || 'Employee'}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('CSV exported successfully!');
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} isAdmin={false} />

      {/* Main Content */}
      <div className="main-content flex-grow-1" style={{ marginLeft: '0' }}>
        <Container fluid className="mt-4 px-4 pb-4 dashboard-main-content">
          {/* Header */}
          <div className="dashboard-header">
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <div>
                <h2><i className="bi bi-speedometer2 me-2"></i>Employee Dashboard</h2>
                <p className="text-muted mb-0">{getGreeting()}, {user ? user.name : 'User'}! ({user?.email})</p>
              </div>
              <div className="mt-3 mt-md-0 d-none d-lg-block">
                <OverlayTrigger placement="bottom" overlay={<Tooltip>View and edit your profile</Tooltip>}>
                  <Button variant="info" className="me-2" onClick={() => navigate('/profile')} aria-label="My Profile">
                    <i className="bi bi-person me-1"></i>My Profile
                  </Button>
                </OverlayTrigger>
                <Button variant="danger" onClick={handleLogout} aria-label="Logout">
                  <i className="bi bi-box-arrow-right me-1"></i>Log Out
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="content-card mb-4" role="navigation" aria-label="Quick actions">
            <Card.Body className="py-3">
              <Row className="text-center">
                <Col xs={6} md={3} className="mb-2 mb-md-0">
                  <Button
                    variant={canCheckIn ? 'success' : canCheckOut ? 'warning' : 'secondary'}
                    className="w-100 py-2"
                    onClick={canCheckIn ? handleCheckIn : canCheckOut ? handleCheckOut : undefined}
                    disabled={!canCheckIn && !canCheckOut}
                    aria-label={canCheckIn ? 'Check In' : canCheckOut ? 'Check Out' : 'Attendance Status'}
                  >
                    <i className={`bi ${canCheckIn ? 'bi-box-arrow-in-right' : canCheckOut ? 'bi-box-arrow-right' : 'bi-clock'} me-2`}></i>
                    {canCheckIn ? 'Check In' : canCheckOut ? 'Check Out' : reason || (isCheckedOut ? 'Checked Out' : 'Check In')}
                  </Button>
                </Col>
                <Col xs={6} md={3} className="mb-2 mb-md-0">
                  <Button variant="outline-primary" className="w-100 py-2" onClick={() => document.getElementById('leave-form-section')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Apply for Leave">
                    <i className="bi bi-calendar-plus me-2"></i>Apply Leave
                  </Button>
                </Col>
                <Col xs={6} md={3}>
                  <Button variant="outline-info" className="w-100 py-2" onClick={() => document.getElementById('attendance-history-section')?.scrollIntoView({ behavior: 'smooth' })} aria-label="View Attendance">
                    <i className="bi bi-list-check me-2"></i>Attendance
                  </Button>
                </Col>
                <Col xs={6} md={3}>
                  <Button variant="outline-secondary" className="w-100 py-2" onClick={() => navigate('/profile')} aria-label="Update Profile">
                    <i className="bi bi-person-gear me-2"></i>Profile
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Stats Cards */}
          <Row className="mb-4">
            <Col md={6} lg={3} className="mb-3">
              <Card className="stat-card text-center">
                <Card.Body>
                  <div className="mb-2"><i className="bi bi-clock-fill text-primary" style={{ fontSize: '1.5rem' }}></i></div>
                  <Badge bg={statusBadgeVariant} className="px-3 py-2 mb-2" style={{ fontSize: '0.9rem' }}>
                    {attendanceStatus}
                  </Badge>
                  <Card.Text className="text-muted small text-uppercase mt-1">Today's Status</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3} className="mb-3">
              {loading ? <StatCardSkeleton /> : (
                <Card className="stat-card text-center" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: 'white' }}>
                  <Card.Body>
                    <div className="mb-2"><i className="bi bi-calendar-check" style={{ fontSize: '1.5rem' }}></i></div>
                    <h3>{leaveBalance.total}</h3>
                    <Card.Text style={{ opacity: 0.9 }}>Leave Balance</Card.Text>
                    <small style={{ opacity: 0.7 }}>S:{leaveBalance.Sick} | C:{leaveBalance.Casual} | E:{leaveBalance.Earned}</small>
                  </Card.Body>
                </Card>
              )}
            </Col>
            <Col md={6} lg={3} className="mb-3">
              {loading ? <StatCardSkeleton /> : (
                <Card className="stat-card text-center" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
                  <Card.Body>
                    <div className="mb-2"><i className="bi bi-check-circle" style={{ fontSize: '1.5rem' }}></i></div>
                    <h3>{attendanceHistory.filter(r => r.status === 'Present').length}</h3>
                    <Card.Text>Days Present</Card.Text>
                  </Card.Body>
                </Card>
              )}
            </Col>
            <Col md={6} lg={3} className="mb-3">
              {loading ? <StatCardSkeleton /> : (
                <Card className="stat-card text-center" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: 'white' }}>
                  <Card.Body>
                    <div className="mb-2"><i className="bi bi-x-circle" style={{ fontSize: '1.5rem' }}></i></div>
                    <h3>{daysAbsent}</h3>
                    <Card.Text>Days Absent</Card.Text>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>

          {/* Charts Section */}
          <Row className="mb-4">
            <Col lg={6} className="mb-3">
              <Card className="content-card h-100">
                <Card.Header><i className="bi bi-pie-chart me-2"></i><strong>Leave Usage Breakdown</strong></Card.Header>
                <Card.Body className="d-flex align-items-center justify-content-center">
                  {leaveUsageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={leaveUsageData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                          {leaveUsageData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted"><i className="bi bi-info-circle me-2"></i>No leave data available yet</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-3">
              <Card className="content-card h-100">
                <Card.Header><i className="bi bi-bar-chart me-2"></i><strong>Monthly Attendance Summary</strong></Card.Header>
                <Card.Body>
                  {monthlyAttendanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyAttendanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="Present" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted text-center"><i className="bi bi-info-circle me-2"></i>No monthly data available yet</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Leave Form and History */}
          <Row>
            <Col lg={6} className="mb-4" id="leave-form-section">
              <Card className="content-card">
                <Card.Header>
                  <i className="bi bi-calendar-plus me-2"></i><strong>Apply for Leave</strong>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleLeaveSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Leave Type</Form.Label>
                      <Form.Select name="leaveType" value={leaveForm.leaveType} onChange={handleLeaveChange} aria-label="Leave type">
                        <option value="Sick">Sick Leave (Balance: {leaveBalance.Sick})</option>
                        <option value="Casual">Casual Leave (Balance: {leaveBalance.Casual})</option>
                        <option value="Earned">Earned Leave (Balance: {leaveBalance.Earned})</option>
                      </Form.Select>
                    </Form.Group>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Start Date</Form.Label>
                          <Form.Control type="date" name="startDate" required min={getMinLeaveDate()} value={leaveForm.startDate} onChange={handleLeaveChange} aria-label="Leave start date" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>End Date</Form.Label>
                          <Form.Control type="date" name="endDate" required min={leaveForm.startDate || getMinLeaveDate()} value={leaveForm.endDate} onChange={handleLeaveChange} aria-label="Leave end date" />
                        </Form.Group>
                      </Col>
                    </Row>
                    {leaveDuration > 0 && (
                      <div className="mb-3 p-2 bg-light rounded text-center" aria-live="polite">
                        <small className="text-muted">Duration: </small>
                        <Badge bg="info">{leaveDuration} working day{leaveDuration > 1 ? 's' : ''}</Badge>
                      </div>
                    )}
                    <Form.Group className="mb-4">
                      <Form.Label>Reason</Form.Label>
                      <Form.Control as="textarea" rows={3} name="reason" required maxLength={500} value={leaveForm.reason} onChange={handleLeaveChange} placeholder="Please provide a reason for your leave" aria-label="Leave reason" />
                      <small className="text-muted">{leaveForm.reason.length}/500</small>
                    </Form.Group>
                    <Button type="submit" variant="primary" className="w-100" disabled={submittingLeave}>
                      {submittingLeave ? (
                        <><Spinner animation="border" size="sm" className="me-2" />Submitting...</>
                      ) : (
                        <><i className="bi bi-send me-2"></i>Submit Leave Request</>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card className="content-card">
                <Card.Header><i className="bi bi-clock-history me-2"></i><strong>Leave History</strong></Card.Header>
                <Card.Body>
                  {leaveLoading ? (
                    <Table striped bordered hover responsive><thead><tr><th>Type</th><th>Start</th><th>End</th><th>Status</th><th>Action</th></tr></thead><tbody><TableRowSkeleton columns={5} rows={3} /></tbody></Table>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Table striped bordered hover>
                        <thead><tr><th>Type</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                          {leaveHistory.length === 0 ? (
                            <tr><td colSpan="5" className="text-center text-muted py-4"><i className="bi bi-inbox me-2"></i>No leave history found</td></tr>
                          ) : (
                            leaveHistory.map((leave) => (
                              <tr key={leave.id}>
                                <td><Badge bg="info">{leave.leave_type}</Badge></td>
                                <td>{leave.start_date}</td>
                                <td>{leave.end_date}</td>
                                <td>
                                  <Badge bg={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'danger' : 'warning'}>
                                    {leave.status}
                                  </Badge>
                                </td>
                                <td>
                                  {leave.status === 'Pending' ? (
                                    <Button size="sm" variant="outline-danger" onClick={() => handleCancelLeave(leave.id)} aria-label={`Cancel leave request`}>
                                      <i className="bi bi-x-circle me-1"></i>Cancel
                                    </Button>
                                  ) : (
                                    <span className="text-muted small">{leave.admin_remarks || '-'}</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Calendar Section */}
          <Row className="mb-4">
            <Col>
              <CalendarComponent attendanceHistory={attendanceHistory} leaveHistory={leaveHistory} />
            </Col>
          </Row>

          {/* Attendance History */}
          <Row id="attendance-history-section">
            <Col>
              <Card className="content-card">
                <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
                  <strong><i className="bi bi-list-check me-2"></i>Attendance History</strong>
                  <div className="d-flex gap-2 mt-2 mt-md-0">
                    <Button variant="outline-success" size="sm" onClick={exportAttendanceCSV} aria-label="Export as CSV">
                      <i className="bi bi-filetype-csv me-1"></i>CSV
                    </Button>
                    <Button variant="primary" size="sm" onClick={generateAttendancePDF} aria-label="Download PDF Report">
                      <i className="bi bi-file-pdf me-1"></i>PDF
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <Table striped bordered hover responsive><thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead><tbody><TableRowSkeleton columns={4} rows={5} /></tbody></Table>
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
                        <tbody>
                          {attendanceHistory.length === 0 ? (
                            <tr><td colSpan="4" className="text-center text-muted py-4"><i className="bi bi-inbox me-2"></i>No attendance records found</td></tr>
                          ) : (
                            attendanceHistory.map((record, index) => (
                              <tr key={index}>
                                <td>{record.date}</td>
                                <td>{record.check_in || '-'}</td>
                                <td>{record.check_out || '-'}</td>
                                <td><Badge bg={record.status === 'Present' ? 'success' : 'warning'}>{record.status}</Badge></td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        show={showConfirmDialog}
        onHide={() => setShowConfirmDialog(false)}
        onConfirm={confirmAction || (() => {})}
        {...confirmConfig}
      />
    </div>
  );
};

export default EmployeeDashboard;
