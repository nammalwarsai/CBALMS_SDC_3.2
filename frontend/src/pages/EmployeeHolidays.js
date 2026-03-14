import React, { useContext, useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import holidayService from '../services/holidayService';
import ThemeToggle from '../components/common/ThemeToggle';
import NotificationBell from '../components/common/NotificationBell';

const EmployeeHolidays = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchHolidays();
    }
  }, [user]);

  const fetchHolidays = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await holidayService.getHolidays(currentYear);
      setHolidays(response.data || []);
    } catch (error) {
      console.error('Error fetching holidays', error);
    }
  };

  const renderHolidayTable = (filteredHolidays) => (
    <Table striped bordered hover responsive size="sm">
      <thead>
        <tr>
          <th style={{ width: '40px' }}>#</th>
          <th>Holiday Name</th>
          <th>Date</th>
          <th>Day</th>
        </tr>
      </thead>
      <tbody>
        {filteredHolidays.map((holiday, index) => {
          const d = new Date(holiday.date + 'T00:00:00');
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isPast = d < today;
          const isToday = d.getTime() === today.getTime();
          return (
            <tr key={holiday.id} className={isToday ? 'table-success' : isPast ? 'text-muted' : ''}>
              <td>{index + 1}</td>
              <td>
                <strong>{holiday.name}</strong>
                {isToday && <Badge bg="success" className="ms-2">Today</Badge>}
              </td>
              <td>{d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
              <td><Badge bg={isPast ? 'secondary' : 'info'}>{dayName}</Badge></td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  const publicHolidays = holidays.filter(h => h.type !== 'bonus');
  const bonusHolidays = holidays.filter(h => h.type === 'bonus');

  return (
    <>
      {/* Header */}
      <div className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2><i className="bi bi-calendar-heart me-2"></i>Holidays</h2>
            <p className="text-muted mb-0">View public and bonus holidays for {new Date().getFullYear()}</p>
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

      {/* Public Holidays */}
      <Row className="mb-4">
        <Col>
          <Card className="content-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-calendar-heart me-2"></i>
                <strong>Public Holidays - {new Date().getFullYear()}</strong>
              </div>
              <Badge bg="primary" pill>{publicHolidays.length} holidays</Badge>
            </Card.Header>
            <Card.Body>
              {publicHolidays.length === 0 ? (
                <p className="text-muted text-center mb-0">
                  <i className="bi bi-info-circle me-2"></i>No public holidays configured for this year.
                </p>
              ) : (
                renderHolidayTable(publicHolidays)
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bonus Holidays */}
      {bonusHolidays.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card className="content-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-gift me-2"></i>
                  <strong>Bonus Holidays - {new Date().getFullYear()}</strong>
                </div>
                <Badge bg="warning" text="dark" pill>{bonusHolidays.length} holidays</Badge>
              </Card.Header>
              <Card.Body>
                {renderHolidayTable(bonusHolidays)}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Legend */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex flex-wrap gap-3 align-items-center px-2 py-2 bg-light rounded small text-muted">
            <span><i className="bi bi-info-circle me-1"></i><strong>Legend:</strong></span>
            <span><Badge bg="secondary" className="me-1">Day</Badge> Grey / dimmed row = Past holiday</span>
            <span><Badge bg="success" className="me-1">Today</Badge> Green highlighted row = Today&apos;s holiday</span>
            <span><Badge bg="info" className="me-1">Day</Badge> Blue badge = Upcoming holiday</span>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default EmployeeHolidays;
