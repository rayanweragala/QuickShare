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
  TrendingUp,
  Check,
  Lock,
  Key,
} from "lucide-react";
import { Listbox } from "@headlessui/react";

export const RoomsList = ({ onJoinRoom, isOpen, onClose }) => {
  const [view, setView] = useState("public");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showPrivateJoinModal, setShowPrivateJoinModal] = useState(false);
  const [privateRoomCode, setPrivateRoomCode] = useState("");
  const [privateRoomError, setPrivateRoomError] = useState("");

  const [filters, setFilters] = useState({
    minParticipants: "",
    maxParticipants: "",
    minFiles: "",
    hasSpace: false,
    sortBy: "recent",
  });

  const buildQueryParams = () => {
    const params = {
      page,
      size: 10,
    };

    if (searchQuery) params.query = searchQuery;
    if (filters.minParticipants)
      params.minParticipants = filters.minParticipants;
    if (filters.maxParticipants)
      params.maxParticipants = filters.maxParticipants;
    if (filters.minFiles) params.minFiles = filters.minFiles;
    if (filters.hasSpace) params.hasSpace = true;
    if (filters.sortBy) params.sortBy = filters.sortBy;

    return params;
  };

  const { data: publicRoomsData, isLoading: publicLoading } = useQuery({
    queryKey: ["publicRooms", page, searchQuery, filters],
    queryFn: () => {
      const params = buildQueryParams();
      const hasFilters = searchQuery || activeFilterCount > 0;
      return hasFilters
        ? roomAPI.searchRoomsAdvanced(params)
        : roomAPI.getPublicRooms(page, 10);
    },
    enabled: view === "public",
  });

  const { data: privateRoomsData, isLoading: privateLoading } = useQuery({
    queryKey: ["privateRooms", page, searchQuery],
    queryFn: () => {
      if (searchQuery) {
        return roomAPI.searchPrivateRooms(searchQuery, page, 10);
      }
      return roomAPI.getPrivateRooms(page, 10);
    },
    enabled: view === "private",
  });

  const publicRooms = publicRoomsData?.content || [];
  const privateRooms = privateRoomsData?.content || [];

  const rooms = view === "public" ? publicRooms : privateRooms;
  const isLoading = view === "public" ? publicLoading : privateLoading;
  const roomsData = view === "public" ? publicRoomsData : privateRoomsData;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      minParticipants: "",
      maxParticipants: "",
      minFiles: "",
      hasSpace: false,
      sortBy: "recent",
    });
    setPage(0);
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== "" && v !== false && v !== "recent"
  ).length;

  const handlePrivateRoomJoin = () => {
    if (!privateRoomCode.trim()) {
      setPrivateRoomError("Please enter a room code");
      return;
    }
    
    setPrivateRoomError("");
    onJoinRoom(privateRoomCode.trim().toUpperCase());
    setShowPrivateJoinModal(false);
    setPrivateRoomCode("");
  };

  if (!isOpen) return null;

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "popular", label: "Most Popular" },
    { value: "mostFiles", label: "Most Files" },
    { value: "leastCrowded", label: "Least Crowded" },
  ];

  const isRoomFull = (room) => {
    if (room.maxParticipants == null) {
      return false;
    }

    return room.participantCount >= room.maxParticipants;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-3xl h-[90vh] bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="relative bg-zinc-900/50 border-b border-green-500/10 px-6 py-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                  {view === "public" ? (
                    <Globe className="w-5 h-5 text-green-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {view === "public" ? "Public Rooms" : "Private Rooms"}
                  </h2>
                  <p className="text-sm text-zinc-400">
                    {view === "public"
                      ? "Discover and join sharing spaces"
                      : "Browse and join private spaces"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all border border-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-shrink-0 border-b border-zinc-800 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView("public")}
                className={`py-3 text-sm font-medium transition-all border-b-2 ${
                  view === "public"
                    ? "text-green-400 border-green-400"
                    : "text-zinc-400 border-transparent hover:text-white"
                }`}
              >
                Public Rooms
              </button>
              <button
                onClick={() => setView("private")}
                className={`py-3 text-sm font-medium transition-all border-b-2 ${
                  view === "private"
                    ? "text-green-400 border-green-400"
                    : "text-zinc-400 border-transparent hover:text-white"
                }`}
              >
                Private Rooms
              </button>
            </div>
          </div>

          {view === "public" ? (
            <>
              <div className="flex-shrink-0 p-6 space-y-4 border-b border-zinc-800">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(0);
                      }}
                      placeholder="Search public rooms..."
                      className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-3 rounded-lg border font-semibold transition-all flex items-center gap-2 ${
                      showFilters || activeFilterCount > 0
                        ? "bg-green-500/10 border-green-500/50 text-green-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600"
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
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Filter className="w-4 h-4 text-green-400" />
                        Advanced Filters
                      </h3>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Listbox
                          value={filters.sortBy}
                          onChange={(value) =>
                            handleFilterChange("sortBy", value)
                          }
                        >
                          <Listbox.Label className="block text-xs font-medium text-zinc-400 mb-2">
                            Sort By
                          </Listbox.Label>
                          <div className="relative">
                            <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-zinc-800 py-2 pl-3 pr-10 text-left border border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50">
                              <span className="block truncate text-white">
                                {
                                  sortOptions.find(
                                    (opt) => opt.value === filters.sortBy
                                  )?.label
                                }
                              </span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronDown
                                  className="h-5 w-5 text-zinc-400"
                                  aria-hidden="true"
                                />
                              </span>
                            </Listbox.Button>
                            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-zinc-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10 border border-zinc-700">
                              {sortOptions.map((option) => (
                                <Listbox.Option
                                  key={option.value}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                      active
                                        ? "bg-green-500/20 text-green-300"
                                        : "text-zinc-300"
                                    }`
                                  }
                                  value={option.value}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`block truncate ${
                                          selected
                                            ? "font-medium text-white"
                                            : "font-normal"
                                        }`}
                                      >
                                        {option.label}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-400">
                                          <Check
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </div>
                        </Listbox>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2">
                          Minimum Files
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={filters.minFiles}
                          onChange={(e) =>
                            handleFilterChange("minFiles", e.target.value)
                          }
                          placeholder="Any"
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 appearance-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2">
                          Min Participants
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={filters.minParticipants}
                          onChange={(e) =>
                            handleFilterChange("minParticipants", e.target.value)
                          }
                          placeholder="Any"
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 appearance-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2">
                          Max Participants
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={filters.maxParticipants}
                          onChange={(e) =>
                            handleFilterChange("maxParticipants", e.target.value)
                          }
                          placeholder="Any"
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 appearance-none"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.hasSpace}
                        onChange={(e) =>
                          handleFilterChange("hasSpace", e.target.checked)
                        }
                        className="w-4 h-4 rounded bg-zinc-800 border-2 border-zinc-700 checked:bg-green-500 checked:border-green-500 focus:ring-2 focus:ring-green-500/50 cursor-pointer"
                      />
                      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                        Only show rooms with available space
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin" />
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400">
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
                        className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl hover:border-green-500/50 hover:bg-zinc-900 transition-all cursor-pointer group relative overflow-hidden"
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
                              <p className="text-sm text-zinc-400">
                                by {room.creatorAnimalName}
                              </p>
                            </div>
                            <span className="ml-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30 whitespace-nowrap">
                              {room.roomCode}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-white font-medium">
                                {room.participantCount}
                              </span>
                              <span>/{room.maxParticipants}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <File className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-white font-medium">
                                {room.fileCount || 0}
                              </span>
                              <span>files</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-white font-medium">
                                {room.totalDownloads || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-white font-medium">
                                {room.totalVisitors || 0}
                              </span>
                              <span>visitors</span>
                            </div>
                          </div>

                          {isRoomFull(room) ? (
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
                      className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-lg disabled:opacity-50 hover:bg-zinc-700 hover:border-green-500/50 hover:text-white transition-all disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-zinc-400 self-center">
                      Page {page + 1} of {roomsData.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= roomsData.totalPages - 1}
                      className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-lg disabled:opacity-50 hover:bg-zinc-700 hover:border-green-500/50 hover:text-white transition-all disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex-shrink-0 p-6 space-y-4 border-b border-zinc-800">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(0);
                      }}
                      placeholder="Search private rooms by name..."
                      className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setShowPrivateJoinModal(true)}
                    className="px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-400/50 text-green-400 font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <Key className="w-5 h-5" />
                    <span className="hidden sm:inline">Enter Code</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin" />
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400">
                    <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-2">No private rooms found</p>
                    <p className="text-sm mb-4">Click "Enter Code" to join a private room</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-sm text-green-400 hover:text-green-300 transition-colors"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl transition-all relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl" />
                        <div className="relative">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{room.roomIcon}</span>
                                <h3 className="font-bold text-white transition-colors truncate">
                                  {room.roomName || "Untitled Room"}
                                </h3>
                              </div>
                              <p className="text-sm text-zinc-400">
                                by {room.creatorAnimalName}
                              </p>
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                            <Lock className="w-3 h-3" />
                            <span>Private Room</span>
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
                      className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-lg disabled:opacity-50 hover:bg-zinc-700 hover:border-green-500/50 hover:text-white transition-all disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-zinc-400 self-center">
                      Page {page + 1} of {roomsData.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= roomsData.totalPages - 1}
                      className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-lg disabled:opacity-50 hover:bg-zinc-700 hover:border-green-500/50 hover:text-white transition-all disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showPrivateJoinModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
            <div className="bg-zinc-900/50 border-b border-green-500/10 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                    <Key className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Join Private Room</h2>
                    <p className="text-sm text-zinc-400">Enter the room security code</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPrivateJoinModal(false);
                    setPrivateRoomCode("");
                    setPrivateRoomError("");
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all border border-zinc-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={privateRoomCode}
                  onChange={(e) => {
                    setPrivateRoomCode(e.target.value.toUpperCase());
                    setPrivateRoomError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePrivateRoomJoin();
                    }
                  }}
                  placeholder="Enter room code (e.g., J6BDFA82)"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all uppercase "
                  maxLength={8}
                  autoFocus
                />
                {privateRoomError && (
                  <p className="text-sm text-red-400 mt-2">{privateRoomError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPrivateJoinModal(false);
                    setPrivateRoomCode("");
                    setPrivateRoomError("");
                  }}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold rounded-lg transition-all border border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrivateRoomJoin}
                  className="flex-1 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-400/50 text-green-400 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Key className="w-5 h-5" />
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};