import React, { useContext, useState, useEffect } from 'react';
import { Row, Col, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import attendanceService from '../services/attendanceService';
import leaveService from '../services/leaveService';
import CalendarComponent from '../components/CalendarComponent';
import AttendanceHistoryTable from '../components/employee/AttendanceHistoryTable';
import ThemeToggle from '../components/common/ThemeToggle';
import NotificationBell from '../components/common/NotificationBell';
import useAttendanceStatus from '../hooks/useAttendanceStatus';
import useToast from '../hooks/useToast';
import { arrayToCSV, downloadCSV } from '../utils/helpers';

const EmployeeAttendance = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [attendanceStatus, setAttendanceStatus] = useState('Not Checked In');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const { canCheckIn, canCheckOut, isCheckedOut, reason, statusBadgeVariant } = useAttendanceStatus(leaveHistory, attendanceStatus);

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

  const generateAttendancePDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const doc = new jsPDF();
    doc.text(`${user ? user.name : 'Employee'} - Attendance Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    const tableColumn = ['Date', 'Check In', 'Check Out', 'Status'];
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
    <>
      {/* Header */}
      <div className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2><i className="bi bi-list-check me-2"></i>Attendance</h2>
            <p className="text-muted mb-0">Track your attendance, check in/out, and export reports</p>
          </div>
          <div className="mt-3 mt-md-0 d-none d-lg-flex gap-2 align-items-center">
            <ThemeToggle />
            <NotificationBell />
            <Button
              variant={canCheckIn ? 'success' : canCheckOut ? 'warning' : 'secondary'}
              onClick={canCheckIn ? handleCheckIn : canCheckOut ? handleCheckOut : undefined}
              disabled={!canCheckIn && !canCheckOut}
              aria-label={canCheckIn ? 'Check In' : canCheckOut ? 'Check Out' : 'Attendance Status'}
            >
              <i className={`bi ${canCheckIn ? 'bi-box-arrow-in-right' : canCheckOut ? 'bi-box-arrow-right' : 'bi-clock'} me-2`}></i>
              {canCheckIn ? 'Check In' : canCheckOut ? 'Check Out' : reason || (isCheckedOut ? 'Checked Out' : 'Check In')}
            </Button>
            <OverlayTrigger placement="bottom" overlay={<Tooltip>View and edit your profile</Tooltip>}>
              <Button variant="info" onClick={() => navigate('/profile')} aria-label="My Profile">
                <i className="bi bi-person me-1"></i>My Profile
              </Button>
            </OverlayTrigger>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <Row className="mb-4">
        <Col>
          <CalendarComponent attendanceHistory={attendanceHistory} leaveHistory={leaveHistory} />
        </Col>
      </Row>

      {/* Attendance History */}
      <Row>
        <Col>
          <AttendanceHistoryTable
            attendanceHistory={attendanceHistory}
            loading={loading}
            onExportCSV={exportAttendanceCSV}
            onGeneratePDF={generateAttendancePDF}
          />
        </Col>
      </Row>
    </>
  );
};

export default EmployeeAttendance;
