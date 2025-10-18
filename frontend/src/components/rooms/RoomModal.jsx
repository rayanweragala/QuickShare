import { useEffect, useState, useRef } from "react";
import { roomAPI } from "../../api/hooks/useRooms";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "../common";
import { getOrCreateUserId, generateSessionId } from "../../utils/userManager";
import { useRoomSocket } from "../../api/hooks/useRoomSocket";
import FileCard from "../common/FileCard";
import {
  X,
  Users,
  Upload,
  Settings,
  Trash2,
  Copy,
  Check,
  Crown,
  Clock,
  Eye,
  Edit2,
  Save,
  LogOut,
  Share2,
  FileText,
  AlertCircle,
} from "lucide-react";
import FileUploadModal from "./FileUploadModal";
import { useFileDownload, useFileDelete } from "../../api/hooks/useFileUpload";
import { logger } from "../../utils/logger";

const RoomModal = ({ isOpen, onClose, roomCode }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("members");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoomName, setEditedRoomName] = useState("");
  const [userId] = useState(getOrCreateUserId());
  const [socketId] = useState(generateSessionId());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const hasJoinedRef = useRef(false);

  const downloadMutation = useFileDownload();
  const deleteMutation = useFileDelete(roomCode || "");

  const joinMutation = useMutation({
    mutationFn: () => roomAPI.joinRoom(roomCode, socketId, userId),
    onSuccess: (data) => {
      setEditedRoomName(data.room.roomName);
      queryClient.setQueryData(["roomDetails", data.room.id], data);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (roomId) => roomAPI.leaveRoom(roomId, socketId),
    onSuccess: () => {
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen && roomCode && joinMutation && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      joinMutation.mutate();
    }

    return () => {
      if (!isOpen) {
        hasJoinedRef.current = false;
      }
    };
  }, [isOpen, roomCode, joinMutation]);

  const { isConnected: wsConnected } = useRoomSocket(
    roomCode,
    joinMutation.data?.room?.id,
    isOpen && !!joinMutation.data?.room?.id
  );

  const { data: roomData } = useQuery({
    queryKey: ["roomDetails", joinMutation.data?.room?.id],
    queryFn: () => roomAPI.getRoomDetails(joinMutation.data.room.id),
    enabled: !!joinMutation.data?.room?.id && isOpen,
    staleTime: 60000,
    initialData: joinMutation.data,
  });

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDownload = async (file) => {
    try {
      if (downloadMutation) {
        await downloadMutation.mutateAsync({
          roomCode,
          fileId: file.fileId,
          fileName: file.fileName,
        });
      }
    } catch (error) {
      logger.error("Download failed:", error);
    }
  };
  const handleDeleteFile = async (fileId) => {
    if (!roomCode || !deleteMutation) {
      logger.error("Cannot delete: room not loaded");
      return;
    }
    try {
      await deleteMutation.mutateAsync({ fileId });
    } catch (error) {
      logger.error("Delete failed:", error);
    }
  };

  const handleLeaveRoom = () => {
    if (roomData?.room?.id) {
      leaveMutation.mutate(roomData.room.id);
    } else {
      onClose();
    }
  };

  const currentUser = roomData?.participants?.find(
    (p) => p.socketId === socketId
  );
  const isCreator = currentUser?.isCreator || false;

  if (!isOpen) return null;

  if (joinMutation?.isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700 p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-neutral-700 border-t-green-500 rounded-full animate-spin" />
            <p className="text-neutral-300 font-medium">Joining room...</p>
          </div>
        </div>
      </div>
    );
  }

  if (joinMutation?.isError) {
    return (
      <ErrorMessage
        message={joinMutation.error?.message || "Failed to Join Room"}
        onDismiss={onClose}
        className="mb-4"
      />
    );
  }

  if (!roomData) return null;

  const { room, participants = [], files = [], stats } = roomData;
  const storagePercent =
    (room.currentStorageBytes / room.maxStorageBytes) * 100;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className="w-full max-w-4xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl my-8">
          <div className="relative bg-gradient-to-r from-green-900/40 via-emerald-900/40 to-green-900/40 border-b border-green-500/30 px-6 py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center text-3xl">
                  {room.roomIcon}
                </div>
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedRoomName}
                        onChange={(e) => setEditedRoomName(e.target.value)}
                        className="px-3 py-1 bg-neutral-800/50 border border-neutral-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      />
                      <button
                        onClick={() => setIsEditing(false)}
                        className="p-1 hover:bg-green-500/20 rounded text-green-400"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">
                        {room.roomName}
                      </h2>
                      {isCreator && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1 hover:bg-green-500/20 rounded text-green-400 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-neutral-400">
                    by {room.creatorAnimalName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800/50 rounded-lg">
                  <span className="text-xs text-neutral-400">Code:</span>
                  <span className="text-sm font-mono font-bold text-green-400">
                    {room.roomCode}
                  </span>
                  <button
                    onClick={copyRoomCode}
                    className="p-1 hover:bg-green-500/20 rounded transition-colors"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-neutral-400 hover:text-green-400" />
                    )}
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-800/50 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-green-500/20">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-white font-semibold">
                  {participants.length}
                </span>
                <span className="text-neutral-400">
                  / {room.maxParticipants || "∞"}
                </span>
              </div>

              <div className="h-4 w-px bg-neutral-700"></div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-semibold">
                  {formatTimeRemaining(room.expiresAt)}
                </span>
                <span className="text-neutral-400">left</span>
              </div>

              <div className="h-4 w-px bg-neutral-700"></div>

              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-white font-semibold">
                  {room.totalVisitors}
                </span>
                <span className="text-neutral-400">visitors</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-6 pt-4 border-b border-neutral-700/50">
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === "members"
                  ? "text-green-400 border-b-2 border-green-400"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Members ({participants.length})
              </div>
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === "files"
                  ? "text-green-400 border-b-2 border-green-400"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Files ({files.length})
              </div>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === "settings"
                  ? "text-green-400 border-b-2 border-green-400"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </button>
          </div>

          <div className="p-6 max-h-[500px] overflow-y-auto">
            {activeTab === "members" && (
              <div className="space-y-3">
                {participants.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No members yet</p>
                  </div>
                ) : (
                  participants.map((participant) => (
                    <div
                      key={participant.socketId}
                      className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50 hover:border-neutral-600 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold"
                          style={{
                            backgroundColor: `${participant.avatarColor}20`,
                            color: participant.avatarColor,
                          }}
                        >
                          {participant.animalIcon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {participant.animalName}
                            </span>
                            {participant.isCreator && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 rounded text-xs text-yellow-400 border border-yellow-500/30">
                                <Crown className="w-3 h-3" />
                                Creator
                              </div>
                            )}
                            {participant.socketId === socketId && (
                              <span className="px-2 py-0.5 bg-green-500/20 rounded text-xs text-green-400 border border-green-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span>
                              Joined{" "}
                              {new Date(
                                participant.joinedAt
                              ).toLocaleTimeString()}
                            </span>
                            {participant.isOnline && (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                Online
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isCreator && !participant.isCreator && (
                        <button
                          className="p-2 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-all"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "files" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-neutral-400 mb-2">
                      Storage Usage
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${Math.min(storagePercent, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-neutral-400 whitespace-nowrap min-w-[120px] text-right">
                        {formatBytes(room.currentStorageBytes)} /{" "}
                        {formatBytes(room.maxStorageBytes)}
                      </span>
                    </div>
                  </div>

                  {(!room.creatorOnlyUpload || isCreator) && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="ml-4 px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-green-500/25"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  )}
                </div>

                {room.creatorOnlyUpload && !isCreator && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-400 font-medium">
                        Upload Restricted
                      </p>
                      <p className="text-xs text-yellow-400/80 mt-1">
                        Only the room creator can upload files
                      </p>
                    </div>
                  </div>
                )}

                {files.length === 0 ? (
                  <div className="text-center py-16 text-neutral-400">
                    <div className="w-20 h-20 mx-auto mb-4 bg-neutral-800 rounded-2xl flex items-center justify-center">
                      <FileText className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="text-lg font-medium mb-2">
                      No files shared yet
                    </p>
                    {(!room.creatorOnlyUpload || isCreator) && (
                      <p className="text-sm">
                        Be the first to share a file with the room!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {files.map((file) => {
                      const canDelete =
                        isCreator || file.uploaderSocketId === socketId;

                      return (
                        <FileCard
                          key={file.fileId}
                          file={file}
                          onDownload={handleDownload}
                          onDelete={handleDeleteFile}
                          canDelete={canDelete}
                          isDownloading={downloadMutation?.isPending || false}
                          isDeleting={deleteMutation?.isPending || false}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4">
                <div className="p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                  <h3 className="font-semibold text-white mb-3">
                    Room Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Visibility</span>
                      <span className="text-white font-medium">
                        {room.visibility}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">
                        Creator Only Upload
                      </span>
                      <span className="text-white font-medium">
                        {room.creatorOnlyUpload ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Created At</span>
                      <span className="text-white font-medium">
                        {new Date(room.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Expires At</span>
                      <span className="text-white font-medium">
                        {new Date(room.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      const shareLink = `https://app.quickshare.com/room/${room.roomCode}`;
                      navigator.clipboard.writeText(shareLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="w-full px-4 py-3 bg-neutral-800/50 hover:bg-neutral-700 border border-neutral-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        Share Room Link
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleLeaveRoom}
                    className="w-full px-4 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 text-yellow-400 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Room
                  </button>

                  {isCreator && (
                    <button className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Room
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        roomCode={roomCode}
        isCreatorOnly={room.creatorOnlyUpload}
        isCreator={isCreator}
      />
    </>
  );
};

export default RoomModal;
