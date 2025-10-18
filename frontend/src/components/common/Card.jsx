import clsx from 'clsx';

export const Card = ({
  children,
  variant = 'default',
  hover = false,
  className = '',
  padding = 'default',
  
}) => {
  const variantStyles = {
    default: 'card',
    elevated: 'card-elevated',
    dark: 'card-dark',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover ? 'hover-lift cursor-pointer' : '';

  return (
    <div
      className={clsx(
        variantStyles[variant],
        paddingStyles[padding],
        hoverStyles,
        className
      )}
    >
      {children}
    </div>
  );
};