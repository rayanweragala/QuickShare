import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { roomAPI } from "../../api/hooks/useRooms";
import { Users, Globe, Search, Download, FileIcon, X } from "lucide-react";

export const PublicRoomsList = ({ onJoinRoom, isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ["publicRooms", page, searchQuery],
    queryFn: () =>
      searchQuery
        ? roomAPI.searchRooms(searchQuery, page, 10)
        : roomAPI.getPublicRooms(page, 10),
  });

  const rooms = roomsData?.content || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl h-[90vh] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden flex flex-col">
        <div className="relative bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-b border-green-500/30 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Public Rooms</h2>
                <p className="text-sm text-neutral-400">
                  Discover and join sharing spaces
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-800/50 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search public rooms..."
              className="w-full pl-12 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-neutral-700 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No public rooms found</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50 rounded-xl hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => onJoinRoom(room.roomCode)}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{room.roomIcon}</span>
                          <h3 className="font-bold text-white group-hover:text-green-400 transition-colors">
                            {room.roomName || "Untitled Room"}
                          </h3>
                        </div>
                        <p className="text-sm text-neutral-400">
                          by {room.creatorAnimalName}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                        {room.roomCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {room.participantCount}/{room.maxParticipants}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileIcon className="w-3.5 h-3.5" />
                        <span>{room.fileCount || 0} files</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        <span>{room.totalDownloads || 0} downloads</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {roomsData && roomsData.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-neutral-800/50 border-2 border-neutral-700 text-neutral-300 font-semibold rounded-lg disabled:opacity-50 hover:bg-neutral-800 hover:border-neutral-600 hover:text-white transition-all"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-neutral-400 self-center">
                Page {page + 1} of {roomsData.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= roomsData.totalPages - 1}
                className="px-4 py-2 bg-neutral-800/50 border-2 border-neutral-700 text-neutral-300 font-semibold rounded-lg disabled:opacity-50 hover:bg-neutral-800 hover:border-neutral-600 hover:text-white transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
