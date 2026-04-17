import React, { useContext, useState, useEffect, useMemo, Suspense } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Row, Col, Card, Button, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import attendanceService from '../services/attendanceService';
import leaveService from '../services/leaveService';
import leaveBalanceService from '../services/leaveBalanceService';
import ThemeToggle from '../components/common/ThemeToggle';
import NotificationBell from '../components/common/NotificationBell';
import AttendanceStatsCards from '../components/employee/AttendanceStatsCards';
import useAttendanceStatus from '../hooks/useAttendanceStatus';
import useToast from '../hooks/useToast';
import { calculateWorkingDays } from '../utils/dateUtils';
import { getGreeting } from '../utils/helpers';

// Lazy-load ChartSection (contains heavy recharts dependency)
const ChartSection = React.lazy(() => import('../components/employee/ChartSection'));

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [attendanceStatus, setAttendanceStatus] = useState('Not Checked In');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverLeaveBalances, setServerLeaveBalances] = useState(null);

  const { canCheckIn, canCheckOut, isCheckedOut, reason, statusBadgeVariant } = useAttendanceStatus(leaveHistory, attendanceStatus);

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
      console.error('Error fetching server leave balances', error);
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
      console.error('Error fetching attendance data', error);
      toast.error('Failed to fetch attendance data');
      setLoading(false);
    }
  };

  const fetchLeaveHistory = async () => {
    try {
      const response = await leaveService.getMyLeaves();
      setLeaveHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching leave history', error);
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
        used: { Sick: usedMap.Sick || 0, Casual: usedMap.Casual || 0, Earned: usedMap.Earned || 0 }
      };
    }
    const used = { Sick: 0, Casual: 0, Earned: 0 };
    leaveHistory.forEach(leave => {
      if (leave.status === 'Approved' && used.hasOwnProperty(leave.leave_type)) {
        const days = calculateWorkingDays(leave.start_date, leave.end_date);
        used[leave.leave_type] += days;
      }
    });
    return { Sick: 0, Casual: 0, Earned: 0, total: 0, used };
  }, [leaveHistory, serverLeaveBalances]);

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

  const leaveUsageData = useMemo(() => {
    return [
      { name: 'Sick Used', value: leaveBalance.used.Sick, fill: '#EF4444' },
      { name: 'Casual Used', value: leaveBalance.used.Casual, fill: '#F59E0B' },
      { name: 'Earned Used', value: leaveBalance.used.Earned, fill: '#3B82F6' },
      { name: 'Remaining', value: leaveBalance.total, fill: '#10B981' }
    ].filter(d => d.value > 0);
  }, [leaveBalance]);

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

  return (
    <>
      {/* Header */}
      <div className="dashboard-header ds-header mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2 className="ds-title"><i className="bi bi-speedometer2 me-2"></i>Employee Dashboard</h2>
            <p className="mb-0 ds-subtitle">{getGreeting()}, {user ? user.name : 'User'}! ({user?.email})</p>
          </div>
          <div className="mt-3 mt-md-0 d-none d-lg-flex ds-header-actions align-items-center">
            <ThemeToggle />
            <NotificationBell />
            <OverlayTrigger placement="bottom" overlay={<Tooltip>View and edit your profile</Tooltip>}>
              <Button variant="info" className="ds-action-btn" onClick={() => navigate('/profile')} aria-label="My Profile">
                <i className="bi bi-person me-1"></i>My Profile
              </Button>
            </OverlayTrigger>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="content-card ds-surface mb-4" role="navigation" aria-label="Quick actions">
        <Card.Body className="py-3">
          <Row className="text-center g-2">
            <Col xs={6} md={3} className="mb-2 mb-md-0">
              <Button
                variant={canCheckIn ? 'success' : canCheckOut ? 'warning' : 'secondary'}
                className="w-100 py-2 ds-action-btn"
                onClick={canCheckIn ? handleCheckIn : canCheckOut ? handleCheckOut : undefined}
                disabled={!canCheckIn && !canCheckOut}
                aria-label={canCheckIn ? 'Check In' : canCheckOut ? 'Check Out' : 'Attendance Status'}
              >
                <i className={`bi ${canCheckIn ? 'bi-box-arrow-in-right' : canCheckOut ? 'bi-box-arrow-right' : 'bi-clock'} me-2`}></i>
                {canCheckIn ? 'Check In' : canCheckOut ? 'Check Out' : reason || (isCheckedOut ? 'Checked Out' : 'Check In')}
              </Button>
            </Col>
            <Col xs={6} md={3} className="mb-2 mb-md-0">
              <Button variant="outline-primary" className="w-100 py-2 ds-action-btn" onClick={() => navigate('/employee-dashboard/leaves')} aria-label="Apply for Leave">
                <i className="bi bi-calendar-plus me-2"></i>Apply Leave
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button variant="outline-info" className="w-100 py-2 ds-action-btn" onClick={() => navigate('/employee-dashboard/attendance')} aria-label="View Attendance">
                <i className="bi bi-list-check me-2"></i>Attendance
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button variant="outline-secondary" className="w-100 py-2 ds-action-btn" onClick={() => navigate('/employee-dashboard/holidays')} aria-label="View Holidays">
                <i className="bi bi-calendar-heart me-2"></i>Holidays
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

      {/* Charts Section - lazy loaded */}
      <Suspense fallback={<div className="text-center py-4 ds-surface ds-loading rounded-4"><Spinner animation="border" variant="primary" /><p className="text-muted mt-2 mb-0">Loading charts...</p></div>}>
        <ChartSection leaveUsageData={leaveUsageData} monthlyAttendanceData={monthlyAttendanceData} />
      </Suspense>
    </>
  );
};

export default EmployeeDashboard;
