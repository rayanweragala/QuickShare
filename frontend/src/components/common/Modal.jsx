import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-green-500/10 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
