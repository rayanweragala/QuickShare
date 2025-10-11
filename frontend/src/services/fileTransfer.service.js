import { logger } from '../utils/logger';
import { webrtcService } from './webrtc.service';
import { chunkFile } from '../utils/file.utils';

/**
 * file Transfer Service - Handles chunked file transfers over WebRTC
 */

const CHUNK_SIZE = 16 * 1024; 
const METADATA_TYPE = 'metadata';
const CHUNK_TYPE = 'chunk';
const COMPLETE_TYPE = 'complete';

class FileTransferService {
  constructor() {
    this.isSending = false;
    this.isReceiving = false;
    
    this.currentFile = null;
    this.chunks = [];
    this.currentChunkIndex = 0;
    
    this.receivedChunks = [];
    this.fileMetadata = null;
    this.receivedBytes = 0;
    
    this.onSendProgress = null;
    this.onReceiveProgress = null;
    this.onSendComplete = null;
    this.onReceiveComplete = null;
    this.onError = null;
  }

  /**
   * send file through WebRTC data channel
   */
  async sendFile(file) {
    if (this.isSending) {
      throw new Error('Already sending a file');
    }

    if (!webrtcService.isChannelReady()) {
      throw new Error('Data channel not ready');
    }

    try {
      this.isSending = true;
      this.currentFile = file;
      this.currentChunkIndex = 0;

      logger.info('Starting file transfer:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      await this.sendMetadata(file);

      this.chunks = chunkFile(file, CHUNK_SIZE);
      logger.info(`File split into ${this.chunks.length} chunks`);

      await this.sendChunks();

    } catch (error) {
      logger.error('File transfer failed:', error);
      this.isSending = false;
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  /**
   * send file metadata
   * @param {File} file
   */
  async sendMetadata(file) {
    const metadata = {
      type: METADATA_TYPE,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      lastModified: file.lastModified,
      totalChunks: Math.ceil(file.size / CHUNK_SIZE),
    };

    logger.info('Sending metadata:', metadata);
    webrtcService.send(JSON.stringify(metadata));

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * send file chunks with flow control
   */
  async sendChunks() {
    const totalChunks = this.chunks.length;

    for (let i = 0; i < totalChunks; i++) {
      if (!this.isSending) {
        logger.warn('Transfer cancelled');
        return;
      }

      while (webrtcService.getBufferedAmount() > CHUNK_SIZE * 10) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const chunk = this.chunks[i];
      const arrayBuffer = await chunk.arrayBuffer();

      const chunkMessage = {
        type: CHUNK_TYPE,
        index: i,
        data: Array.from(new Uint8Array(arrayBuffer)),
      };

      webrtcService.send(JSON.stringify(chunkMessage));

      this.currentChunkIndex = i + 1;

      const progress = ((i + 1) / totalChunks) * 100;
      if (this.onSendProgress) {
        this.onSendProgress(progress, i + 1, totalChunks);
      }

      logger.debug(`Sent chunk ${i + 1}/${totalChunks}`);
    }

    this.sendComplete();
  }

  /**
   * send transfer complete message
   */
  sendComplete() {
    const completeMessage = {
      type: COMPLETE_TYPE,
    };

    webrtcService.send(JSON.stringify(completeMessage));
    logger.success('File transfer complete');

    this.isSending = false;
    
    if (this.onSendComplete) {
      this.onSendComplete(this.currentFile);
    }

    this.reset();
  }

  /**
   * handle received data from WebRTC
   */
  handleReceivedData(data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case METADATA_TYPE:
          this.handleMetadata(message);
          break;

        case CHUNK_TYPE:
          this.handleChunk(message);
          break;

        case COMPLETE_TYPE:
          this.handleComplete();
          break;

        default:
          logger.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      logger.error('Failed to handle received data:', error);
    }
  }

  /**
   * handle received metadata
   */
  handleMetadata(metadata) {
    logger.info('Received file metadata:', metadata);
    
    this.isReceiving = true;
    this.fileMetadata = metadata;
    this.receivedChunks = new Array(metadata.totalChunks);
    this.receivedBytes = 0;
  }

  /**
   * handle received chunk
   */
  handleChunk(chunkMessage) {
    const { index, data } = chunkMessage;
    
    const uint8Array = new Uint8Array(data);
    this.receivedChunks[index] = uint8Array;
    this.receivedBytes += uint8Array.length;

    const progress = (this.receivedBytes / this.fileMetadata.size) * 100;
    if (this.onReceiveProgress) {
      this.onReceiveProgress(
        progress,
        index + 1,
        this.fileMetadata.totalChunks
      );
    }

    logger.debug(`Received chunk ${index + 1}/${this.fileMetadata.totalChunks}`);
  }

  /**
   * handle transfer complete
   */
  handleComplete() {
    logger.success('File transfer complete, reconstructing file...');

    try {
      const blob = new Blob(this.receivedChunks, {
        type: this.fileMetadata.mimeType,
      });

      logger.success('File reconstructed:', {
        name: this.fileMetadata.name,
        size: blob.size,
      });

      this.isReceiving = false;

      if (this.onReceiveComplete) {
        this.onReceiveComplete(blob, this.fileMetadata);
      }

      this.reset();

    } catch (error) {
      logger.error('Failed to reconstruct file:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * cancel ongoing transfer
   */
  cancel() {
    logger.info('Cancelling file transfer...');
    this.isSending = false;
    this.isReceiving = false;
    this.reset();
  }

  /**
   * reset transfer state
   */
  reset() {
    this.currentFile = null;
    this.chunks = [];
    this.currentChunkIndex = 0;
    this.receivedChunks = [];
    this.fileMetadata = null;
    this.receivedBytes = 0;
  }

  /**
   * get current transfer status
   */
  getStatus() {
    return {
      isSending: this.isSending,
      isReceiving: this.isReceiving,
      currentFile: this.currentFile?.name,
      progress: this.isSending
        ? (this.currentChunkIndex / this.chunks.length) * 100
        : (this.receivedBytes / this.fileMetadata?.size) * 100 || 0,
    };
  }
}

export const fileTransferService = new FileTransferService();