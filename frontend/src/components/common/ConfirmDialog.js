import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmDialog = ({ 
  show, 
  onHide, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon = 'bi-exclamation-triangle'
}) => {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Body className="text-center p-4">
        <div className="mb-3">
          <i className={`bi ${icon} text-${variant}`} style={{ fontSize: '3rem' }}></i>
        </div>
        <h5 className="mb-2">{title}</h5>
        <p className="text-muted mb-4">{message}</p>
        <div className="d-flex gap-2 justify-content-center">
          <Button variant="outline-secondary" onClick={onHide}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={() => { onConfirm(); onHide(); }}>
            {confirmText}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ConfirmDialog;
