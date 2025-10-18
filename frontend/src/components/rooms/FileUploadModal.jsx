import { useState, useRef } from "react";
import {
  X,
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileArchive,
} from "lucide-react";
import { useFileUpload } from "../../api/hooks/useFileUpload";
import { logger } from "../../utils/logger";


const FileUploadModal = ({ isOpen, onClose, roomCode, isCreatorOnly, isCreator }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const uploadMutation = useFileUpload(roomCode);

  const canUpload = !isCreatorOnly || isCreator;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const maxSize = 5 * 1024 * 1024 * 1024; 
    if (file.size > maxSize) {
      alert("File size exceeds maximum allowed (5GB)");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        onProgress: (progress) => setUploadProgress(progress),
      });

      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        onClose();
      }, 1500);
    } catch (error) {
      logger.error("Upload failed:", error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-6 h-6" />;
    if (fileType.startsWith("video/")) return <Video className="w-6 h-6" />;
    if (fileType.startsWith("audio/")) return <Music className="w-6 h-6" />;
    if (fileType.includes("zip") || fileType.includes("rar"))
      return <FileArchive className="w-6 h-6" />;
    if (fileType.includes("pdf") || fileType.includes("document"))
      return <FileText className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  if (!isOpen) return null;

   if (!canUpload) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-md bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                Upload Restricted
              </h3>
              <p className="text-sm text-neutral-400 mb-4">
                Only the room creator can upload files to this room.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return(
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upload File</h2>
              <p className="text-sm text-neutral-400">
                Share files with room members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploadMutation.isPending}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
              dragActive
                ? "border-green-500 bg-green-500/10"
                : "border-neutral-700 bg-neutral-800/30"
            } ${uploadMutation.isPending ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              className="hidden"
              disabled={uploadMutation.isPending}
            />

            {!selectedFile ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-2xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Drop your file here
                </h3>
                <p className="text-sm text-neutral-400 mb-4">
                  or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Choose File
                </button>
                <p className="text-xs text-neutral-500 mt-4">
                  Maximum file size: 5GB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-neutral-800 rounded-xl border border-neutral-700">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400 flex-shrink-0">
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">
                      {selectedFile.name}
                    </h4>
                    <p className="text-sm text-neutral-400">
                      {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                  {!uploadMutation.isPending && (
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-neutral-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {uploadMutation.isPending && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">
                        {uploadProgress < 100 ? "Uploading..." : "Processing..."}
                      </span>
                      <span className="text-green-400 font-semibold">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadMutation.isSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">
                      File uploaded successfully!
                    </span>
                  </div>
                )}

                {uploadMutation.isError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-red-400">
                      {uploadMutation.error?.message || "Upload failed"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedFile && !uploadMutation.isSuccess && (
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload File
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileUploadModal;