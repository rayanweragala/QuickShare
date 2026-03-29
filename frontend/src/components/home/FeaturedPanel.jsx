import { ChevronLeft, ChevronRight, Star, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "../ui";

function formatRemaining(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { text: "Expired", tone: "text-[var(--color-red)]" };
  const totalSec = Math.floor(diff / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const tone = totalSec < 600 ? "text-[var(--color-red)]" : totalSec < 3600 ? "text-[var(--color-amber)]" : "text-[var(--color-text-secondary)]";
  const text = hours > 0 ? `${hours}h ${mins}m` : `${mins}m ${secs}s`;
  return { text, tone };
}

function FeaturedRoomCard({ room, onOpenRoom, onUnpin }) {
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const remaining = formatRemaining(room.expiresAt);
  const participantRatio = Math.min(100, ((room.participantCount || 0) / Math.max(room.maxParticipants || 1, 1)) * 100);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5">
      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border-accent)] bg-[var(--color-cyan-dim)] text-xl">
        {room.roomIcon || "📁"}
      </div>
      <h3 className="truncate text-lg font-semibold text-[var(--color-text-primary)]">{room.roomName}</h3>
      <p className="text-sm text-[var(--color-text-secondary)]">{room.creatorAnimalName}</p>
      <div className="mt-3 inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border-accent)] bg-[var(--color-cyan-dim)] px-2 py-1 font-mono text-xs text-[var(--color-cyan)]">
        {room.roomCode}
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-[var(--color-border-subtle)]">
        <div className="relative h-full rounded-full bg-[var(--color-cyan)]" style={{ width: `${participantRatio}%` }}>
          <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white/80 shadow-[var(--color-glow-cyan)]" />
        </div>
      </div>
      <p className={`mt-3 text-sm ${remaining.tone}`}>{remaining.text}</p>
      <div className="mt-4 flex items-center gap-2">
        <Button onClick={() => onOpenRoom(room.roomCode)} className="flex-1">
          Open Room
        </Button>
        <button type="button" aria-label="Unpin room" onClick={() => onUnpin(room.id)} className="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] p-2 hover:bg-[var(--color-violet-dim)]">
          <Star className="h-4 w-4 text-[var(--color-amber)]" />
        </button>
      </div>
    </div>
  );
}

export default function FeaturedPanel({ rooms, onOpenRoom, onToggleFeatured }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const MotionDiv = motion.div;

  useEffect(() => {
    if (activeIndex > rooms.length - 1) {
      setActiveIndex(0);
    }
  }, [rooms.length, activeIndex]);

  if (!rooms || rooms.length === 0) {
    return (
      <section className="mx-auto mt-8 max-w-7xl px-4 md:px-6">
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] p-6 text-center text-[var(--color-text-muted)]">
          <Star className="mx-auto mb-2 h-6 w-6" />
          Pin rooms you create to access them here
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-8 max-w-7xl px-4 md:px-6">
      <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <Users className="h-4 w-4" />
        Featured Rooms
      </div>
      <div className="relative mx-auto max-w-3xl" style={{ perspective: "1200px" }}>
        <button type="button" aria-label="Previous featured room" onClick={() => setActiveIndex((i) => (i - 1 + rooms.length) % rooms.length)} className="absolute -left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-2">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Next featured room" onClick={() => setActiveIndex((i) => (i + 1) % rooms.length)} className="absolute -right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-2">
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="relative h-[300px]">
          {rooms.map((room, index) => {
            const prev = (activeIndex - 1 + rooms.length) % rooms.length;
            const next = (activeIndex + 1) % rooms.length;
            let style = { opacity: 0, scale: 0.7, x: "0%", rotateY: 0, zIndex: 1 };
            if (index === activeIndex) style = { opacity: 1, scale: 1, x: "0%", rotateY: 0, zIndex: 10 };
            if (index === prev) style = { opacity: 0.4, scale: 0.88, x: "-60%", rotateY: 25, zIndex: 5 };
            if (index === next) style = { opacity: 0.4, scale: 0.88, x: "60%", rotateY: -25, zIndex: 5 };

            return (
              <MotionDiv
                key={room.id}
                layout
                initial={false}
                animate={reduceMotion ? { opacity: index === activeIndex ? 1 : 0 } : style}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute left-0 top-0 w-full"
                style={{ transformStyle: "preserve-3d", zIndex: style.zIndex }}
              >
                <FeaturedRoomCard room={room} onOpenRoom={onOpenRoom} onUnpin={(roomId) => onToggleFeatured(roomId, false)} />
              </MotionDiv>
            );
          })}
        </div>

        <div className="mt-3 flex justify-center gap-2">
          {rooms.map((room, index) => (
            <button
              key={room.id}
              type="button"
              aria-label={`Go to featured room ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2 w-2 rounded-full ${index === activeIndex ? "bg-[var(--color-cyan)]" : "bg-[var(--color-border-default)]"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
