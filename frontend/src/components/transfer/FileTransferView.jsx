import { useState } from "react";
import { useFileTransfer } from "../../hooks/useFileTransfer";
import { ErrorMessage } from "../common";
import { FileSelector } from "./FileSelector";
import { TransferStatus } from "./TransferStatus";
import { logger } from "../../utils/logger";
import { Download, Upload, Check, X, File, Loader2 } from "lucide-react";

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
    logger.debug("handleSendFile called", { selectedFile, connectedReceivers });
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
      <div className="group relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50 rounded-2xl p-6 sm:p-8 animate-fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
        
        <div className="relative">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <File className="w-6 h-6 text-green-400" />
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
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <File className="w-5 h-5 text-green-500" />
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
                    className="w-full sm:w-auto flex-shrink-0 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-neutral-600 disabled:to-neutral-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {currentlyDownloading === index ? "Downloading..." : "Download"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-neutral-900/30 rounded-lg p-4 border border-neutral-700">
            <p className="text-sm text-neutral-400 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
              <Check className="w-4 h-4 text-green-400" />
              {receivedFiles.length > 1 
                ? "Tap on any file above to download it"
                : "Tap the download button to save the file to your device"}
            </p>
          </div>
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
          <div className="group relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50 hover:border-green-500/30 rounded-2xl p-6 sm:p-8 animate-fade-in transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all" />
            
            <div className="relative">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2">
                    <Upload className="w-6 h-6 text-green-400" />
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
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-800/50 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSendFile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-green-500/20 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Send File
                </button>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="flex-1 px-6 py-3 bg-neutral-800/50 border-2 border-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-800 hover:border-neutral-600 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isSending || isReceiving) {
    return (
      <div className="group relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50 rounded-2xl p-6 sm:p-8 animate-fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                {isSending ? (
                  <>
                    <Upload className="w-6 h-6 text-green-400" />
                    Sending File
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6 text-green-400" />
                    Receiving File
                  </>
                )}
              </h3>
              <button
                onClick={cancelTransfer}
                className="px-4 py-2 text-sm bg-neutral-800/50 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>

            {fileName && (
              <p className="text-neutral-300 mb-6 text-base sm:text-lg break-words flex items-center gap-2">
                <File className="w-5 h-5 text-green-400 flex-shrink-0" />
                {fileName}
              </p>
            )}

            <div className="w-full bg-neutral-700 rounded-full overflow-hidden h-3 mb-4">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">
                Chunk {currentChunk} of {totalChunks}
              </span>
              <span className="font-semibold text-green-400 text-base">
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
      </div>
    );
  }

  if (transferComplete) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-2xl p-8 sm:p-12 text-center animate-fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6 animate-pulse">
            <Check className="w-10 h-10 text-green-400" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Transfer Complete
          </h3>
          <p className="text-base sm:text-lg text-green-400 font-semibold mb-6">
            {role === "sender"
              ? "File delivered successfully"
              : "File saved to your device"}
          </p>

          {fileName && (
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-700 mb-6 max-w-md mx-auto">
              <p className="text-sm text-green-400 font-medium break-words flex items-center justify-center gap-2">
                <File className="w-4 h-4 flex-shrink-0" />
                {fileName}
              </p>
            </div>
          )}

          {role === "sender" && (
            <button
              onClick={handleReset}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-green-500/20 hover:scale-105 flex items-center justify-center gap-2 mx-auto"
            >
              <Upload className="w-5 h-5" />
              Send Another File
            </button>
          )}
        </div>
      </div>
    );
  }

  if (role === "receiver") {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50 rounded-2xl p-8 sm:p-12 text-center animate-fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-700/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6 border border-green-500/20">
            <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Waiting for Files
          </h3>
          <p className="text-neutral-400 text-sm sm:text-base">
            The sender will choose files to transfer
          </p>
        </div>
      </div>
    );
  }

  return null;
};