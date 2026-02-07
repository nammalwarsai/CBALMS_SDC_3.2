import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * Leave usage pie chart and monthly attendance bar chart (CQ-01 extraction)
 */
const ChartSection = ({ leaveUsageData, monthlyAttendanceData }) => {
  return (
    <Row className="mb-4">
      <Col lg={6} className="mb-3">
        <Card className="content-card h-100">
          <Card.Header><i className="bi bi-pie-chart me-2"></i><strong>Leave Usage Breakdown</strong></Card.Header>
          <Card.Body className="d-flex align-items-center justify-content-center">
            {leaveUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={leaveUsageData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                    {leaveUsageData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted"><i className="bi bi-info-circle me-2"></i>No leave data available yet</p>
            )}
          </Card.Body>
        </Card>
      </Col>
      <Col lg={6} className="mb-3">
        <Card className="content-card h-100">
          <Card.Header><i className="bi bi-bar-chart me-2"></i><strong>Monthly Attendance Summary</strong></Card.Header>
          <Card.Body>
            {monthlyAttendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="Present" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted text-center"><i className="bi bi-info-circle me-2"></i>No monthly data available yet</p>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ChartSection;
