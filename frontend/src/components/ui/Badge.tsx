import React from 'react';
import './Badge.css';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  /** Accessible label override when the visual text isn't descriptive enough */
  'aria-label'?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
  'aria-label': ariaLabel,
}) => {
  return (
    <span
      className={[
        'ui-badge',
        `ui-badge--${variant}`,
        `ui-badge--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
};
