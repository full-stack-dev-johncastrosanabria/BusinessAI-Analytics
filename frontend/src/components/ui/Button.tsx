import React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon rendered before the label */
  startIcon?: React.ReactNode;
  /** Icon rendered after the label */
  endIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      startIcon,
      endIcon,
      children,
      className = '',
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={[
          'ui-btn',
          `ui-btn--${variant}`,
          `ui-btn--${size}`,
          loading ? 'ui-btn--loading' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {loading && (
          <span className="ui-btn__spinner" aria-hidden="true" />
        )}
        {!loading && startIcon && (
          <span className="ui-btn__icon ui-btn__icon--start" aria-hidden="true">
            {startIcon}
          </span>
        )}
        <span className="ui-btn__label">{children}</span>
        {!loading && endIcon && (
          <span className="ui-btn__icon ui-btn__icon--end" aria-hidden="true">
            {endIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
