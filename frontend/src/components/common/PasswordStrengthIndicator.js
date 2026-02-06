import React from 'react';
import { ProgressBar } from 'react-bootstrap';
import { validatePassword } from '../../utils/validators';

const PasswordStrengthIndicator = ({ password }) => {
  if (!password) return null;

  const { errors, strength } = validatePassword(password);

  return (
    <div className="mt-2">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <small className="text-muted">Password Strength</small>
        <small style={{ color: strength.color, fontWeight: 600 }}>{strength.level}</small>
      </div>
      <ProgressBar 
        now={strength.percent} 
        variant={
          strength.level === 'Weak' ? 'danger' :
          strength.level === 'Fair' ? 'warning' :
          strength.level === 'Good' ? 'info' : 'success'
        }
        style={{ height: '6px' }}
      />
      {errors.length > 0 && (
        <div className="mt-1">
          {errors.map((err, idx) => (
            <small key={idx} className="text-danger d-block">
              <i className="bi bi-x-circle me-1"></i>{err}
            </small>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
