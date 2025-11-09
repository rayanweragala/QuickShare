import { useId } from 'react';
import clsx from "clsx";
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const Input = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  error = null,
  success = null,
  disabled = false,
  size = 'default',
  variant = 'default',
  maxLength,
  autoFocus = false,
  className = '',
  helperText = null,
  required = false,
  ariaLabel = null,
}) => {
  const inputId = useId();
  const errorId = useId();
  const helperId = useId();

  const inputStyles = clsx(
    'input',
    {
      'input-error': error,
      'input-dark': variant === 'dark',
      'input-lg': size === 'lg',
      'border-green-500 focus:ring-green-500': success && !error,
      'pr-10': error || success,
    },
    className
  );

  const labelStyles = clsx('label', {
    'label-dark': variant === 'dark',
  });

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className={labelStyles}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          autoFocus={autoFocus}
          required={required}
          aria-label={ariaLabel || label}
          aria-invalid={!!error}
          aria-describedby={clsx({
            [errorId]: error,
            [helperId]: helperText,
          })}
          className={inputStyles}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
        {success && !error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-2 text-sm text-zinc-500">
          {helperText}
        </p>
      )}
    </div>
  );
};