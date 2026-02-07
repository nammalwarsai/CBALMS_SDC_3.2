import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { StatCardSkeleton } from '../common/SkeletonLoaders';

/**
 * Admin dashboard stat cards with click handlers (CQ-01 extraction)
 */
const AdminStatsCards = ({ loading, dashboardStats, onStatCardClick, onOpenTodayLeavesModal }) => {
  return (
    <Row className="mb-4">
      <Col md={6} lg={3} className="mb-3">
        {loading ? <StatCardSkeleton /> : (
          <Card className="stat-card text-center" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)', color: 'white' }}>
            <Card.Body>
              <div className="mb-2"><i className="bi bi-people-fill" style={{ fontSize: '1.5rem' }}></i></div>
              <h3>{dashboardStats.totalEmployees}</h3>
              <Card.Text>Total Employees</Card.Text>
            </Card.Body>
          </Card>
        )}
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <Card
          className="stat-card text-center"
          style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', cursor: 'pointer' }}
          onClick={() => onStatCardClick('present')}
          role="button"
          aria-label={`Present Today: ${dashboardStats.presentToday}. Click to view list`}
        >
          <Card.Body>
            <div className="mb-2"><i className="bi bi-check-circle" style={{ fontSize: '1.5rem' }}></i></div>
            <h3>{dashboardStats.presentToday}</h3>
            <Card.Text>Present Today</Card.Text>
            <small style={{ opacity: 0.8 }}>Click to view list</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <Card
          className="stat-card text-center"
          style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', cursor: 'pointer' }}
          onClick={onOpenTodayLeavesModal}
          role="button"
          aria-label={`On Leave: ${dashboardStats.onLeave}. Click to view list`}
        >
          <Card.Body>
            <div className="mb-2"><i className="bi bi-calendar-x" style={{ fontSize: '1.5rem' }}></i></div>
            <h3>{dashboardStats.onLeave}</h3>
            <Card.Text>On Leave</Card.Text>
            <small style={{ opacity: 0.8 }}>Click to view list</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <Card
          className="stat-card text-center"
          style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: 'white', cursor: 'pointer' }}
          onClick={() => onStatCardClick('absent')}
          role="button"
          aria-label={`Absent Today: ${dashboardStats.absentToday}. Click to view list`}
        >
          <Card.Body>
            <div className="mb-2"><i className="bi bi-x-circle" style={{ fontSize: '1.5rem' }}></i></div>
            <h3>{dashboardStats.absentToday}</h3>
            <Card.Text>Absent Today</Card.Text>
            <small style={{ opacity: 0.8 }}>Click to view list</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default AdminStatsCards;
