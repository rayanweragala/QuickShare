import { useState, useEffect } from "react";
import { SessionCreator, SessionJoiner } from "./components/session";
import { statsService } from "./services/stats.service";
import CreateRoomModal from "./components/rooms/CreateRoomModal";
import { RoomSuccessModal } from "./components/rooms/RoomSuccessModal";
import { RoomsList } from "./components/rooms/RoomsList";
import RoomModal from "./components/rooms/RoomModal";
import { ErrorMessage } from "./components/common";
import { ThemeToggle } from "./components/common/ThemeToggle";
import { WelcomeModal } from "./components/common/WelcomeModal";
import { OnboardingTour } from "./components/common/OnboardingTour";
import { useQueryClient } from "@tanstack/react-query";
import { useFeaturedRoomsSocket } from "./api/hooks/useFeaturedRoomsSocket";
import { usePublicRoomsSocket } from "./api/hooks/usePublicRoomsSocket";
import {
  Users,
  Plus,
  Upload,
  Download,
  Lock,
  Globe,
  Clock,
  ArrowRight,
  Eye,
  Send,
  Layers,
  Star,
  Zap,
  Shield,
  Heart,
  Gauge,
  Wifi,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Settings,
} from "lucide-react";
import { Listbox } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { roomAPI } from "./api/hooks/useRooms";
import { logger } from "./utils/logger";

