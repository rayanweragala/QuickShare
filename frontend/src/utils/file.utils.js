/**
 * file utility function for handling file operations
 */

/**
 * format file size to readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * get file extension from filename
 */
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

/**
 * get file icon base on file type
 */
export const getFileIcon = (filename) => {
  const ext = getFileExtension(filename).toLowerCase();

  const iconMap = {
    pdf: "document",
    doc: "document",
    docx: "document",
    txt: "document",
    rtf: "document",

    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    svg: "image",
    webp: "image",

    mp4: "video",
    avi: "video",
    mov: "video",
    mkv: "video",
    webm: "video",

    mp3: "audio",
    wav: "audio",
    flac: "audio",
    m4a: "audio",

    zip: "archive",
    rar: "archive",
    "7z": "archive",
    tar: "archive",
    gz: "archive",

    js: "code",
    jsx: "code",
    ts: "code",
    tsx: "code",
    html: "code",
    css: "code",
    json: "code",
    xml: "code",
    py: "code",
    java: "code",
  };

  return iconMap[ext] || "file";
};

/**
 * validate file before transfer - maxSize = Maximum file size in bytes (default: 2GB)
 */

export const validateFile = (file, maxSize = 2 * 1024 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds ${formatFileSize(maxSize)}` 
    };
  }

  return { valid: true, error: null };
};

/**
 * convert file to ArrayBuffer
 */
export const fileToArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * convert arraybuffer to blob
 */
export const arrayBufferToBlob = (buffer, type) => {
  return new Blob([buffer], { type });
};

/**
 * download file from blob
 */
export const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * calculate transfer speed
 */
export const calculateSpeed = (bytesTransferred, timeElapsed) => {
  if (timeElapsed === 0) return '0 B/s';
  
  const bytesPerSecond = (bytesTransferred / timeElapsed) * 1000;
  return formatFileSize(bytesPerSecond) + '/s';
};

/**
 * calculate estimated time remaining
 */
export const calculateTimeRemaining = (bytesRemaining, bytesPerSecond) => {
  if (bytesPerSecond === 0) return 'Calculating...';
  
  const secondsRemaining = bytesRemaining / bytesPerSecond;
  
  if (secondsRemaining < 60) {
    return `${Math.ceil(secondsRemaining)}s`;
  } else if (secondsRemaining < 3600) {
    const minutes = Math.ceil(secondsRemaining / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.ceil((secondsRemaining % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

/**
 * chunk file for transfer
 */
export const chunkFile = (file, chunkSize = 16 * 1024) => {
  const chunks = [];
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }

  return chunks;
};