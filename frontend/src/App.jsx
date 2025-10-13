import { useState, useEffect } from "react";
import { Button } from "./components/common";
import { SessionCreator, SessionJoiner } from "./components/session";
import { statsService } from "./services/stats.service";

function App() {
  const [view, setView] = useState("home");

  const [stats, setStats] = useState({
    totalFiles: 0,
    todayFiles: 0,
    totalSessions: 0,
  });

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
      <main className="w-full max-w-6xl">
        <header
          className="text-center animate-fade-in"
          style={{ marginBottom: "4rem" }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 flex items-center justify-center gap-4">
            Local<span className="text-green-500">Share</span>
            <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 animate-pulse">
              BETA
            </span>
          </h1>
          <p className="text-neutral-300 text-xl sm:text-2xl">
            Secure peer-to-peer file sharing
          </p>

          <section className="mb-12 mt-4">
            <div className="flex items-center justify-center gap-8 text-center">
              <div
                className="group cursor-help"
                title="Total files shared across all sessions"
              >
                <div className="text-3xl font-bold text-green-500 mb-1 group-hover:scale-110 transition-transform">
                  {stats.totalFiles.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-400 font-medium">
                  Files Shared
                </div>
                <div className="text-xs text-neutral-500 mt-1">All Time</div>
              </div>

              <div className="h-8 w-px bg-neutral-700"></div>

              <div
                className="group cursor-help"
                title="Files shared in the last 24 hours"
              >
                <div className="text-3xl font-bold text-blue-500 mb-1 group-hover:scale-110 transition-transform">
                  {stats.todayFiles.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-400 font-medium">
                  Shared Today
                </div>
                <div className="text-xs text-neutral-500 mt-1">Last 24h</div>
              </div>

              <div className="h-8 w-px bg-neutral-700"></div>

              <div
                className="group cursor-help"
                title="Active sharing sessions"
              >
                <div className="text-3xl font-bold text-purple-500 mb-1 group-hover:scale-110 transition-transform">
                  {stats.totalSessions.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-400 font-medium">
                  Sessions
                </div>
                <div className="text-xs text-neutral-500 mt-1">Active</div>
              </div>
            </div>
          </section>
        </header>

        <section
          className="grid lg:grid-cols-2 gap-8"
          style={{ marginBottom: "4rem" }}
          aria-label="File sharing options"
        >
          <article className="group bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-10 hover:bg-neutral-800/70 transition-all duration-300 hover:border-green-500/30 animate-fade-in">
            <div className="mb-8">
              <div
                className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-4"
                aria-hidden="true"
              >
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="Upload icon"
                >
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white">Send Files</h2>
              <p className="text-neutral-400 text-lg mt-2">
                Share anything, securely
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setView("sender")}
                size="lg"
                fullWidth
                className="bg-green-600/80 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                aria-label="Create one-to-one file sharing session"
              >
                Share to 1 Device
              </Button>

              <Button
                onClick={() => setView("broadcast")}
                variant="outline"
                size="lg"
                fullWidth
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                aria-label="Create broadcast session for multiple receivers"
              >
                Share to Multiple Devices
              </Button>
            </div>

            <p className="text-sm text-neutral-500 mt-6">
              Get a code to share with others
            </p>
          </article>

          <article className="group bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-10 hover:bg-neutral-800/70 transition-all duration-300 hover:border-green-500/30 animate-fade-in">
            <div className="mb-8">
              <div
                className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4"
                aria-hidden="true"
              >
                <svg
                  className="w-8 h-8 text-blue-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="Download icon"
                >
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white">Receive Files</h2>
              <p className="text-neutral-400 text-lg mt-2">
                Join a share session
              </p>
            </div>

            <Button
              onClick={() => setView("receiver")}
              className="w-full bg-green-600/80 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              aria-label="Join file sharing session with code"
            >
              Join with Code
            </Button>

            <p className="text-sm text-neutral-500 mt-6">
              Enter a code to receive files
            </p>
          </article>
        </section>

        <section
          className="bg-neutral-800/30 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-12"
          style={{ marginBottom: "3rem" }}
          aria-labelledby="features-heading"
        >
          <h2
            id="features-heading"
            className="text-3xl font-bold text-white mb-10 text-center"
          >
            Why LocalShare?
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
            href="https://github.com/YOUR_USERNAME"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-all duration-200 mb-2"
            aria-label="GitHub Profile"
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
    </div>
  );
}

export default App;
