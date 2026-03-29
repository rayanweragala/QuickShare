import { Minus, Plus, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { roomAPI } from "../../api/hooks/useRooms";
import { getOrCreateUserId } from "../../utils/userManager";
import { Dialog, DialogContent, DialogTitle } from "../ui";

const quickExpiry = [1, 6, 24, 48, 168];

export default function CreateRoomDialog({ open, onOpenChange, onSuccess }) {
  const reduceMotion = useReducedMotion();
  const MotionSpan = motion.span;
  const userId = getOrCreateUserId();
  const [customHours, setCustomHours] = useState(false);
  const [data, setData] = useState({
    customRoomName: "",
    visibility: "PUBLIC",
    expirationHours: 24,
    maxParticipants: 10,
    creatorOnlyUpload: false,
    isFeatured: false,
  });

  const mutation = useMutation({
    mutationFn: (payload) => roomAPI.createRoom({ ...payload, userId }),
    onSuccess: (room) => {
      onSuccess(room);
      onOpenChange(false);
    },
  });

  const submit = (event) => {
    event.preventDefault();
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Create Room
        </DialogTitle>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="room-name" className="mb-1 block text-sm text-[var(--color-text-secondary)]">
              Room Name
            </label>
            <input
              id="room-name"
              value={data.customRoomName}
              onChange={(e) => setData((prev) => ({ ...prev, customRoomName: e.target.value }))}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 outline-none"
              style={{ fontFamily: "var(--font-display)" }}
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-[var(--color-text-secondary)]">Visibility</p>
            <div className="grid grid-cols-2 gap-2">
              {["PUBLIC", "PRIVATE"].map((visibility) => (
                <button
                  key={visibility}
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, visibility }))}
                  className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${
                    data.visibility === visibility
                      ? "border-[var(--color-border-accent)] bg-[var(--color-cyan-dim)] text-[var(--color-cyan)]"
                      : "border-[var(--color-border-default)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {visibility === "PUBLIC" ? "Public" : "Private"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-[var(--color-text-secondary)]">Expiration</p>
            <div className="flex flex-wrap gap-2">
              {quickExpiry.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setCustomHours(false);
                    setData((prev) => ({ ...prev, expirationHours: value }));
                  }}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    data.expirationHours === value && !customHours
                      ? "border-[var(--color-border-accent)] bg-[var(--color-cyan-dim)] text-[var(--color-cyan)]"
                      : "border-[var(--color-border-default)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {value === 168 ? "1 week" : `${value}h`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomHours(true)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  customHours ? "border-[var(--color-border-accent)] bg-[var(--color-cyan-dim)] text-[var(--color-cyan)]" : "border-[var(--color-border-default)] text-[var(--color-text-secondary)]"
                }`}
              >
                Custom
              </button>
            </div>
            {customHours && (
              <input
                type="number"
                min={1}
                max={720}
                value={data.expirationHours}
                onChange={(e) => setData((prev) => ({ ...prev, expirationHours: Number(e.target.value || 1) }))}
                className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 outline-none"
              />
            )}
          </div>

          <div>
            <p className="mb-2 text-sm text-[var(--color-text-secondary)]">Max Participants</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setData((prev) => ({ ...prev, maxParticipants: Math.max(2, prev.maxParticipants - 1) }))} className="rounded border border-[var(--color-border-default)] p-2">
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={data.maxParticipants}
                min={2}
                max={100}
                onChange={(e) => setData((prev) => ({ ...prev, maxParticipants: Number(e.target.value || 2) }))}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 outline-none"
              />
              <button type="button" onClick={() => setData((prev) => ({ ...prev, maxParticipants: Math.min(100, prev.maxParticipants + 1) }))} className="rounded border border-[var(--color-border-default)] p-2">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className={!data.creatorOnlyUpload ? "text-[var(--color-cyan)]" : "text-[var(--color-text-secondary)]"}>Anyone can upload</span>
              <button
                type="button"
                onClick={() => setData((prev) => ({ ...prev, creatorOnlyUpload: !prev.creatorOnlyUpload }))}
                className={`relative h-6 w-12 rounded-full border ${data.creatorOnlyUpload ? "border-[var(--color-cyan)] bg-[var(--color-cyan-dim)]" : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"}`}
              >
                <span className={`absolute top-[2px] h-4 w-4 rounded-full bg-white transition-all ${data.creatorOnlyUpload ? "left-7" : "left-1"}`} />
              </button>
              <span className={data.creatorOnlyUpload ? "text-[var(--color-cyan)]" : "text-[var(--color-text-secondary)]"}>Creator only</span>
            </div>
          </div>

          <button type="button" onClick={() => setData((prev) => ({ ...prev, isFeatured: !prev.isFeatured }))} className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <MotionSpan animate={data.isFeatured && !reduceMotion ? { scale: [1, 1.15, 1] } : undefined}>
              <Star className={`h-4 w-4 ${data.isFeatured ? "fill-yellow-400 text-yellow-400" : ""}`} />
            </MotionSpan>
            Feature this room
          </button>

          <button type="submit" disabled={mutation.isPending} className="w-full rounded-[var(--radius-md)] bg-[linear-gradient(135deg,#00F5FF,#7B2FFF)] px-4 py-2 font-semibold text-black disabled:opacity-60">
            {mutation.isPending ? "Creating..." : "Create Room"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
