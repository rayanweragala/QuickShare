import { useState } from "react";
import {
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileArchive,
  File,
  MoreVertical,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";

const FileCard = ({
  file,
  onDownload,
  onDelete,
  canDelete,
  downloadMutation,
  isDeleting,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const getFileIcon = (fileType) => {
    if (!fileType) return <File className="w-6 h-6" />;
    
    if (fileType.startsWith("image/"))
      return <ImageIcon className="w-6 h-6 text-blue-400" />;
    if (fileType.startsWith("video/"))
      return <Video className="w-6 h-6 text-purple-400" />;
    if (fileType.startsWith("audio/"))
      return <Music className="w-6 h-6 text-pink-400" />;
    if (fileType.includes("zip") || fileType.includes("rar"))
      return <FileArchive className="w-6 h-6 text-orange-400" />;
    if (fileType.includes("pdf"))
      return <FileText className="w-6 h-6 text-red-400" />;
    return <FileText className="w-6 h-6 text-green-400" />;
  };

  const getFileColor = (fileType) => {
    if (!fileType) return "from-neutral-500/20 to-neutral-600/20";
    
    if (fileType.startsWith("image/"))
      return "from-blue-500/20 to-blue-600/20";
    if (fileType.startsWith("video/"))
      return "from-purple-500/20 to-purple-600/20";
    if (fileType.startsWith("audio/"))
      return "from-pink-500/20 to-pink-600/20";
    if (fileType.includes("zip") || fileType.includes("rar"))
      return "from-orange-500/20 to-orange-600/20";
    if (fileType.includes("pdf"))
      return "from-red-500/20 to-red-600/20";
    return "from-green-500/20 to-emerald-600/20";
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleCopyLink = () => {
    if (file.downloadUrl) {
      navigator.clipboard.writeText(file.downloadUrl);
    }
    setShowMenu(false);
  };

  const isThisFileDownloading = downloadMutation.isPending && downloadMutation.variables?.fileId === file.fileId;

  return (
    <div className="group relative bg-neutral-800/50 rounded-xl border border-neutral-700/50 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300">
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 bg-gradient-to-br ${getFileColor(
              file.fileType
            )} rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:scale-105 transition-transform duration-300`}
          >
            {getFileIcon(file.fileType)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white truncate text-base mb-1">
                  {file.fileName}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-neutral-500 rounded-full"></span>
                    {formatBytes(file.fileSize)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-neutral-500 rounded-full"></span>
                    {file.uploaderAnimalName}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-neutral-500 rounded-full"></span>
                    {formatTimeAgo(file.uploadedAt)}
                  </span>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-8 z-20 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                      <button
                        onClick={handleCopyLink}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => {
                          window.open(file.downloadUrl, "_blank");
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in New Tab
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-700/50 rounded-md">
                <Download className="w-3 h-3 text-green-400" />
                <span className="text-xs font-medium text-neutral-300">
                  {file.downloadCount} downloads
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-700/50">
          <button
            onClick={() => onDownload(file)}
            disabled={isThisFileDownloading}
            className="flex-1 px-4 py-2 bg-green-600/80 hover:bg-green-600 disabled:bg-neutral-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isThisFileDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download
              </>
            )}
          </button>

          {canDelete && (
            <>
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onDelete(file.fileId);
                      setDeleteConfirm(false);
                    }}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    {isDeleting ? "Deleting..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-4 py-2 hover:bg-red-500/20 border border-neutral-700 hover:border-red-500/30 rounded-lg text-neutral-400 hover:text-red-400 transition-all"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCard;
