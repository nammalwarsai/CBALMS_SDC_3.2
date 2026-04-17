import React from 'react';
import { Row, Col } from 'react-bootstrap';
import DashboardStatCard from '../common/DashboardStatCard';

/**
 * Admin dashboard stat cards with click handlers (CQ-01 extraction)
 */
const AdminStatsCards = ({ loading, dashboardStats, onStatCardClick, onOpenTodayLeavesModal }) => {
  return (
    <Row className="mb-4">
      <Col md={6} lg={3} className="mb-3">
        <DashboardStatCard
          loading={loading}
          variant="primary"
          icon="bi-people-fill"
          value={dashboardStats.totalEmployees}
          label="Total Employees"
          ariaLabel={`Total Employees: ${dashboardStats.totalEmployees}`}
        />
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <DashboardStatCard
          variant="success"
          icon="bi-check-circle"
          value={dashboardStats.presentToday}
          label="Present Today"
          hint="Click to view list"
          onClick={() => onStatCardClick('present')}
          aria-label={`Present Today: ${dashboardStats.presentToday}. Click to view list`}
        />
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <DashboardStatCard
          variant="warning"
          icon="bi-calendar-x"
          value={dashboardStats.onLeave}
          label="On Leave"
          hint="Click to view list"
          onClick={onOpenTodayLeavesModal}
          aria-label={`On Leave: ${dashboardStats.onLeave}. Click to view list`}
        />
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <DashboardStatCard
          variant="danger"
          icon="bi-x-circle"
          value={dashboardStats.absentToday}
          label="Absent Today"
          hint="Click to view list"
          onClick={() => onStatCardClick('absent')}
          aria-label={`Absent Today: ${dashboardStats.absentToday}. Click to view list`}
        />
      </Col>
    </Row>
  );
};

export default AdminStatsCards;
