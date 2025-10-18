import { useState, useEffect } from "react";
import { SessionCreator, SessionJoiner } from "./components/session";
import { statsService } from "./services/stats.service";
import CreateRoomModal from "../src/components/rooms/CreateRoomModal";
import { RoomSuccessModal } from "../src/components/rooms/RoomSuccessModal";
import { PublicRoomsList } from "./components/rooms/PublicRoomsList";
import { ErrorMessage } from "./components/common";
import {
  Users,
  Plus,
  Upload,
  Download,
  Lock,
  Globe,
  Clock,
  ArrowRight,
  TrendingUp,
  Eye,
  Send,
  Layers,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { roomAPI } from "../src/api/hooks/useRooms";
import { logger } from "./utils/logger";

function App() {
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

  const { data: roomsData, isLoading: roomsLoading, isError, error, refetch } = useQuery({
    queryKey: ["featuredRooms"],
    queryFn: () => roomAPI.getPublicRooms(0, 6),
    refetchInterval: 100000,
  });

  const featuredRooms = roomsData?.content || [];

  const handleRoomCreated = (room) => {
    setCreatedRoom(room);
    setShowSuccessModal(true);
    refetch();
  };

  const handleJoinRoom = (roomCode) => {
    logger.debug("Joining room:", roomCode);
    setShowSuccessModal(true);
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
  };

  if (view === "sender") {
    return <SessionCreator onSessionEnd={resetToHome} />;
  }

  if (view === "broadcast") {
    return <SessionCreator onSessionEnd={resetToHome} isBroadcast={true} />;
  }

  if (view === "receiver") {
    return <SessionJoiner onSessionEnd={resetToHome} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
      <main className="w-full max-w-6xl" role="main">
        <header
          className="text-center animate-fade-in"
          style={{ marginBottom: "4rem" }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 flex items-center justify-center gap-4">
            Quick<span className="text-green-500">Share</span>
            <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
              BETA
            </span>
          </h1>
          <p className="text-neutral-300 text-xl sm:text-2xl leading-relaxed">
            Secure peer-to-peer file sharing
          </p>

          <section className="mb-12 mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center">
              <div
                className="group cursor-help"
                title="Total files shared across all sessions"
              >
                <div className="text-3xl font-bold text-green-500 mb-1 group-hover:scale-110 transition-transform">
                  {stats.totalFiles.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-300 font-medium">
                  Files Shared
                </div>
                <div className="text-xs text-neutral-500 mt-1">All Time</div>
              </div>
              <div className="hidden sm:block h-8 w-px bg-neutral-700"></div>
              <div
                className="group cursor-help"
                title="Files shared in the last 24 hours"
              >
                <div className="text-3xl font-bold text-blue-500 mb-1 group-hover:scale-110 transition-transform">
                  {stats.todayFiles.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-300 font-medium">
                  Shared Today
                </div>
                <div className="text-xs text-neutral-500 mt-1">Last 24h</div>
              </div>
              <div className="hidden sm:block h-8 w-px bg-neutral-700"></div>
              <div
                className="group cursor-help"
                title="Active sharing sessions"
              >
                <div className="text-3xl font-bold text-purple-500 mb-1 group-hover:scale-110 transition-transform">
                  {stats.totalSessions.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-300 font-medium">
                  Sessions
                </div>
                <div className="text-xs text-neutral-500 mt-1">Active</div>
              </div>
            </div>
          </section>
        </header>

        <section className="mb-8">
          <div className="bg-gradient-to-r from-green-900/40 via-emerald-900/40 to-green-900/40 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Quick Transfer
                  </h2>
                  <p className="text-neutral-300 text-sm">
                    Fast peer-to-peer file sharing with unique codes
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="group relative overflow-hidden bg-gradient-to-br from-green-600/20 to-emerald-700/20 hover:from-green-600/30 hover:to-emerald-700/30 border-2 border-green-500/40 hover:border-green-400/60 rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Send Files</h3>
                  </div>
                  <p className="text-neutral-300 text-sm mb-5">
                    Share anything, securely
                  </p>

                  <div className="space-y-2">
                    <button
                      onClick={() => setView("sender")}
                      className="w-full bg-green-600/80 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/30"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send to Device</span>
                    </button>

                    <button
                      onClick={() => setView("broadcast")}
                      className="w-full bg-green-600/40 hover:bg-green-600/60 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Share to Multiple</span>
                    </button>
                  </div>

                  <p className="text-xs text-green-400 mt-4 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Get a code to share with others
                  </p>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-600/20 to-green-700/20 hover:from-emerald-600/30 hover:to-green-700/30 border-2 border-emerald-500/40 hover:border-emerald-400/60 rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Receive Files
                    </h3>
                  </div>
                  <p className="text-neutral-300 text-sm mb-5">
                    Join a share session
                  </p>

                  <button
                    onClick={() => setView("receiver")}
                    className="w-full bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/30"
                  >
                    <span>Join with Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-emerald-400 mt-4 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Enter a code to receive files
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 bg-gradient-to-r from-neutral-800/60 via-neutral-900/60 to-neutral-800/60 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6 sm:p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Active Rooms</h2>
                <p className="text-neutral-300 text-sm">
                  Or join live sharing rooms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Create</span>
              </button>
              <button
                onClick={() => setShowPublicRooms(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-all"
              >
                <span className="text-sm font-medium">View All</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {roomsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-neutral-700 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <ErrorMessage
                message={
                  error?.message ||
                  "Failed to load active rooms. Please try again."
                }
                className="mx-auto max-w-md mb-4"
              />
              <button
                onClick={refetch}
                className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg shadow-green-500/20"
              >
                Retry
              </button>
            </div>
          ) : featuredRooms.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-4">
                No active rooms yet. Be the first to create one!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600/80 hover:bg-green-600 text-white font-semibold rounded-lg transition-all hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Create Room</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredRooms.slice(0, 6).map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleJoinRoom(room.roomCode)}
                    className="group relative overflow-hidden bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 hover:from-neutral-800 hover:to-neutral-900 border border-neutral-700/50 hover:border-green-500/50 rounded-xl p-5 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-green-500/10"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all" />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{room.roomIcon}</span>
                            <h3 className="font-bold text-white text-lg group-hover:text-green-400 transition-colors line-clamp-1">
                              {room.roomName || "Untitled Room"}
                            </h3>
                          </div>
                          <p className="text-xs text-neutral-400">
                            by {room.creatorAnimalName}
                          </p>
                        </div>
                        <div className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-mono font-bold rounded border border-green-500/30">
                          {room.roomCode}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-white font-medium">
                            {room.participantCount}
                          </span>
                          <span>/{room.maxParticipants || "∞"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-white font-medium">
                            {room.fileCount}
                          </span>
                          <span>files</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-white font-medium">
                            {room.totalVisitors}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-700/50">
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeRemaining(room.expiresAt)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-green-400 group-hover:text-green-300">
                          <span>Join</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="sm:hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Create Room</span>
                </button>
                <button
                  onClick={() => setShowPublicRooms(true)}
                  className="sm:hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-all"
                >
                  <span className="font-medium">View All</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </section>

        <section
          className="mb-8 bg-neutral-800/30 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-12"
          aria-labelledby="features-heading"
        >
          <h2
            id="features-heading"
            className="text-3xl font-bold text-white mb-10 text-center"
          >
            Why QuickShare?
          </h2>

          <div className="grid sm:grid-cols-3 gap-8">
            <article className="flex flex-col items-center text-center">
              <div
                className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4"
                aria-hidden="true"
              >
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="Security icon"
                >
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Secure & Private
              </h3>
              <p className="text-neutral-400">
                Direct peer-to-peer transfer. Zero server uploads.
              </p>
            </article>

            <article className="flex flex-col items-center text-center">
              <div
                className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4"
                aria-hidden="true"
              >
                <svg
                  className="w-6 h-6 text-yellow-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="Speed icon"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Fast Transfer
              </h3>
              <p className="text-neutral-400">
                Lightning-fast transfers. Unlimited file sizes.
              </p>
            </article>

            <article className="flex flex-col items-center text-center">
              <div
                className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4"
                aria-hidden="true"
              >
                <svg
                  className="w-6 h-6 text-purple-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="Global icon"
                >
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Works Everywhere
              </h3>
              <p className="text-neutral-400">
                Any device. Any browser. No installation.
              </p>
            </article>
          </div>
        </section>

        <footer className="text-center space-y-3">
          <a
            href="https://github.com/rayanweragala/QuickShare"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-all duration-200 mb-2"
          >
            <svg
              className="w-5 h-5 text-neutral-400 hover:text-white transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <p className="text-sm text-neutral-500">
            Built with WebRTC • Open source • No tracking
          </p>
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

      <PublicRoomsList
        onJoinRoom={handleJoinRoom}
        isOpen={showPublicRooms}
        onClose={() => setShowPublicRooms(false)}
      />
    </div>
  );
}

export default App;