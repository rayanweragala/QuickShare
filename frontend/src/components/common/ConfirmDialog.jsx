import { AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';
import { Button } from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning', // 'warning', 'danger', 'info', 'success'
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
    danger: <XCircle className="w-6 h-6 text-red-400" />,
    info: <Info className="w-6 h-6 text-blue-400" />,
    success: <CheckCircle className="w-6 h-6 text-green-400" />,
  };

  const bgStyles = {
    warning: 'bg-yellow-500/20 border-yellow-500/30',
    danger: 'bg-red-500/20 border-red-500/30',
    info: 'bg-blue-500/20 border-blue-500/30',
    success: 'bg-green-500/20 border-green-500/30',
  };

  const buttonVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${bgStyles[variant]}`}>
              {icons[variant]}
            </div>
            <div className="flex-1">
              <h3 id="confirm-dialog-title" className="text-lg font-bold text-white mb-2">
                {title}
              </h3>
              <p id="confirm-dialog-description" className="text-sm text-zinc-400">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            fullWidth
            ariaLabel="Cancel action"
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            fullWidth
            ariaLabel="Confirm action"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Hook for using confirm dialog
import { useState, useCallback } from 'react';

export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
    onConfirm: () => {},
  });

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'warning',
        onConfirm: () => {
          resolve(true);
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        },
      });
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    dialogState,
    showConfirm,
    closeDialog,
  };
};
