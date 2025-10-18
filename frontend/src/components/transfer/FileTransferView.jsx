import { useState } from "react";
import { useFileTransfer } from "../../hooks/useFileTransfer";
import { Button, ErrorMessage } from "../common";
import { FileSelector } from "./FileSelector";
import { TransferStatus } from "./TransferStatus";
import { useWebRTC } from "../../hooks/useWebRTC";

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const FileTransferView = ({ role, connectedReceivers = [] }) => {
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
    receivedFiles,
    currentlyDownloading,
    downloadReceivedFile,
  } = useFileTransfer();

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleSendFile = async () => {
    console.log("handleSendFile called", { selectedFile, connectedReceivers });
    if (!selectedFile) return;

    if (connectedReceivers && connectedReceivers.length > 0) {
      await sendFile(selectedFile, connectedReceivers);
    } else {
      await sendFile(selectedFile, null);
    }
  };

  const handleReset = () => {
    resetTransfer();
    setSelectedFile(null);
  };

  if (
    receivedFiles &&
    receivedFiles.length > 0 &&
    role === "receiver" &&
    !isSending &&
    !isReceiving
  ) {
    return (
      <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-6 sm:p-8 animate-fade-in">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
          Received Files ({receivedFiles.length})
        </h2>

        <div className="space-y-4 mb-6">
          {receivedFiles.map((file, index) => (
            <div
              key={index}
              className="bg-neutral-900/50 rounded-xl p-4 sm:p-5 border border-neutral-700 hover:border-green-500/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-green-500"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate text-base sm:text-lg">
                      {file.metadata.name}
                    </p>
                    <p className="text-neutral-400 text-sm mt-1">
                      {formatFileSize(file.metadata.size)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => downloadReceivedFile(index)}
                  disabled={currentlyDownloading !== null}
                  className="w-full sm:w-auto flex-shrink-0 bg-green-600 hover:bg-green-700 disabled:bg-neutral-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {currentlyDownloading === index ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-neutral-900/30 rounded-lg p-4 border border-neutral-700">
          <p className="text-sm text-neutral-400 text-center sm:text-left">
            {receivedFiles.length > 1 
              ? "Tap on any file above to download it"
              : "Tap the download button to save the file to your device"}
          </p>
        </div>
      </div>
    );
  }

  if (role === "sender" && !isSending && !transferComplete) {
    return (
      <div className="space-y-6">
        {error && <ErrorMessage message={error} className="mb-4" />}

        <FileSelector onFileSelect={handleFileSelect} />

        {selectedFile && (
          <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-6 sm:p-8 animate-fade-in">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Ready to Send
                </h3>
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-green-400 text-base sm:text-lg break-words">
                    {selectedFile.name}
                  </span>
                  <span className="text-neutral-400 text-sm">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-neutral-400 hover:text-white transition-colors flex-shrink-0"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
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
      <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-6 sm:p-8 animate-fade-in">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              {isSending ? "Sending" : "Receiving"} File
            </h3>
            <button
              onClick={cancelTransfer}
              className="text-neutral-400 hover:text-white transition-colors px-3 py-2 text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>

          {fileName && (
            <p className="text-neutral-300 mb-6 text-base sm:text-lg break-words">
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
            <span className="text-neutral-400">
              Chunk {currentChunk} of {totalChunks}
            </span>
            <span className="font-medium text-green-400 text-base">
              {Math.round(progress)}%
            </span>
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
      <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-12 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-500/10 rounded-2xl mb-4 border border-green-500/20">
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 text-green-500"
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

        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Transfer Complete
        </h3>
        <p className="text-base sm:text-lg text-green-400 font-medium mb-6">
          {role === "sender"
            ? "File delivered successfully"
            : "File saved to your device"}
        </p>

        {fileName && (
          <p className="text-sm text-green-400 mb-6 font-medium break-words px-4">
            {fileName}
          </p>
        )}

        {role === "sender" && (
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

  if (role === "receiver") {
    return (
      <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-12 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-500/10 rounded-2xl mb-4 border border-green-500/20">
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 text-green-500 animate-pulse"
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
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Waiting for Files
        </h3>
        <p className="text-neutral-400 text-sm sm:text-base">
          The sender will choose files to transfer
        </p>
      </div>
    );
  }

  return null;
};