import { Clock, Eye, FileText, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "../ui";

function formatRemaining(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { text: "Expired", tone: "text-[var(--color-red)]" };
  const seconds = Math.floor(diff / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const tone = seconds < 600 ? "text-[var(--color-red)]" : seconds < 3600 ? "text-[var(--color-amber)]" : "text-[var(--color-text-secondary)]";
  return { text: h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`, tone };
}

export default function PublicRoomsGrid({ rooms, onOpenRoom, onViewAll }) {
  const [sortBy, setSortBy] = useState("recent");
  const reduceMotion = useReducedMotion();
  const MotionButton = motion.button;
  const sorted = useMemo(() => {
    const list = [...rooms];
    if (sortBy === "popular") return list.sort((a, b) => (b.totalVisitors || 0) - (a.totalVisitors || 0));
    if (sortBy === "mostFiles") return list.sort((a, b) => (b.fileCount || 0) - (a.fileCount || 0));
    if (sortBy === "leastCrowded") return list.sort((a, b) => (a.participantCount || 0) - (b.participantCount || 0));
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [rooms, sortBy]);

  return (
    <section className="mx-auto mt-10 max-w-7xl px-4 md:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Public Rooms
          </h2>
          <span className="rounded-full border border-[rgba(0,255,148,0.4)] bg-[var(--color-green-dim)] px-2 py-1 text-xs text-[var(--color-green)]" style={{ animation: "led-pulse 2s infinite" }}>
            {rooms.length} live
          </span>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2 py-1 text-sm"
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
          <option value="mostFiles">Most Files</option>
          <option value="leastCrowded">Least Crowded</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {sorted.map((room) => {
          const storagePercent = Math.min(100, ((room.currentStorageBytes || 0) / Math.max(room.maxStorageBytes || 1, 1)) * 100);
          const time = formatRemaining(room.expiresAt);
          return (
            <MotionButton
              key={room.id}
              type="button"
              onClick={() => onOpenRoom(room.roomCode)}
              whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
              className="relative rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3 text-left backdrop-blur-md transition-all hover:border-[var(--color-border-accent)] hover:[box-shadow:0_0_14px_rgba(0,245,255,0.2)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-bg-elevated)] text-lg">{room.roomIcon || "📦"}</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{room.roomName}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{room.creatorAnimalName}</p>
                  </div>
                </div>
                {room.participantCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,59,107,0.4)] bg-[rgba(255,59,107,0.15)] px-1.5 py-0.5 text-[10px] text-[var(--color-red)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-red)]" />
                    LIVE
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {room.participantCount}/{room.maxParticipants}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {room.fileCount || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {room.totalVisitors || 0}
                </div>
              </div>

              <div className="mt-3 h-[3px] rounded-full bg-[var(--color-border-subtle)]">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-cyan),var(--color-violet))]" style={{ width: `${storagePercent}%` }} />
              </div>

              <span className={`mt-2 inline-flex items-center gap-1 text-[10px] ${time.tone}`}>
                <Clock className="h-3 w-3" />
                {time.text}
              </span>
            </MotionButton>
          );
        })}
      </div>

      <div className="mt-4">
        <Button variant="ghost" onClick={onViewAll} className="w-full md:w-auto">
          View All Rooms
        </Button>
      </div>
    </section>
  );
}
