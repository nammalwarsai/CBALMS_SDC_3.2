import React from 'react';
import { Card } from 'react-bootstrap';
import { StatCardSkeleton } from './SkeletonLoaders';

const DashboardStatCard = ({
  loading = false,
  variant = 'neutral',
  icon,
  value,
  label,
  hint,
  onClick,
  ariaLabel,
  disabled = false
}) => {
  if (loading) return <StatCardSkeleton />;

  const isClickable = typeof onClick === 'function';
  const isInteractive = isClickable && !disabled;

  return (
    <Card
      className={`ds-stat-card ds-stat-card--${variant} text-start ${isClickable ? 'ds-stat-card--clickable' : ''} ${isInteractive ? 'ds-stat-card--interactive' : ''}`}
      as={isClickable ? 'button' : 'div'}
      type={isClickable ? 'button' : undefined}
      onClick={isClickable ? onClick : undefined}
      disabled={isClickable ? disabled : undefined}
      aria-label={ariaLabel}
      aria-disabled={isClickable && disabled ? 'true' : undefined}
      style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', right: '-15px', top: '-15px', opacity: 0.15, fontSize: '8rem', transform: 'rotate(-15deg)' }}>
        <i className={`bi ${icon}`}></i>
      </div>
      
      <Card.Body className="p-0 position-relative z-index-1 d-flex flex-column justify-content-between h-100">
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 text-white opacity-75 text-uppercase fw-bold" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>{label}</h6>
            {icon && <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><i className={`bi ${icon} text-white fs-5`}></i></div>}
          </div>
          <div className="ds-stat-card__value mb-1" style={{ fontSize: '2.5rem' }}>{value}</div>
        </div>
        <div>
          {hint ? <small className="text-white opacity-75 fw-medium bg-black bg-opacity-25 px-2 py-1 rounded d-inline-block mt-2"><i className="bi bi-info-circle me-1"></i>{hint}</small> : null}
        </div>
      </Card.Body>
    </Card>
  );
};

export default DashboardStatCard;
