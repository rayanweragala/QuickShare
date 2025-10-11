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
  const [receivedFileData, setReceivedFileData] = useState(null);

  /**
   * send file through WebRTC
   */
  const sendFile = useCallback(async (file) => {
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

      await fileTransferService.sendFile(file);
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
    setReceivedFileData(null);
  }, []);

  const downloadReceivedFile = useCallback(() => {
    if (receivedFileData) {
      downloadFile(receivedFileData.blob, receivedFileData.metadata.name);
      setTransferComplete(true);
      setReceivedFileData(null);
    }
  }, [receivedFileData]);

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
      setReceivedFileData({ blob, metadata });
      // downloadFile(blob, metadata.name);
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

    // cleanup
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
    receivedFileData,
    sendFile,
    cancelTransfer,
    resetTransfer,
    downloadReceivedFile,
  };
};
