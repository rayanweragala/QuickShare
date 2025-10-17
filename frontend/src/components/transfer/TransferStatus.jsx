import { Check, Loader2, Clock } from "lucide-react";

export const TransferStatus = ({ isSending, isReceiving, progress }) => {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {progress < 100 ? (
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {isSending && progress < 100 && 'Sending file...'}
              {isReceiving && progress < 100 && 'Receiving file...'}
              {progress === 100 && 'Transfer complete'}
            </p>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {progress < 100
                ? 'Keep this window open'
                : 'You can close this window now'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};