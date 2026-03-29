import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { roomAPI } from "../../api/hooks/useRooms";
import { Dialog, DialogContent, DialogTitle } from "../ui";

export default function RoomsListDialog({ open, onOpenChange, onOpenRoom }) {
  const [view, setView] = useState("public");
  const [search, setSearch] = useState("");
  const [privateCode, setPrivateCode] = useState("");

  const { data } = useQuery({
    queryKey: ["roomsListDialog", view, search],
    queryFn: async () => {
      if (view === "private") {
        if (search) return roomAPI.searchPrivateRooms(search, 0, 20);
        return roomAPI.getPrivateRooms(0, 20);
      }
      if (search) return roomAPI.searchRoomsAdvanced({ query: search, page: 0, size: 20, sortBy: "recent" });
      return roomAPI.getPublicRooms(0, 20);
    },
    enabled: open,
  });

  const rooms = data?.content || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="text-xl">Browse Rooms</DialogTitle>
        <div className="mb-3 flex items-center gap-3 text-sm">
          <button type="button" onClick={() => setView("public")} className={view === "public" ? "text-[var(--color-cyan)]" : "text-[var(--color-text-secondary)]"}>
            Public
          </button>
          <button type="button" onClick={() => setView("private")} className={view === "private" ? "text-[var(--color-cyan)]" : "text-[var(--color-text-secondary)]"}>
            Private
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] py-2 pl-9 pr-3 text-sm outline-none"
            placeholder={`Search ${view} rooms`}
          />
        </div>

        {view === "private" && (
          <div className="mt-3 flex gap-2">
            <input
              value={privateCode}
              onChange={(e) => setPrivateCode(e.target.value.toUpperCase())}
              placeholder="Enter private room code"
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm outline-none"
            />
            <button type="button" onClick={() => privateCode && onOpenRoom(privateCode)} className="rounded-[var(--radius-sm)] border border-[var(--color-border-accent)] px-3 py-2 text-sm text-[var(--color-cyan)]">
              Join
            </button>
          </div>
        )}

        <div className="mt-4 max-h-[50vh] space-y-2 overflow-auto pr-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onOpenRoom(room.roomCode)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3 text-left transition hover:border-[var(--color-border-accent)]"
            >
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                {room.roomIcon || "📁"} {room.roomName}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {room.creatorAnimalName} · {room.participantCount}/{room.maxParticipants} members
              </p>
            </button>
          ))}
          {rooms.length === 0 && <p className="text-sm text-[var(--color-text-secondary)]">No rooms found.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

