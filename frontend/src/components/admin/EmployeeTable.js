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
    <div className="mb-5">
      {/* Search and Filter Toolbar (Floating) */}
      <div className="admin-toolbar">
        <div className="d-flex align-items-center me-auto">
          <strong><i className="bi bi-people-fill text-primary me-2 fs-5"></i>All Employees</strong>
          <Badge bg="primary" className="ms-2 rounded-pill px-3">{filteredEmployees.length}</Badge>
        </div>
        
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div style={{ minWidth: '200px' }}>
            <Form.Control
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search employees"
              className="border-secondary border-opacity-25 bg-white bg-opacity-75"
            />
          </div>
          <div style={{ minWidth: '180px' }}>
            <Form.Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              aria-label="Filter by department"
              className="border-secondary border-opacity-25 bg-white bg-opacity-75"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Form.Select>
          </div>
          {(searchTerm || departmentFilter) && (
            <Button variant="light" className="text-secondary border-0" onClick={() => { setSearchTerm(''); setDepartmentFilter(''); }}>
              <i className="bi bi-x-lg"></i>
            </Button>
          )}

          {/* Export Actions */}
          <div className="ms-md-3 d-flex gap-2 border-start ps-md-3 border-secondary border-opacity-25">
            <Button variant="light" className="premium-badge text-success border-0 bg-success bg-opacity-10 shadow-sm" onClick={onExportCSV} aria-label="Export CSV">
              <i className="bi bi-filetype-csv fs-6 me-1"></i>CSV
            </Button>
            <Button variant="light" className="premium-badge text-primary border-0 bg-primary bg-opacity-10 shadow-sm" onClick={() => onDownloadReport('daily')} aria-label="Daily Report">
              <i className="bi bi-calendar2-day fs-6 me-1"></i>Daily
            </Button>
            <Button variant="light" className="premium-badge text-info border-0 bg-info bg-opacity-10 shadow-sm" onClick={() => onDownloadReport('monthly')} aria-label="Monthly Report">
              <i className="bi bi-calendar-month fs-6 me-1"></i>Monthly
            </Button>
          </div>
        </div>
      </div>

      <div className="premium-table-wrapper">
        {loading ? (
          <Table responsive className="premium-table">
            <thead><tr><th>Name</th><th>Department</th><th>Employee ID</th><th>Mobile</th><th>Status</th><th>Action</th></tr></thead>
            <tbody><TableRowSkeleton columns={6} rows={5} /></tbody>
          </Table>
        ) : (
          <Table responsive className="premium-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Employee ID</th>
                <th>Mobile</th>
                <th>Current Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-5">
                    <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                    {searchTerm || departmentFilter ? 'No matching employees found' : 'No employees found'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold" style={{ width: '40px', height: '40px' }}>
                          {emp.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <strong className="text-dark dark:text-white">{emp.full_name}</strong>
                      </div>
                    </td>
                    <td>{emp.department}</td>
                    <td className="font-monospace text-muted">{emp.employee_id}</td>
                    <td>{emp.mobile_number}</td>
                    <td>
                      <span className={`premium-badge ${emp.present_status_of_employee === 'Present' ? 'success' : 'secondary'}`}>
                        <i className={`bi ${emp.present_status_of_employee === 'Present' ? 'bi-check-circle-fill' : 'bi-dash-circle-fill'}`}></i>
                        {emp.present_status_of_employee || 'Absent'}
                      </span>
                    </td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="light"
                        className="rounded-pill text-primary fw-bold px-3 border border-primary border-opacity-25"
                        onClick={() => onViewDetails(emp.id)}
                        aria-label={`View details for ${emp.full_name}`}
                      >
                        <i className="bi bi-eye me-1"></i>View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default EmployeeTable;
