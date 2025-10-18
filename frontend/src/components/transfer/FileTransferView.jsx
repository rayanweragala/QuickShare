import { useState } from 'react';
import { useFileTransfer } from '../../hooks/useFileTransfer';
import { Button, ErrorMessage } from '../common';
import { FileSelector } from './FileSelector';
import { TransferStatus } from './TransferStatus';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const FileTransferView = ({ role }) => {
  const {
    isSending,
    isReceiving,
    progress,
    currentChunk,
    totalChunks,
    fileName,
    error,
    transferComplete,
    sendFile,
    cancelTransfer,
    resetTransfer,
  } = useFileTransfer();

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleSendFile = async () => {
    if (!selectedFile) return;
    await sendFile(selectedFile);
  };

  const handleReset = () => {
    resetTransfer();
    setSelectedFile(null);
  };

  if (role === 'sender' && !isSending && !transferComplete) {
    return (
      <div className="space-y-6">
        {error && (
          <ErrorMessage message={error} className="mb-4" />
        )}

        <FileSelector onFileSelect={handleFileSelect} />

        {selectedFile && (
          <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 animate-fade-in">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Ready to Send
                </h3>
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-green-400 text-lg">{selectedFile.name}</span>
                  <span className="text-neutral-400 text-sm">{formatFileSize(selectedFile.size)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSendFile}
                className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Send File
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isSending || isReceiving) {
    return (
      <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 animate-fade-in">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">
              {isSending ? 'Sending' : 'Receiving'} File
            </h3>
            <button
              onClick={cancelTransfer}
              className="text-neutral-400 hover:text-white transition-colors px-4 py-2"
            >
              Cancel
            </button>
          </div>

          {fileName && (
            <p className="text-neutral-300 mb-6 text-lg">
              {fileName}
            </p>
          )}

          <div className="w-full bg-neutral-700 rounded-full overflow-hidden h-3 mb-4">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">Chunk {currentChunk} of {totalChunks}</span>
            <span className="font-medium text-green-400 text-lg">{Math.round(progress)}%</span>
          </div>
        </div>

        <TransferStatus
          isSending={isSending}
          isReceiving={isReceiving}
          progress={progress}
        />
      </div>
    );
  }

  if (transferComplete) {
    return (
      <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-12 text-center animate-fade-in">
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
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          Transfer Complete
        </h3>
        <p className="text-neutral-400 mb-6">
          {role === 'sender' 
            ? 'File sent successfully'
            : 'File downloaded successfully'
          }
        </p>

        {fileName && (
          <p className="text-sm text-green-400 mb-6 font-medium">
            {fileName}
          </p>
        )}

        {role === 'sender' && (
          <button
            onClick={handleReset}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Send Another File
          </button>
        )}
      </div>
    );
  }

  if (role === 'receiver') {
    return (
      <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-12 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl mb-4 border border-green-500/20">
          <svg
            className="w-8 h-8 text-green-500 animate-pulse"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Waiting for Files
        </h3>
        <p className="text-neutral-400">
          The sender will choose files to transfer
        </p>
      </div>
    );
  }

  return null;
};