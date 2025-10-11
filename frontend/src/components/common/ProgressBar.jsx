export const ProgressBar = ({
  progress = 0,
  showPercentage = true,
  size = 'default',
  animated = false,
}) => {
  const heightStyles = {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      <div className={`progress-bar ${heightStyles[size]}`}>
        <div
          className={`progress-bar-fill ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <div className="mt-2 text-right text-sm text-neutral-600 font-medium">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};