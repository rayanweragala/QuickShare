import clsx from "clsx";
import { Loader2 } from "lucide-react";

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
  ariaLabel = null,
}) => {
  const baseStyles = "btn";

  const variantStyles = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md hover:shadow-lg",
  };

  const sizeStyles = {
    sm: "btn-sm",
    md: "px-4 py-2",
    lg: "btn-lg",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  const disabledStyles = (disabled || isLoading) ? "opacity-50 cursor-not-allowed hover:shadow-none" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        disabledStyles,
        className
      )}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};