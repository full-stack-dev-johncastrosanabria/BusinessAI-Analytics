import React from 'react'
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  /** Renders a full-width input */
  readonly fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      id,
      className = '',
      disabled,
      required,
      ...rest
    },
    ref,
  ) => {
    // Use crypto.randomUUID() for secure random ID generation
    const inputId = id ?? `input-${crypto.randomUUID().slice(0, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div
        className={[
          'ui-input-wrapper',
          fullWidth ? 'ui-input-wrapper--full' : '',
          error ? 'ui-input-wrapper--error' : '',
          disabled ? 'ui-input-wrapper--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {label && (
          <label htmlFor={inputId} className="ui-input__label">
            {label}
            {required && (
              <span className="ui-input__required" aria-hidden="true">
                {' '}*
              </span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          aria-required={required}
          className={['ui-input', className].filter(Boolean).join(' ')}
          {...rest}
        />

        {error && (
          <span id={errorId} className="ui-input__error" role="alert">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="ui-input__helper">
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
