import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Container, Card, Button } from 'react-bootstrap';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <Container className="mt-5">
      <Card className="border-0 shadow-sm text-center p-5">
        <Card.Body>
          <div className="mb-4">
            <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '4rem' }}></i>
          </div>
          <h3 className="mb-3">Oops! Something went wrong</h3>
          <p className="text-muted mb-4">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="text-start bg-light p-3 rounded mb-4" style={{ fontSize: '0.85rem', maxHeight: '200px', overflow: 'auto' }}>
              {error.message}
            </pre>
          )}
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="primary" onClick={resetErrorBoundary}>
              <i className="bi bi-arrow-clockwise me-2"></i>Try Again
            </Button>
            <Button variant="outline-secondary" onClick={() => window.location.href = '/'}>
              <i className="bi bi-house me-2"></i>Go Home
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

const AppErrorBoundary = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Error Boundary caught:', error, errorInfo);
      }}
      onReset={() => {
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default AppErrorBoundary;
