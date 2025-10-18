import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { roomAPI } from "../../api/hooks/useRooms";
import { 
  Users, 
  Globe, 
  Search, 
  Download, 
  File, 
  X, 
  Filter,
  ChevronDown,
  Clock,
  TrendingUp
} from "lucide-react";

export const PublicRoomsList = ({ onJoinRoom, isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters,setFilters] = useState({
    minParticipants : "",
    maxParticipants: "",
    minFiles: "",
    hasSpace: false,
    sortBy: "recent"
  });

  const buildQueryParams = () => {
    const params = {
      page,
      size: 10,
    };

    if (searchQuery) params.query = searchQuery;
    if (filters.minParticipants) params.minParticipants = filters.minParticipants;
    if (filters.maxParticipants) params.maxParticipants = filters.maxParticipants;
    if (filters.minFiles) params.minFiles = filters.minFiles;
    if (filters.hasSpace) params.hasSpace = true;
    if (filters.sortBy) params.sortBy = filters.sortBy;

    return params;
  };

    const { data: roomsData, isLoading } = useQuery({
    queryKey: ["publicRooms", page, searchQuery, filters],
    queryFn: () => {
      const params = buildQueryParams();
      const hasFilters = searchQuery || activeFilterCount > 0;
      return hasFilters 
        ? roomAPI.searchRoomsAdvanced(params)
        : roomAPI.getPublicRooms(page, 10);
    },
  });

  const rooms = roomsData?.content || [];

   const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

    const clearFilters = () => {
    setFilters({
      minParticipants: "",
      maxParticipants: "",
      minFiles: "",
      hasSpace: false,
      sortBy: "recent"
    });
    setPage(0);
  };

  const activeFilterCount = Object.values(filters).filter(v => 
    v !== "" && v !== false && v !== "recent"
  ).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl h-[90vh] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden flex flex-col">
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

        <div className="flex-shrink-0 p-6 space-y-4 border-b border-neutral-700/50">
          <div className="flex gap-3">
            <div className="relative flex-1">
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all flex items-center gap-2 ${
                showFilters || activeFilterCount > 0
                  ? "bg-green-500/20 border-green-500/50 text-green-300"
                  : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-green-400" />
                  Advanced Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Sort By
                  </label>
                  <div className="relative">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="popular">Most Popular</option>
                      <option value="mostFiles">Most Files</option>
                      <option value="leastCrowded">Least Crowded</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Minimum Files
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.minFiles}
                    onChange={(e) => handleFilterChange("minFiles", e.target.value)}
                    placeholder="Any"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Min Participants
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.minParticipants}
                    onChange={(e) => handleFilterChange("minParticipants", e.target.value)}
                    placeholder="Any"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.maxParticipants}
                    onChange={(e) => handleFilterChange("maxParticipants", e.target.value)}
                    placeholder="Any"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.hasSpace}
                  onChange={(e) => handleFilterChange("hasSpace", e.target.checked)}
                  className="w-4 h-4 rounded bg-neutral-800 border-2 border-neutral-700 checked:bg-green-500 checked:border-green-500 focus:ring-2 focus:ring-green-500/50 cursor-pointer"
                />
                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                  Only show rooms with available space
                </span>
              </label>

              <div className="pt-3 border-t border-neutral-700/50">
                <p className="text-xs text-neutral-400">
                  {isLoading ? (
                    "Loading rooms..."
                  ) : (
                    <>
                      Showing <span className="text-green-400 font-semibold">{rooms.length}</span> rooms
                      {roomsData?.totalElements && (
                        <> out of <span className="text-white font-semibold">{roomsData.totalElements}</span> total</>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-neutral-700 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No rooms match your search</p>
              {(searchQuery || activeFilterCount > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    clearFilters();
                  }}
                  className="text-sm text-green-400 hover:text-green-300 transition-colors"
                >
                  Clear search and filters
                </button>
              )}
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{room.roomIcon}</span>
                          <h3 className="font-bold text-white group-hover:text-green-400 transition-colors truncate">
                            {room.roomName || "Untitled Room"}
                          </h3>
                        </div>
                        <p className="text-sm text-neutral-400">
                          by {room.creatorAnimalName}
                        </p>
                      </div>
                      <span className="ml-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30 whitespace-nowrap">
                        {room.roomCode}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-white font-medium">{room.participantCount}</span>
                        <span>/{room.maxParticipants}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <File className="w-3.5 h-3.5" />
                        <span className="text-white font-medium">{room.fileCount || 0}</span>
                        <span>files</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-white font-medium">{room.totalDownloads || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-white font-medium">{room.totalVisitors || 0}</span>
                        <span>visitors</span>
                      </div>
                    </div>

                    {room.participantCount >= room.maxParticipants ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                        <Clock className="w-3 h-3" />
                        <span>Full</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                        <Clock className="w-3 h-3" />
                        <span>Available</span>
                      </div>
                    )}
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
                className="px-4 py-2 bg-neutral-800/50 border-2 border-neutral-700 text-neutral-300 font-semibold rounded-lg disabled:opacity-50 hover:bg-neutral-800 hover:border-neutral-600 hover:text-white transition-all disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-neutral-400 self-center">
                Page {page + 1} of {roomsData.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= roomsData.totalPages - 1}
                className="px-4 py-2 bg-neutral-800/50 border-2 border-neutral-700 text-neutral-300 font-semibold rounded-lg disabled:opacity-50 hover:bg-neutral-800 hover:border-neutral-600 hover:text-white transition-all disabled:cursor-not-allowed"
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
