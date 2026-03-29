import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Crown,
  Eye,
  FileText,
  Settings,
  Star,
  Upload,
  Users,
} from "lucide-react";
import { roomAPI } from "../../api/hooks/useRooms";
import { useFileDelete, useFileDownload } from "../../api/hooks/useFileUpload";
import { useRoomSocket } from "../../api/hooks/useRoomSocket";
import { generateSessionId, getOrCreateUserId } from "../../utils/userManager";
import { Button, Dialog, DialogContent, DialogTitle, ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger } from "../ui";
import FileCard from "./FileCard";
import FileUploadZone from "./FileUploadZone";
import MemberCard from "./MemberCard";
import RoomCodeBadge from "./RoomCodeBadge";
import StorageBar from "./StorageBar";

function formatRemaining(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
}

export default function RoomDialog({ open, onOpenChange, roomCode }) {
  const queryClient = useQueryClient();
  const userId = useRef(getOrCreateUserId());
  const socketId = useRef(generateSessionId());
  const [tab, setTab] = useState("members");
  const [showUpload, setShowUpload] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [pendingDelete, setPendingDelete] = useState(false);
  const joinedRef = useRef(false);

  const joinMutation = useMutation({
    mutationFn: () => roomAPI.joinRoom(roomCode, socketId.current, userId.current),
  });
  const { mutate: joinRoom } = joinMutation;

  useEffect(() => {
    if (open && roomCode && !joinedRef.current) {
      joinedRef.current = true;
      joinRoom();
    }
    if (!open) joinedRef.current = false;
  }, [open, roomCode, joinRoom]);

  const roomId = joinMutation.data?.room?.id;
  useRoomSocket(roomCode, roomId, open && Boolean(roomId));

  const detailsQuery = useQuery({
    queryKey: ["roomDetails", roomId],
    queryFn: () => roomAPI.getRoomDetails(roomId),
    enabled: open && Boolean(roomId),
    initialData: joinMutation.data,
  });

  const details = detailsQuery.data;
  const room = details?.room;
  const participants = useMemo(() => details?.participants || [], [details?.participants]);
  const files = useMemo(() => details?.files || [], [details?.files]);

  useEffect(() => {
    if (room?.roomName) setRoomName(room.roomName);
  }, [room?.roomName]);

  const current = useMemo(() => participants.find((item) => item.socketId === socketId.current), [participants]);
  const isCreator = Boolean(current?.isCreator);

  const updateMutation = useMutation({
    mutationFn: (payload) => roomAPI.updateRoom(room.id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["roomDetails", room.id], (old) => ({ ...old, room: updated }));
      setEditingName(false);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => roomAPI.leaveRoom(room.id, socketId.current),
    onSuccess: () => onOpenChange(false),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: () => roomAPI.deleteRoom(room.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicRooms"] });
      queryClient.invalidateQueries({ queryKey: ["privateRooms"] });
      queryClient.invalidateQueries({ queryKey: ["userFeaturedRooms"] });
      onOpenChange(false);
    },
  });

  const downloadMutation = useFileDownload();
  const deleteFileMutation = useFileDelete(roomCode || "");

  const toggleDeleteConfirm = () => {
    setPendingDelete(true);
    setTimeout(() => setPendingDelete(false), 3000);
  };

  const toggleFeatured = () => {
    if (!room) return;
    const previous = room.isFeatured;
    queryClient.setQueryData(["roomDetails", room.id], (old) => ({ ...old, room: { ...old.room, isFeatured: !previous } }));
    updateMutation.mutate(
      { roomName: room.roomName, isFeatured: !previous },
      {
        onError: () => {
          queryClient.setQueryData(["roomDetails", room.id], (old) => ({ ...old, room: { ...old.room, isFeatured: previous } }));
        },
      }
    );
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-[100vw] max-w-5xl overflow-hidden p-0 md:h-[84vh] md:rounded-[var(--radius-xl)]">
        <DialogTitle className="sr-only">Room Details</DialogTitle>
        <div className="grid h-full grid-cols-1 md:grid-cols-[280px_1fr]">
          <aside className="border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{room.roomIcon || "📦"}</span>
              {editingName && isCreator ? (
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onBlur={() => updateMutation.mutate({ roomName, isFeatured: room.isFeatured })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateMutation.mutate({ roomName, isFeatured: room.isFeatured });
                  }}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-2 py-1 text-sm"
                />
              ) : (
                <button type="button" onClick={() => isCreator && setEditingName(true)} className="text-left">
                  <p className="truncate text-lg font-semibold text-[var(--color-text-primary)]">{room.roomName}</p>
                </button>
              )}
            </div>

            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-violet-dim)] px-2 py-1 text-xs text-[var(--color-violet)]">
              <Crown className="h-3.5 w-3.5" />
              {room.creatorAnimalName}
            </div>

            <div className="mt-3">
              <RoomCodeBadge code={room.roomCode} />
            </div>

            <div className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--color-cyan)]" />
                {room.participantCount}/{room.maxParticipants}
              </p>
              <p className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--color-violet)]" />
                {room.fileCount} files
              </p>
              <p className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[var(--color-green)]" />
                {room.totalVisitors} visitors
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--color-amber)]" />
                {formatRemaining(room.expiresAt)}
              </p>
            </div>

            <div className="mt-4">
              <StorageBar current={room.currentStorageBytes} max={room.maxStorageBytes} />
            </div>

            <button
              type="button"
              onClick={toggleFeatured}
              aria-label="Toggle featured room"
              className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] px-3 py-1 text-sm"
            >
              <Star className={`h-4 w-4 ${room.isFeatured ? "fill-yellow-400 text-yellow-400" : ""}`} />
              {room.isFeatured ? "Featured" : "Feature"}
            </button>

            <Tabs value={tab} onValueChange={setTab} className="mt-5">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </Tabs>
          </aside>

          <main className="relative p-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsContent value="members" className="h-full">
                <ScrollArea className="h-[72vh]">
                  <div className="space-y-2">
                    {participants.map((member) => (
                      <MemberCard
                        key={member.socketId}
                        member={member}
                        isSelf={member.socketId === socketId.current}
                        isCreator={isCreator}
                        onRemove={() => {}}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="files" className="h-full">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-[var(--color-text-secondary)]">{files.length} files</p>
                  <Button onClick={() => setShowUpload((v) => !v)} variant="ghost">
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </div>
                <StorageBar current={room.currentStorageBytes} max={room.maxStorageBytes} />
                <div className="mt-3 space-y-2">
                  {files.map((file) => {
                    const isCurrentUserUploader = file.uploaderUserId === userId.current;
                    return (
                      <FileCard
                        key={file.fileId}
                        file={file}
                        align={isCurrentUserUploader ? "right" : "left"}
                        canDelete={isCurrentUserUploader || isCreator}
                        onDelete={(fileId) => deleteFileMutation.mutate({ fileId })}
                        onDownload={(item) =>
                          downloadMutation.mutate({
                            roomCode,
                            fileId: item.fileId,
                            fileName: item.fileName,
                          })
                        }
                      />
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="h-full">
                <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3 text-sm">
                  <p>Created: {new Date(room.createdAt).toLocaleString()}</p>
                  <p>Expires: {new Date(room.expiresAt).toLocaleString()}</p>
                  <p>Visibility: {room.visibility}</p>
                  <p>Upload Restriction: {room.creatorOnlyUpload ? "Creator only" : "Anyone"}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => navigator.clipboard.writeText(room.shareableLink || "")}>
                    Copy Share Link
                  </Button>
                  <Button variant="amber" onClick={() => leaveMutation.mutate()}>
                    Leave Room
                  </Button>
                  {isCreator && (
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (pendingDelete) {
                          deleteRoomMutation.mutate();
                        } else {
                          toggleDeleteConfirm();
                        }
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      {pendingDelete ? "Confirm Delete?" : "Delete Room"}
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <FileUploadZone roomCode={roomCode} isOpen={showUpload} onClose={() => setShowUpload(false)} />
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
