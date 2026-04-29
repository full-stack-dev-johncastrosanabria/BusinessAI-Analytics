import React from 'react';
import './Card.css';

export interface CardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Removes default padding from the body */
  noPadding?: boolean;
  /** Adds a hover shadow effect */
  hoverable?: boolean;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export const Card: React.FC<CardProps> = ({
  header,
  footer,
  children,
  className = '',
  noPadding = false,
  hoverable = false,
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}) => {
  return (
    <div
      className={[
        'ui-card',
        hoverable ? 'ui-card--hoverable' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {header && <div className="ui-card__header">{header}</div>}
      <div className={['ui-card__body', noPadding ? 'ui-card__body--no-padding' : ''].filter(Boolean).join(' ')}>
        {children}
      </div>
      {footer && <div className="ui-card__footer">{footer}</div>}
    </div>
  );
};
