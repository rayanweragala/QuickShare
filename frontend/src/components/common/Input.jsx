import clsx from "clsx";

export const Input = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  error = null,
  disabled = false,
  size = 'default',
  variant = 'default',
  maxLength,
  autoFocus = false,
  className = '',
}) => {
  const inputStyles = clsx(
    'input',
    {
      'input-error': error,
      'input-dark': variant === 'dark',
      'input-lg': size === 'lg',
    },
    className
  );

  const labelStyles = clsx('label', {
    'label-dark': variant === 'dark',
  });

  return (
    <div className="w-full">
      {label && (
        <label className={labelStyles}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={inputStyles}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};