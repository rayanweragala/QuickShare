import { useEffect } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

export const Toast = ({ id, type = 'info', message, duration = 5000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const styles = {
    success: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 text-green-400',
    error: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-500/50 text-red-400',
    warning: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50 text-yellow-400',
    info: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50 text-blue-400',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={clsx(
        'flex items-center gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg',
        'animate-slide-in-right min-w-[300px] max-w-md',
        styles[type]
      )}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-medium text-white">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2"
      aria-label="Notifications"
      role="region"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};
