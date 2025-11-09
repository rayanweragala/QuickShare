import { AlertCircle, X } from 'lucide-react';

export const ErrorMessage = ({
  message,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 animate-fade-in backdrop-blur-xl ${className}`}
    >
      <div className="flex-shrink-0">
        <AlertCircle className="w-5 h-5 text-red-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-red-300 font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
          aria-label="Dismiss error message"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};