import clsx from 'clsx';

export const LoadingSpinner = ({
  size = 'default',
  fullScreen = false,
  message = null,
}) => {
  const sizeStyles = {
    sm: 'h-4 w-4 border',
    default: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={clsx(
          'animate-spin rounded-full border-neutral-300 border-t-green-600',
          sizeStyles[size]
        )}
      />
      {message && (
        <p className="text-sm text-neutral-600">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-50/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};