import React, { useContext, useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import attendanceService from '../services/attendanceService';
import leaveService from '../services/leaveService';
import leaveBalanceService from '../services/leaveBalanceService';
import CalendarComponent from '../components/CalendarComponent';
import Sidebar from '../components/layout/Sidebar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import BackToTop from '../components/common/BackToTop';
import AttendanceStatsCards from '../components/employee/AttendanceStatsCards';
import ChartSection from '../components/employee/ChartSection';
import LeaveApplicationForm from '../components/employee/LeaveApplicationForm';
import LeaveHistoryTable from '../components/employee/LeaveHistoryTable';
import AttendanceHistoryTable from '../components/employee/AttendanceHistoryTable';
import useAttendanceStatus from '../hooks/useAttendanceStatus';
import useToast from '../hooks/useToast';
import { calculateWorkingDays } from '../utils/dateUtils';
import { getGreeting, arrayToCSV, downloadCSV } from '../utils/helpers';

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
  const [serverLeaveBalances, setServerLeaveBalances] = useState(null);

  // Confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Use custom hook for attendance status logic
  const { canCheckIn, canCheckOut, isCheckedOut, reason, statusBadgeVariant } = useAttendanceStatus(leaveHistory, attendanceStatus);

  // Fetch initial data
  useEffect(() => {
    if (user?.id) {
      fetchAttendanceData();
      fetchLeaveHistory();
      fetchServerLeaveBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchServerLeaveBalances = async () => {
    try {
      const response = await leaveBalanceService.getMyBalances();
      if (response.data && response.data.length > 0) {
        setServerLeaveBalances(response.data);
      }
    } catch (error) {
      console.error("Error fetching server leave balances", error);
      // Fall back to local calculation
    }
  };

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

  // Calculate leave balance (CQ-09: uses server data only, no hardcoded policy)
  const leaveBalance = useMemo(() => {
    if (serverLeaveBalances && serverLeaveBalances.length > 0) {
      const balanceMap = {};
      const usedMap = {};
      let totalRemaining = 0;

      serverLeaveBalances.forEach(b => {
        balanceMap[b.leave_type] = b.remaining_days;
        usedMap[b.leave_type] = b.used_days;
        totalRemaining += b.remaining_days;
      });

      return {
        Sick: balanceMap.Sick || 0,
        Casual: balanceMap.Casual || 0,
        Earned: balanceMap.Earned || 0,
        total: totalRemaining,
        used: {
          Sick: usedMap.Sick || 0,
          Casual: usedMap.Casual || 0,
          Earned: usedMap.Earned || 0
        }
      };
    }

    // Fallback: derive from leave history (no hardcoded limits)
    const used = { Sick: 0, Casual: 0, Earned: 0 };
    leaveHistory.forEach(leave => {
      if (leave.status === 'Approved' && used.hasOwnProperty(leave.leave_type)) {
        const days = calculateWorkingDays(leave.start_date, leave.end_date);
        used[leave.leave_type] += days;
      }
    });
    return {
      Sick: 0,
      Casual: 0,
      Earned: 0,
      total: 0,
      used
    };
  }, [leaveHistory, serverLeaveBalances]);

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
      await attendanceService.checkIn();
      toast.success('Checked in successfully!');
      fetchAttendanceData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceService.checkOut();
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
      fetchServerLeaveBalances();
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
        fetchServerLeaveBalances();
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
      <Sidebar user={user} onLogout={handleLogout} isAdmin={false} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className="main-content flex-grow-1" style={{ marginLeft: '0' }}>
        <Container fluid className={`mt-4 px-4 pb-4 dashboard-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
          <AttendanceStatsCards
            loading={loading}
            attendanceStatus={attendanceStatus}
            statusBadgeVariant={statusBadgeVariant}
            leaveBalance={leaveBalance}
            attendanceHistory={attendanceHistory}
            daysAbsent={daysAbsent}
          />

          {/* Charts Section */}
          <ChartSection leaveUsageData={leaveUsageData} monthlyAttendanceData={monthlyAttendanceData} />

          {/* Leave Form and History */}
          <Row>
            <Col lg={6} className="mb-4" id="leave-form-section">
              <LeaveApplicationForm
                leaveForm={leaveForm}
                leaveBalance={leaveBalance}
                leaveDuration={leaveDuration}
                submittingLeave={submittingLeave}
                onLeaveChange={handleLeaveChange}
                onLeaveSubmit={handleLeaveSubmit}
              />
            </Col>

            <Col lg={6} className="mb-4">
              <LeaveHistoryTable
                leaveHistory={leaveHistory}
                leaveLoading={leaveLoading}
                onCancelLeave={handleCancelLeave}
              />
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
              <AttendanceHistoryTable
                attendanceHistory={attendanceHistory}
                loading={loading}
                onExportCSV={exportAttendanceCSV}
                onGeneratePDF={generateAttendancePDF}
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Back to Top (UI-08) */}
      <BackToTop />

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
