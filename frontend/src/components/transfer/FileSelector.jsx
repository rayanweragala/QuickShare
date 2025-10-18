import { useRef, useState } from "react";
import { Card, Button } from "../common";

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
      className={`group bg-neutral-800/50 backdrop-blur rounded-2xl border transition-all duration-300 p-8 sm:p-10 cursor-pointer ${
        isDragging 
          ? "border-green-500 bg-neutral-800/70" 
          : "border-neutral-700 hover:bg-neutral-800/70 hover:border-green-500/30"
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl mb-4 border border-green-500/20">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">
          {isDragging ? "Drop file here" : "Choose a file to send"}
        </h3>
        
        <p className="text-neutral-400 text-sm mb-6">
          Drag and drop or click to browse
        </p>
        
        <button className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
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
    <div className="flex items-center gap-3 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700">
      <div className="flex-shrink-0">
        {progress < 100 ? (
          <div className="w-5 h-5 border-2 border-neutral-700 border-t-green-500 rounded-full animate-spin" />
        ) : (
          <svg
            className="w-5 h-5 text-green-500"
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
        <p className="text-sm font-medium text-white">
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
  );
};