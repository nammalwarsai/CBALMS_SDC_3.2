import React from 'react';
import { Card, Form, Row, Col, Badge, Button, Spinner } from 'react-bootstrap';
import { getMinLeaveDate } from '../../utils/dateUtils';

/**
 * Leave application form component (CQ-01 extraction)
 */
const LeaveApplicationForm = ({
  leaveForm,
  leaveBalance,
  leaveDuration,
  submittingLeave,
  onLeaveChange,
  onLeaveSubmit
}) => {
  return (
    <Card className="content-card">
      <Card.Header>
        <i className="bi bi-calendar-plus me-2"></i><strong>Apply for Leave</strong>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={onLeaveSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Leave Type</Form.Label>
            <Form.Select name="leaveType" value={leaveForm.leaveType} onChange={onLeaveChange} aria-label="Leave type">
              <option value="Sick">Sick Leave (Balance: {leaveBalance.Sick})</option>
              <option value="Casual">Casual Leave (Balance: {leaveBalance.Casual})</option>
              <option value="Earned">Earned Leave (Balance: {leaveBalance.Earned})</option>
            </Form.Select>
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control type="date" name="startDate" required min={getMinLeaveDate()} value={leaveForm.startDate} onChange={onLeaveChange} aria-label="Leave start date" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control type="date" name="endDate" required min={leaveForm.startDate || getMinLeaveDate()} value={leaveForm.endDate} onChange={onLeaveChange} aria-label="Leave end date" />
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
            <Form.Control as="textarea" rows={3} name="reason" required maxLength={500} value={leaveForm.reason} onChange={onLeaveChange} placeholder="Please provide a reason for your leave" aria-label="Leave reason" />
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
  );
};

export default LeaveApplicationForm;
