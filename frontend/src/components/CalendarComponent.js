import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Card, Badge, Row, Col } from 'react-bootstrap';

const CalendarComponent = ({ attendanceHistory, leaveHistory }) => {

    // Helper to get status for a date
    const getTileClassName = ({ date, view }) => {
        if (view !== 'month') return '';

        // FIX: Enforce IST (Indian Standard Time)
        // 'en-CA' format is YYYY-MM-DD
        const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // Check attendance (Prioritize present)
        const attendance = attendanceHistory.find(r => r.date === dateStr);
        if (attendance && attendance.status === 'Present') {
            return 'calendar-present';
        }

        // Check leaves
        const leave = leaveHistory.find(l => {
            const start = new Date(l.start_date);
            const end = new Date(l.end_date);
            const current = new Date(dateStr);
            // Reset times for accurate comparison
            return current >= start && current <= end && l.status === 'Approved';
        });

        if (leave) {
            return 'calendar-leave';
        }

        // Check for Absent (Past dates, not weekend, not present, not on leave)
        const dayOfWeek = date.getDay();
        const today = new Date();
        // Compare dates without time
        const currentCheck = new Date(dateStr);
        const todayCheck = new Date(today.toISOString().split('T')[0]);

        if (currentCheck < todayCheck) {
            // Exclude weekends (0=Sun, 6=Sat)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                return 'calendar-absent';
            }
        }

        return '';
    };

    return (
        <Card className="content-card h-100">
            <Card.Header>
                <strong>My Attendance Calendar</strong>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center">
                <div className="calendar-container mb-3 w-100">
                    <Calendar
                        tileClassName={getTileClassName}
                        className="w-100 border-0"
                    />
                </div>

                {/* Legend */}
                <div className="w-100 mt-3 border-top pt-3">
                    <Row className="text-center">
                        <Col>
                            <Badge bg="success" className="p-2 mb-1 d-block">Present</Badge>
                            <small className="text-muted">Checked In</small>
                        </Col>
                        <Col>
                            <Badge bg="primary" className="p-2 mb-1 d-block">On Leave</Badge>
                            <small className="text-muted">Approved Leave</small>
                        </Col>
                        <Col>
                            <Badge bg="danger" className="p-2 mb-1 d-block">Absent</Badge>
                            <small className="text-muted">No Record</small>
                        </Col>
                    </Row>
                </div>
            </Card.Body>
        </Card>
    );
};

export default CalendarComponent;
