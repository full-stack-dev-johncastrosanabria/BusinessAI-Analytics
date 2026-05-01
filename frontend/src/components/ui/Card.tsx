import React from 'react';
import './Card.css';

export interface CardProps {
  readonly header?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
  /** Removes default padding from the body */
  readonly noPadding?: boolean;
  /** Adds a hover shadow effect */
  readonly hoverable?: boolean;
  readonly role?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
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
