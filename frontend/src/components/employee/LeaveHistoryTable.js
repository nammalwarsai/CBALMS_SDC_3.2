import React, { useState } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { TableRowSkeleton } from '../common/SkeletonLoaders';
import { formatDate } from '../../utils/dateUtils';

const ROWS_PER_PAGE = 10;

/**
 * Leave history table with pagination and formatted dates (CQ-01, UI-01, UI-06)
 */
const LeaveHistoryTable = ({ leaveHistory, leaveLoading, onCancelLeave }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(leaveHistory.length / ROWS_PER_PAGE));
  const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedLeaves = leaveHistory.slice(startIdx, startIdx + ROWS_PER_PAGE);

  // Reset to page 1 if data changes and current page is out of range
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [leaveHistory.length, totalPages, currentPage]);

  return (
    <Card className="content-card">
      <Card.Header><i className="bi bi-clock-history me-2"></i><strong>Leave History</strong></Card.Header>
      <Card.Body>
        {leaveLoading ? (
          <Table striped bordered hover responsive>
            <thead><tr><th>Type</th><th>Start</th><th>End</th><th>Status</th><th>Action</th></tr></thead>
            <tbody><TableRowSkeleton columns={5} rows={3} /></tbody>
          </Table>
        ) : (
          <>
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table striped bordered hover>
                <thead><tr><th>Type</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {leaveHistory.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4"><i className="bi bi-inbox me-2"></i>No leave history found</td></tr>
                  ) : (
                    paginatedLeaves.map((leave) => (
                      <tr key={leave.id}>
                        <td><Badge bg="info">{leave.leave_type}</Badge></td>
                        <td>{formatDate(leave.start_date)}</td>
                        <td>{formatDate(leave.end_date)}</td>
                        <td>
                          <Badge bg={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'danger' : 'warning'}>
                            {leave.status}
                          </Badge>
                        </td>
                        <td>
                          {leave.status === 'Pending' ? (
                            <Button size="sm" variant="outline-danger" onClick={() => onCancelLeave(leave.id)} aria-label="Cancel leave request">
                              <i className="bi bi-x-circle me-1"></i>Cancel
                            </Button>
                          ) : (
                            <span className="text-muted small">{leave.admin_remarks || '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination Controls (UI-01) */}
            {leaveHistory.length > ROWS_PER_PAGE && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-muted">
                  Showing {startIdx + 1}–{Math.min(startIdx + ROWS_PER_PAGE, leaveHistory.length)} of {leaveHistory.length}
                </small>
                <div className="d-flex gap-2 align-items-center">
                  <Button size="sm" variant="outline-primary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <i className="bi bi-chevron-left"></i> Prev
                  </Button>
                  <span className="small">Page {currentPage} of {totalPages}</span>
                  <Button size="sm" variant="outline-primary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    Next <i className="bi bi-chevron-right"></i>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default LeaveHistoryTable;
