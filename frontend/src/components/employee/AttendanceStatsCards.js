import React from 'react';
import { Row, Col, Badge } from 'react-bootstrap';
import DashboardStatCard from '../common/DashboardStatCard';

/**
 * Attendance stats cards for the employee dashboard (CQ-01 extraction)
 */
const AttendanceStatsCards = ({
  loading,
  attendanceStatus,
  statusBadgeVariant,
  leaveBalance,
  attendanceHistory,
  daysAbsent
}) => {
  const daysPresent = attendanceHistory.filter(r => r.status === 'Present').length;

  return (
    <Row className="mb-4">
      <Col md={6} lg={3} className="mb-3">
        <DashboardStatCard
          variant="neutral"
          icon="bi-clock-fill"
          value={<Badge bg={statusBadgeVariant} className="px-3 py-2">{attendanceStatus}</Badge>}
          label="Today's Status"
          ariaLabel={`Today's Status: ${attendanceStatus}`}
        />
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <DashboardStatCard
          loading={loading}
          variant="primary"
          icon="bi-calendar-check"
          value={leaveBalance.total}
          label="Leave Balance"
          hint={`S:${leaveBalance.Sick} | C:${leaveBalance.Casual} | E:${leaveBalance.Earned}`}
          ariaLabel={`Leave Balance: ${leaveBalance.total}`}
        />
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <DashboardStatCard
          loading={loading}
          variant="success"
          icon="bi-check-circle"
          value={daysPresent}
          label="Days Present"
          ariaLabel={`Days Present: ${daysPresent}`}
        />
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <DashboardStatCard
          loading={loading}
          variant="danger"
          icon="bi-x-circle"
          value={daysAbsent}
          label="Days Absent"
          ariaLabel={`Days Absent: ${daysAbsent}`}
        />
      </Col>
    </Row>
  );
};

export default AttendanceStatsCards;
