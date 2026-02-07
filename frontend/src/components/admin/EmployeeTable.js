import React, { useState, useMemo } from 'react';
import { Card, Table, Badge, Button, Form, Row, Col } from 'react-bootstrap';
import { TableRowSkeleton } from '../common/SkeletonLoaders';

/**
 * Employee table with search/filter for admin dashboard (CQ-01, UI-02)
 */
const EmployeeTable = ({ employees, loading, onViewDetails, onExportCSV, onDownloadReport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Get unique departments for the dropdown
  const departments = useMemo(() => {
    const depts = [...new Set(employees.map(e => e.department).filter(Boolean))];
    return depts.sort();
  }, [employees]);

  // Filter employees by search term and department (UI-02)
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = !searchTerm ||
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = !departmentFilter || emp.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, departmentFilter]);

  return (
    <Card className="content-card">
      <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
        <strong><i className="bi bi-people me-2"></i>All Employees</strong>
        <div className="d-flex gap-2 align-items-center mt-2 mt-md-0">
          <Button variant="outline-success" size="sm" onClick={onExportCSV} aria-label="Export Employees CSV">
            <i className="bi bi-filetype-csv me-1"></i>CSV
          </Button>
          <Button variant="outline-primary" size="sm" onClick={() => onDownloadReport('daily')} aria-label="Download Daily Report">
            <i className="bi bi-file-pdf me-1"></i>Daily
          </Button>
          <Button variant="outline-info" size="sm" onClick={() => onDownloadReport('monthly')} aria-label="Download Monthly Report">
            <i className="bi bi-file-pdf me-1"></i>Monthly
          </Button>
          <span className="badge bg-primary ms-2">{filteredEmployees.length} of {employees.length}</span>
        </div>
      </Card.Header>
      <Card.Body>
        {/* Search and Filter Bar (UI-02) */}
        <Row className="mb-3 g-2">
          <Col md={6} lg={4}>
            <Form.Control
              type="text"
              placeholder="Search by name, ID, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search employees"
            />
          </Col>
          <Col md={4} lg={3}>
            <Form.Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              aria-label="Filter by department"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Form.Select>
          </Col>
          {(searchTerm || departmentFilter) && (
            <Col md={2} lg={2}>
              <Button variant="outline-secondary" className="w-100" onClick={() => { setSearchTerm(''); setDepartmentFilter(''); }}>
                <i className="bi bi-x-lg me-1"></i>Clear
              </Button>
            </Col>
          )}
        </Row>

        {loading ? (
          <Table striped bordered hover responsive>
            <thead><tr><th>Name</th><th>Department</th><th>Employee ID</th><th>Mobile</th><th>Status</th><th>Action</th></tr></thead>
            <tbody><TableRowSkeleton columns={6} rows={5} /></tbody>
          </Table>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Employee ID</th>
                <th>Mobile</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted py-4"><i className="bi bi-inbox me-2"></i>{searchTerm || departmentFilter ? 'No matching employees found' : 'No employees found'}</td></tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td><strong>{emp.full_name}</strong></td>
                    <td>{emp.department}</td>
                    <td>{emp.employee_id}</td>
                    <td>{emp.mobile_number}</td>
                    <td>
                      <Badge bg={emp.present_status_of_employee === 'Present' ? 'success' : 'secondary'}>
                        {emp.present_status_of_employee || 'Absent'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="info"
                        onClick={() => onViewDetails(emp.id)}
                        aria-label={`View details for ${emp.full_name}`}
                      >
                        <i className="bi bi-eye me-1"></i>Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default EmployeeTable;
