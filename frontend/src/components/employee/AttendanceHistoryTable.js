import React, { useState } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { TableRowSkeleton } from '../common/SkeletonLoaders';
import { formatDate } from '../../utils/dateUtils';

const ROWS_PER_PAGE = 10;

/**
 * Attendance history table with pagination, formatted dates, and export options (CQ-01, UI-01, UI-06)
 */
const AttendanceHistoryTable = ({ attendanceHistory, loading, onExportCSV, onGeneratePDF }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(attendanceHistory.length / ROWS_PER_PAGE));
  const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = attendanceHistory.slice(startIdx, startIdx + ROWS_PER_PAGE);

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [attendanceHistory.length, totalPages, currentPage]);

  return (
    <Card className="content-card">
      <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
        <strong><i className="bi bi-list-check me-2"></i>Attendance History</strong>
        <div className="d-flex gap-2 mt-2 mt-md-0">
          <Button variant="outline-success" size="sm" onClick={onExportCSV} aria-label="Export as CSV">
            <i className="bi bi-filetype-csv me-1"></i>CSV
          </Button>
          <Button variant="primary" size="sm" onClick={onGeneratePDF} aria-label="Download PDF Report">
            <i className="bi bi-file-pdf me-1"></i>PDF
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <Table striped bordered hover responsive>
            <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
            <tbody><TableRowSkeleton columns={4} rows={5} /></tbody>
          </Table>
        ) : (
          <>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
                <tbody>
                  {attendanceHistory.length === 0 ? (
                    <tr><td colSpan="4" className="text-center text-muted py-4"><i className="bi bi-inbox me-2"></i>No attendance records found</td></tr>
                  ) : (
                    paginatedRecords.map((record, index) => (
                      <tr key={index}>
                        <td>{formatDate(record.date)}</td>
                        <td>{record.check_in || '-'}</td>
                        <td>{record.check_out || '-'}</td>
                        <td><Badge bg={record.status === 'Present' ? 'success' : 'warning'}>{record.status}</Badge></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination Controls (UI-01) */}
            {attendanceHistory.length > ROWS_PER_PAGE && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-muted">
                  Showing {startIdx + 1}–{Math.min(startIdx + ROWS_PER_PAGE, attendanceHistory.length)} of {attendanceHistory.length}
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

export default AttendanceHistoryTable;
