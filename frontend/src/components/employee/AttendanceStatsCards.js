import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { StatCardSkeleton } from '../common/SkeletonLoaders';

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
              <h3>{daysPresent}</h3>
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
  );
};

export default AttendanceStatsCards;
