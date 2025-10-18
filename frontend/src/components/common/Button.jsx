import clsx from "clsx";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  disabled = false,
  onClick,
  type = "button",
  className = "",
  icon = null,
}) => {
  const baseStyles = "btn";

  const variantStyles = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
  };

  const sizeStyles = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        className
      )}
    >
      {isLoading && <div className="spinner" />}
      {!isLoading && icon && <span>{icon}</span>}
      {children}
    </button>
  );
};