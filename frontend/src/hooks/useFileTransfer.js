import { useState, useCallback, useEffect } from "react";
import { fileTransferService } from "../services/fileTransfer.service";
import { webrtcService } from "../services/webrtc.service";
import { logger } from "../utils/logger";
import { validateFile, downloadFile } from "../utils/file.utils";

export const useFileTransfer = () => {
  const [isSending, setIsSending] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(null);
  const [transferComplete, setTransferComplete] = useState(false);
  const [receivedFiles, setReceivedFiles] = useState([]); 
  const [currentlyDownloading, setCurrentlyDownloading] = useState(null);

  /**
   * send file through WebRTC
   */
  const sendFile = useCallback(async (file, receiverIds = null) => {
    setError(null);
    setTransferComplete(false);

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    try {
      logger.info("Starting file send:", file.name);
      setIsSending(true);
      setFileName(file.name);
      setProgress(0);

      await fileTransferService.sendFile(file, receiverIds);
    } catch (err) {
      logger.error("File send failed:", err);
      setError(err.message || "Failed to send file");
      setIsSending(false);
    }
  }, []);

  /**
   * cancel ongoing transfer
   */
  const cancelTransfer = useCallback(() => {
    logger.info("Cancelling file transfer...");
    fileTransferService.cancel();
    setIsSending(false);
    setIsReceiving(false);
    setProgress(0);
    setCurrentChunk(0);
    setTotalChunks(0);
  }, []);

  /**
   * reset transfer state
   */
  const resetTransfer = useCallback(() => {
    setIsSending(false);
    setIsReceiving(false);
    setProgress(0);
    setCurrentChunk(0);
    setTotalChunks(0);
    setFileName("");
    setError(null);
    setTransferComplete(false);
    setReceivedFiles([]);
    setCurrentlyDownloading(null);
  }, []);

  /**
   * download a specific file from the queue
   */
  const downloadReceivedFile = useCallback(
    (fileIndex) => {
      if (fileIndex >= 0 && fileIndex < receivedFiles.length) {
        const file = receivedFiles[fileIndex];
        setCurrentlyDownloading(fileIndex);
        downloadFile(file.blob, file.metadata.name);

        setTimeout(() => {
          setReceivedFiles((prev) =>
            prev.filter((_, idx) => idx !== fileIndex)
          );
          setCurrentlyDownloading(null);
        }, 500);
      }
    },
    [receivedFiles]
  );

  /**
   * file transfer callbacks
   */
  useEffect(() => {
    fileTransferService.onSendProgress = (progressPercent, chunk, total) => {
      setProgress(Math.round(progressPercent));
      setCurrentChunk(chunk);
      setTotalChunks(total);
    };

    fileTransferService.onSendComplete = (file) => {
      logger.success("File send complete:", file.name);
      setIsSending(false);
      setTransferComplete(true);
    };

    fileTransferService.onReceiveProgress = (progressPercent, chunk, total) => {
      setIsReceiving(true);
      setProgress(Math.round(progressPercent));
      setCurrentChunk(chunk);
      setTotalChunks(total);
    };

    fileTransferService.onReceiveComplete = (blob, metadata) => {
      logger.success("File receive complete:", metadata.name);
      setIsReceiving(false);
      setFileName(metadata.name);

      setReceivedFiles((prev) => [...prev, { blob, metadata }]);

      setProgress(0);
      setCurrentChunk(0);
      setTotalChunks(0);
    };

    fileTransferService.onError = (err) => {
      logger.error("Transfer error:", err);
      setError(err.message || "Transfer failed");
      setIsSending(false);
      setIsReceiving(false);
    };

    webrtcService.onDataChannelMessage = (data) => {
      fileTransferService.handleReceivedData(data);
    };

    return () => {
      fileTransferService.onSendProgress = null;
      fileTransferService.onSendComplete = null;
      fileTransferService.onReceiveProgress = null;
      fileTransferService.onReceiveComplete = null;
      fileTransferService.onError = null;
      webrtcService.onDataChannelMessage = null;
    };
  }, []);

  return {
    isSending,
    isReceiving,
    progress,
    currentChunk,
    totalChunks,
    fileName,
    error,
    transferComplete,
    receivedFiles,
    currentlyDownloading,
    sendFile,
    cancelTransfer,
    resetTransfer,
    downloadReceivedFile,
  };
};
