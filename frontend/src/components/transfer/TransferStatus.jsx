export const TransferStatus = ({ isSending, isReceiving, progress }) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
      <div className="flex-shrink-0">
        {progress < 100 ? (
          <div className="spinner" />
        ) : (
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-900">
          {isSending && progress < 100 && 'Transferring file...'}
          {isReceiving && progress < 100 && 'Receiving file...'}
          {progress === 100 && 'Transfer complete'}
        </p>
        <p className="text-xs text-neutral-600 mt-1">
          {progress < 100 
            ? 'Keep this window open until transfer completes'
            : 'You can close this window now'
          }
        </p>
      </div>
    </div>
  );
};