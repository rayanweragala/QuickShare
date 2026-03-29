import { Crown, UserMinus } from "lucide-react";

function relativeTime(value) {
  if (!value) return "just now";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  return `${hr} hr ago`;
}

export default function MemberCard({ member, isSelf, isCreator, onRemove }) {
  return (
    <div className="group flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 100 100" className="h-10 w-10">
          <polygon
            points="50,7 88,28 88,72 50,93 12,72 12,28"
            fill="transparent"
            stroke="var(--color-cyan)"
            strokeWidth="3"
            strokeDasharray="1"
            style={{ animation: "stroke-trace 2s ease-out" }}
          />
          <text x="50" y="60" textAnchor="middle" fontSize="34">
            {member.animalIcon || "🦊"}
          </text>
        </svg>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{member.animalName}</p>
            {isSelf && <span className="rounded-full bg-[var(--color-cyan-dim)] px-2 py-0.5 text-[10px] text-[var(--color-cyan)]">You</span>}
            {member.isCreator && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-violet-dim)] px-2 py-0.5 text-[10px] text-[var(--color-violet)]">
                <Crown className="h-3 w-3" />
                Creator
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">{relativeTime(member.joinedAt)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${member.isOnline ? "bg-[var(--color-green)]" : "bg-[var(--color-text-muted)]"}`} />
        {isCreator && !isSelf && (
          <button
            type="button"
            aria-label="Remove member"
            onClick={onRemove}
            className="hidden rounded border border-[rgba(255,59,107,0.4)] p-1 text-[var(--color-red)] hover:bg-[rgba(255,59,107,0.15)] group-hover:inline-flex"
          >
            <UserMinus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

