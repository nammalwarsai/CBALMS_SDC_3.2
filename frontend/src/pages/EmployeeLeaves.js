import React, { useContext, useState, useEffect, useMemo } from 'react';
import { Row, Col, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import leaveService from '../services/leaveService';
import leaveBalanceService from '../services/leaveBalanceService';
import LeaveApplicationForm from '../components/employee/LeaveApplicationForm';
import LeaveHistoryTable from '../components/employee/LeaveHistoryTable';
import ThemeToggle from '../components/common/ThemeToggle';
import NotificationBell from '../components/common/NotificationBell';
import ConfirmDialog from '../components/common/ConfirmDialog';
import useToast from '../hooks/useToast';
import { calculateWorkingDays } from '../utils/dateUtils';

const EmployeeLeaves = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Sick',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [serverLeaveBalances, setServerLeaveBalances] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({});

  useEffect(() => {
    if (user?.id) {
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

  const fetchLeaveHistory = async () => {
    try {
      setLeaveLoading(true);
      const response = await leaveService.getMyLeaves();
      setLeaveHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching leave history', error);
      toast.error('Failed to fetch leave history');
    } finally {
      setLeaveLoading(false);
    }
  };

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

  const leaveDuration = useMemo(() => {
    if (leaveForm.startDate && leaveForm.endDate) {
      return calculateWorkingDays(leaveForm.startDate, leaveForm.endDate);
    }
    return 0;
  }, [leaveForm.startDate, leaveForm.endDate]);

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

  return (
    <>
      {/* Header */}
      <div className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2><i className="bi bi-calendar-plus me-2"></i>Leave Management</h2>
            <p className="text-muted mb-0">Apply for leaves and track your leave history</p>
          </div>
          <div className="mt-3 mt-md-0 d-none d-lg-flex gap-2 align-items-center">
            <ThemeToggle />
            <NotificationBell />
            <OverlayTrigger placement="bottom" overlay={<Tooltip>View and edit your profile</Tooltip>}>
              <Button variant="info" onClick={() => navigate('/profile')} aria-label="My Profile">
                <i className="bi bi-person me-1"></i>My Profile
              </Button>
            </OverlayTrigger>
          </div>
        </div>
      </div>

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

      {/* Confirm Dialog */}
      <ConfirmDialog
        show={showConfirmDialog}
        onHide={() => setShowConfirmDialog(false)}
        onConfirm={confirmAction || (() => {})}
        {...confirmConfig}
      />
    </>
  );
};

export default EmployeeLeaves;
