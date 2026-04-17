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
      className={`ds-stat-card ds-stat-card--${variant} text-center ${isClickable ? 'ds-stat-card--clickable' : ''} ${isInteractive ? 'ds-stat-card--interactive' : ''}`}
      as={isClickable ? 'button' : 'div'}
      type={isClickable ? 'button' : undefined}
      onClick={isClickable ? onClick : undefined}
      disabled={isClickable ? disabled : undefined}
      aria-label={ariaLabel}
      aria-disabled={isClickable && disabled ? 'true' : undefined}
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