function App() {
  const queryClient = useQueryClient();
  const [view, setView] = useState("home");
  const [stats, setStats] = useState({
    totalFiles: 0,
    todayFiles: 0,
    totalSessions: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPublicRooms, setShowPublicRooms] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRoomCode, setSelectedRoomCode] = useState(null);
  const [sortBy, setSortBy] = useState("recent");
  const [featuredPage, setFeaturedPage] = useState(0);
  const [joinCode, setJoinCode] = useState("");

  const { featuredRooms, toggleFeatured } = useFeaturedRoomsSocket();
  const {
    data: roomsData,
    isLoading: roomsLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["publicRooms", sortBy],
    queryFn: () =>
      roomAPI.searchRoomsAdvanced({
        sortBy: sortBy,
        page: 0,
        size: 12,
      }),
    staleTime: 30 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    enabled: true,
    placeholderData: (previousData) => previousData,
  });
  const publicRooms = roomsData?.content || [];

  const handleRoomCreated = (room) => {
    setCreatedRoom(room);
    setShowSuccessModal(true);
    queryClient.invalidateQueries(["publicRooms"]);
  };

  const handleJoinRoom = (roomCode) => {
    logger.debug("Joining room:", roomCode);
    setSelectedRoomCode(roomCode);
    setShowRoomModal(true);
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const hours = Math.floor((expires - now) / (1000 * 60 * 60));
    const minutes = Math.floor(
      ((expires - now) % (1000 * 60 * 60)) / (1000 * 60)
    );

    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h left`;
    return `${minutes}m left`;
  };

  useEffect(() => {
    const updateStats = () => {
      const allStats = statsService.getStats();
      const todayStats = statsService.getTodayStats();

      setStats({
        totalFiles: allStats?.totalFiles ?? 0,
        todayFiles: todayStats?.files ?? 0,
        totalSessions: allStats?.totalSessions ?? 0,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const resetToHome = () => {
    setView("home");
    setJoinCode("");
  };

  if (view === "sender") {
    return <SessionCreator onSessionEnd={resetToHome} />;
  }

  if (view === "broadcast") {
    return <SessionCreator onSessionEnd={resetToHome} isBroadcast={true} />;
  }

  if (view === "receiver") {
    return <SessionJoiner onSessionEnd={resetToHome} initialCode={joinCode} />;
  }

  const headerStats = [
    {
      icon: Upload,
      label: "Files Shared",
      value: stats.totalFiles.toLocaleString(),
    },
    {
      icon: Users,
      label: "Active Sessions",
      value: stats.totalSessions.toLocaleString(),
    },
    {
      icon: Download,
      label: "Shared Today",
      value: stats.todayFiles.toLocaleString(),
    },
    {
      icon: Globe,
      label: "Public Rooms",
      value: publicRooms.length.toLocaleString(),
    },
  ];

  const whyReasons = [
    {
      icon: Zap,
      title: "Blazing Fast",
      description:
        "Direct peer-to-peer connections mean your files transfer at maximum speed without server bottlenecks.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "End-to-end encryption ensures only you and your recipient can access the files. No cloud storage.",
    },
    {
      icon: Heart,
      title: "Simple & Free",
      description:
        "No account required, no credit card, no limits. Just drag, drop, and share instantly.",
    },
    {
      icon: Users,
      title: "Built for Everyone",
      description:
        "From students sharing homework to teams collaborating on projects, QuickShare works for all.",
    },
    {
      icon: Lock,
      title: "Zero Knowledge",
      description:
        "We never see your files. They go directly from you to your recipient without touching our servers.",
    },
    {
      icon: Gauge,
      title: "No Size Limits",
      description:
        "Share files of any size. Videos, databases, archives - send anything without compression.",
    },
  ];

  const totalFeaturedPages = featuredRooms.length;
  const currentFeaturedRooms = featuredRooms.slice(
    featuredPage,
    featuredPage + 1
  );
  const handlePrevFeatured = () => {
    setFeaturedPage((prev) => (prev > 0 ? prev - 1 : totalFeaturedPages - 1));
  };

  const handleNextFeatured = () => {
    setFeaturedPage((prev) => (prev < totalFeaturedPages - 1 ? prev + 1 : 0));
  };

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "popular", label: "Most Popular" },
    { value: "mostFiles", label: "Most Files" },
    { value: "leastCrowded", label: "Least Crowded" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/3 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <header className="relative z-10 border-b border-green-500/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <span className="text-2xl font-bold text-white">QuickShare</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 border border-green-400/50 text-green-400 bg-green-500/10 rounded-full text-sm font-medium">
                P2P Powered
              </span>
              <div data-onboarding="theme-toggle">
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {headerStats.map((stat) => (
              <div key={stat.label} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 hover:bg-zinc-900 hover:border-green-500/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <stat.icon className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-sm text-zinc-400">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-4">
              <div className="relative group h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-900 hover:border-green-500/50 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-700 to-emerald-700 shadow-lg shadow-green-900/50">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400 font-medium">
                        Encrypted
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    Send Files
                  </h3>
                  <p className="text-zinc-400 text-sm mb-6">
                    Share anything, securely with unique codes
                  </p>

                  <div className="space-y-3 mb-4 mt-auto" data-onboarding="send-files">
                    <button
                      onClick={() => setView("sender")}
                      className="w-full bg-green-500/10 hover:bg-green-500/20 border border-green-400/50 text-green-400 font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send to Device</span>
                    </button>

                    <button
                      onClick={() => setView("broadcast")}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-zinc-700 hover:border-green-500/50"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Share to Multiple</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="relative group h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-900 hover:border-green-500/50 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-700 to-green-700 shadow-lg shadow-emerald-900/50">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400 font-medium">
                        P2P
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    Receive Files
                  </h3>
                  <p className="text-zinc-400 text-sm mb-6" data-onboarding="receive-files">
                    Join a share session with a code
                  </p>

                  <div className="mt-auto space-y-3">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => {
                        const value = e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "");
                        setJoinCode(value);
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 text-white text-center text-2xl font-mono tracking-widest placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    />

                    <button
                      onClick={() => {
                        if (joinCode.length === 6) {
                          setView("receiver");
                        }
                      }}
                      disabled={joinCode.length < 6}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-zinc-700 hover:border-green-500/50 disabled:border-zinc-800"
                    >
                      <span>Join Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <p className="text-xs text-green-400 flex items-center gap-1 justify-center">
                      <Clock className="w-3 h-3" />
                      Enter a 6-digit code to receive files
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              {featuredRooms.length > 0 ? (
                <div className="relative h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-400 fill-green-400" />
                      Featured
                    </h3>
                    {totalFeaturedPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevFeatured}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-green-500/50 transition-all"
                        >
                          <ChevronLeft className="w-4 h-4 text-green-400" />
                        </button>
                        <span className="text-sm text-zinc-400 font-mono">
                          {featuredPage + 1}/{totalFeaturedPages}
                        </span>
                        <button
                          onClick={handleNextFeatured}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-green-500/50 transition-all"
                        >
                          <ChevronRight className="w-4 h-4 text-green-400" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {currentFeaturedRooms.map((room) => (
                      <div key={room.id} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 hover:bg-zinc-900 hover:border-green-500/50 transition-all duration-300">
                          <div
                            className="cursor-pointer"
                            onClick={() => handleJoinRoom(room.roomCode)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl">
                                    {room.roomIcon}
                                  </span>
                                  <h4 className="font-bold text-white truncate">
                                    {room.roomName || "Untitled Room"}
                                  </h4>
                                </div>
                                <p className="text-xs text-zinc-500">
                                  by {room.creatorAnimalName}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs rounded font-mono font-bold ml-2">
                                {room.roomCode}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs mb-3">
                              <div className="flex items-center gap-1 text-zinc-400">
                                <Users className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-white font-medium">
                                  {room.participantCount}
                                </span>
                                <span>/{room.maxParticipants || "∞"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-zinc-400">
                                <Upload className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-white font-medium">
                                  {room.fileCount}
                                </span>
                                <span>files</span>
                              </div>
                              <div className="flex items-center gap-1 text-zinc-400">
                                <Eye className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-white font-medium">
                                  {room.totalVisitors}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                              <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatTimeRemaining(room.expiresAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs font-medium text-green-400">
                                <span>Open</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFeatured(room.id, false);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-all border border-zinc-700"
                              title="Remove from featured"
                            >
                              <Star className="w-3 h-3" />
                              <span>Unfeature</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-all border border-zinc-700"
                              title="Room settings"
                            >
                              <Settings className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-400 fill-green-400" />
                      Featured
                    </h3>
                  </div>
                  <div className="relative bg-zinc-900/50 backdrop-blur-md border border-zinc-800 border-dashed rounded-2xl p-8 h-[calc(100%-3rem)] flex flex-col items-center justify-center">
                    <Star className="w-12 h-12 text-green-400/30 mb-4" />
                    <p className="text-zinc-500 text-center mb-4 text-sm">
                      No featured rooms yet
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6" data-onboarding="public-rooms">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Globe className="w-6 h-6 text-green-400" />
                Public Rooms
              </h3>
              <div className="flex items-center gap-3">
                <Listbox value={sortBy} onChange={setSortBy}>
                  <Listbox.Label className="block text-xs font-medium text-zinc-400 mb-2">
                    Sort By
                  </Listbox.Label>

                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-zinc-800 py-2 pl-3 pr-10 text-left border border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50">
                      <span className="block truncate text-white">
                        {sortOptions.find((opt) => opt.value === sortBy)?.label}
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
                          value={option.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                              active
                                ? "bg-green-500/20 text-green-300"
                                : "text-zinc-300"
                            }`
                          }
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
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-400">
                                  <Check
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-all border border-green-500/30 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Create</span>
                </button>
                <button
                  onClick={() => setShowPublicRooms(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all border border-zinc-700 hover:border-green-500/50"
                >
                  <span className="text-sm font-medium">View All</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {roomsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin" />
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <ErrorMessage
                  message={error?.message || "Failed to load rooms"}
                  className="mx-auto max-w-md mb-4"
                />
              </div>
            ) : publicRooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 max-w-md mx-auto">
                  <Globe className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                  <p className="text-zinc-400 mb-6">
                    No public rooms yet. Be the first to create one!
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-500/50"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Room</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                  {publicRooms.slice(0, 12).map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleJoinRoom(room.roomCode)}
                      className="relative group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 hover:bg-zinc-900 hover:border-green-500/50 transition-all duration-300 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{room.roomIcon}</span>
                              <h4 className="text-sm font-bold text-white truncate">
                                {room.roomName || "Untitled"}
                              </h4>
                            </div>
                            <p className="text-xs text-zinc-500 truncate">
                              by {room.creatorAnimalName}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3 text-xs">
                          <div className="flex items-center justify-between text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-white font-medium">
                                {room.participantCount}
                              </span>
                              <span className="text-zinc-500">
                                /{room.maxParticipants || "∞"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Upload className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-white font-medium">
                                {room.fileCount}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-500">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-white font-medium">
                              {room.totalVisitors}
                            </span>
                            <span>views</span>
                          </div>
                        </div>

                        <div className="mt-auto pt-3 border-t border-zinc-800">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-zinc-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeRemaining(room.expiresAt)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-green-400 font-medium">
                              <span>Join</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="sm:hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-all border border-green-500/30 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Room</span>
                  </button>
                  <button
                    onClick={() => setShowPublicRooms(true)}
                    className="sm:hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all border border-zinc-700"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <section className="relative z-10 py-20 border-t border-green-500/10 bg-gradient-to-b from-black to-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Why Choose QuickShare?
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                The fastest, most secure way to share files. No middleman, no
                compromises.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyReasons.map((reason) => (
                <div key={reason.title} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 h-full hover:bg-zinc-900 hover:border-green-500/50 transition-all duration-300">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 w-fit mb-4 border border-green-500/30">
                      <reason.icon className="w-6 h-6 text-green-400" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3">
                      {reason.title}
                    </h3>
                    <p className="text-zinc-400 leading-relaxed">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-900/80 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/90 font-medium">
                  Join {stats.totalSessions.toLocaleString()}+ active sessions
                </span>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-green-500/10 py-8 bg-black">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-zinc-400 text-sm">
                Made with <span className="text-red-500">❤️</span> by{" "}
                <a
                  href="https://github.com/rayanweragala"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-green-400 hover:text-green-300 transition-colors"
                >
                  Rayan
                </a>
              </div>
              <div className="flex items-center gap-6">
                <a
                  href="#"
                  className="text-sm text-zinc-400 hover:text-green-400 transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-sm text-zinc-400 hover:text-green-400 transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-sm text-zinc-400 hover:text-green-400 transition-colors"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRoomCreated}
      />

      <RoomSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        room={createdRoom}
      />

      <RoomsList
        onJoinRoom={handleJoinRoom}
        isOpen={showPublicRooms}
        onClose={() => setShowPublicRooms(false)}
      />

      <RoomModal
        isOpen={showRoomModal}
        onClose={() => {
          setShowRoomModal(false);
          setSelectedRoomCode(null);
        }}
        roomCode={selectedRoomCode}
      />

      <WelcomeModal />
      <OnboardingTour />
    </div>
  );
}

export default App;
