import { useState } from "react";
import { useFileTransfer } from "../../hooks/useFileTransfer";
import { ErrorMessage } from "../common";
import { FileSelector } from "./FileSelector";
import { TransferStatus } from "./TransferStatus";
import { logger } from "../../utils/logger";
import {
  Download,
  Upload,
  Check,
  X,
  File,
  Loader2,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";

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
      <div className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-900 hover:border-green-500/50 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <File className="w-5 h-5 text-green-400" />
              </div>
              Received Files ({receivedFiles.length})
            </h2>

            <div className="space-y-3">
              {receivedFiles.map((file, index) => (
                <div key={index} className="relative group/item">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl blur-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />

                  <div className="relative bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 hover:bg-zinc-800 hover:border-green-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <File className="w-5 h-5 text-green-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {file.metadata.name}
                        </p>
                        <p className="text-zinc-500 text-sm">
                          {formatFileSize(file.metadata.size)}
                        </p>
                      </div>

                      <button
                        onClick={() => downloadReceivedFile(index)}
                        disabled={currentlyDownloading !== null}
                        className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-400/50 text-green-400 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {currentlyDownloading === index
                          ? "Saving..."
                          : "Download"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
              <p className="text-sm text-zinc-400 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Click download to save files to your device
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "sender" && !isSending && !transferComplete) {
    return (
      <div className="space-y-4">
        {error && <ErrorMessage message={error} className="mb-4" />}

        <FileSelector onFileSelect={handleFileSelect} />

        {selectedFile && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-900 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Upload className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1">
                      Ready to Send
                    </h3>
                    <p className="font-medium text-green-400 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-zinc-500 text-sm">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all border border-zinc-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendFile}
                  className="flex-1 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-400/50 text-green-400 font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Send File
                </button>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg transition-all border border-zinc-700 hover:border-green-500/50"
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
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-900 hover:border-green-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                {isSending ? (
                  <Upload className="w-5 h-5 text-green-400" />
                ) : (
                  <Download className="w-5 h-5 text-green-400" />
                )}
              </div>
              <h3 className="text-xl font-bold text-white">
                {isSending ? "Sending File" : "Receiving File"}
              </h3>
            </div>
            <button
              onClick={cancelTransfer}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all text-sm border border-zinc-700"
            >
              Cancel
            </button>
          </div>

          {fileName && (
            <div className="mb-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
              <p className="text-white font-medium break-words flex items-center gap-2">
                <File className="w-4 h-4 text-green-400 flex-shrink-0" />
                {fileName}
              </p>
            </div>
          )}

          <div className="mb-6">
            <div className="w-full bg-zinc-800 rounded-full overflow-hidden h-2 mb-3">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">
                Chunk {currentChunk} of {totalChunks}
              </span>
              <span className="font-bold text-green-400">
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
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl opacity-100 animate-pulse" />

        <div className="relative bg-zinc-900/80 backdrop-blur-md border border-green-500/50 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-xl mb-4 border border-green-500/30">
            <Check className="w-8 h-8 text-green-400" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">
            Transfer Complete
          </h3>
          <p className="text-green-400 font-semibold mb-6">
            {role === "sender"
              ? "File delivered successfully"
              : "File saved to your device"}
          </p>

          {fileName && (
            <div className="mb-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 max-w-md mx-auto">
              <p className="text-sm text-green-400 font-medium break-words flex items-center justify-center gap-2">
                <File className="w-4 h-4 flex-shrink-0" />
                {fileName}
              </p>
            </div>
          )}

          {role === "sender" && (
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-400/50 text-green-400 font-bold rounded-lg transition-all flex items-center justify-center gap-2 mx-auto"
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
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-xl mb-4 border border-green-500/20">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Waiting for Files
          </h3>
          <p className="text-zinc-400 text-sm flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            The sender will choose files to transfer
          </p>
        </div>
      </div>
    );
  }

  return null;
};
