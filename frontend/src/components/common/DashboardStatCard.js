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
  ariaLabel
}) => {
  if (loading) return <StatCardSkeleton />;

  const isInteractive = typeof onClick === 'function';

  const onKeyDown = (event) => {
    if (!isInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className={`ds-stat-card ds-stat-card--${variant} text-center ${isInteractive ? 'ds-stat-card--interactive' : ''}`}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
    >
      <Card.Body>
        {icon && <div className="mb-2"><i className={`bi ${icon} ds-stat-card__icon`}></i></div>}
        <div className="ds-stat-card__value">{value}</div>
        <Card.Text className="ds-stat-card__label">{label}</Card.Text>
        {hint ? <small className="ds-stat-card__hint">{hint}</small> : null}
      </Card.Body>
    </Card>
  );
};

export default DashboardStatCard;
