import { useState } from 'react';
import { useFileTransfer } from '../../hooks/useFileTransfer';
import { Card, Button, ProgressBar, ErrorMessage } from '../common';
import { FileSelector } from './FileSelector';
import { TransferStatus } from './TransferStatus';
import { formatFileSize } from '../../utils/file.utils';

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
          <Card variant="elevated" padding="lg">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Ready to Send
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-neutral-600">
                  <span className="font-medium text-neutral-900">{selectedFile.name}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                Change
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={handleSendFile}
              >
                Send File
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setSelectedFile(null)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  if (isSending || isReceiving) {
    return (
      <Card variant="elevated" padding="lg">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              {isSending ? 'Sending' : 'Receiving'} File
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelTransfer}
            >
              Cancel
            </Button>
          </div>

          {fileName && (
            <p className="text-sm text-neutral-600 mb-4">
              {fileName}
            </p>
          )}

          <ProgressBar progress={progress} />

          <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
            <span>Chunk {currentChunk} of {totalChunks}</span>
            <span className="font-medium text-green-600">{Math.round(progress)}%</span>
          </div>
        </div>

        <TransferStatus
          isSending={isSending}
          isReceiving={isReceiving}
          progress={progress}
        />
      </Card>
    );
  }

  if (transferComplete) {
    return (
      <Card variant="elevated" padding="lg" className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-green-600"
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

        <h3 className="text-xl font-bold text-neutral-900 mb-2">
          Transfer Complete
        </h3>
        <p className="text-neutral-600 mb-6">
          {role === 'sender' 
            ? 'File sent successfully'
            : 'File downloaded successfully'
          }
        </p>

        {fileName && (
          <p className="text-sm text-neutral-500 mb-6">
            {fileName}
          </p>
        )}

        {role === 'sender' && (
          <Button
            variant="primary"
            fullWidth
            onClick={handleReset}
          >
            Send Another File
          </Button>
        )}
      </Card>
    );
  }

  if (role === 'receiver') {
    return (
      <Card variant="elevated" padding="lg" className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-neutral-600 animate-pulse"
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
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Waiting for Files
        </h3>
        <p className="text-sm text-neutral-600">
          The sender will choose files to transfer
        </p>
      </Card>
    );
  }

  return null;
};