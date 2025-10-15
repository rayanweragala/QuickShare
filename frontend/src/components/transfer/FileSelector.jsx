import { useRef, useState } from "react";
import { Upload, Check, Loader2 } from "lucide-react";

export const FileSelector = ({ onFileSelect }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`group relative overflow-hidden bg-gradient-to-br rounded-2xl border transition-all duration-300 p-8 sm:p-10 cursor-pointer ${
        isDragging
          ? "from-green-900/40 to-emerald-900/40 border-green-500 bg-neutral-800/70"
          : "from-neutral-800/50 to-neutral-900/50 border-neutral-700/50 hover:from-neutral-800/70 hover:to-neutral-900/70 hover:border-green-500/30"
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-all ${
        isDragging ? "bg-green-500/20" : "bg-green-500/5 group-hover:bg-green-500/10"
      }`} />
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="relative text-center py-8">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 border transition-all ${
          isDragging 
            ? "bg-green-500/30 border-green-400/50 scale-110" 
            : "bg-green-500/10 border-green-500/20 group-hover:scale-105"
        }`}>
          <Upload className={`w-10 h-10 transition-all ${
            isDragging ? "text-green-300" : "text-green-500"
          }`} />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">
          {isDragging ? "Drop file here" : "Choose a file to send"}
        </h3>
        
        <p className="text-neutral-400 text-sm mb-6">
          Drag and drop or click to browse
        </p>
        
        <button className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-green-500/20 hover:scale-105 flex items-center justify-center gap-2 mx-auto">
          <Upload className="w-5 h-5" />
          Select File
        </button>
        
        <p className="text-xs text-neutral-500 mt-6">
          No file size limits • Direct peer-to-peer transfer
        </p>
      </div>
    </div>
  );
};

export const TransferStatus = ({ isSending, isReceiving, progress }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700 rounded-xl p-4">
      <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl" />
      
      <div className="relative flex items-center gap-3">
        <div className="flex-shrink-0">
          {progress < 100 ? (
            <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
          ) : (
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-500" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            {isSending && progress < 100 && 'Transferring file...'}
            {isReceiving && progress < 100 && 'Receiving file...'}
            {progress === 100 && 'Transfer complete'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {progress < 100
              ? 'Keep this window open until transfer completes'
              : 'You can close this window now'
            }
          </p>
        </div>
      </div>
    </div>
  );
};