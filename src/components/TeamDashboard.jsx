import { ProgressRing, ProgressBar, Badge } from "./Shared";
import { getOwners, getOwnerColors, PRIORITY_COLORS } from "../helpers";
import { useTheme } from "../ThemeContext";

const daysUntil = (d) => Math.ceil((new Date(d + "T23:59:59") - new Date()) / 86400000);

export default function TeamDashboard({ d, allItems, total, doneCount }) {
  const { theme } = useTheme();
  const OWNERS = getOwners(d);
  const OWNER_COLORS = getOwnerColors(d);

  // Per-person stats
  const personStats = OWNERS.map(owner => {
    const tasks = allItems.filter(i => i.owner === owner);
    const done = tasks.filter(i => d.checks[i.id]).length;
    const critical = tasks.filter(i => i.p === "CRITICAL" && !d.checks[i.id]).length;
    const inProgress = tasks.filter(i => d.statuses?.[i.id] === "In Progress").length;
    const overdue = tasks.filter(i => !d.checks[i.id] && daysUntil(i.due) < 0).length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

    // Velocity: tasks completed in last 3 days
    const threeDaysAgo = Date.now() - 3 * 86400000;
    const recentDone = (d.log || []).filter(l => l.ts > threeDaysAgo && tasks.some(t => t.id === l.id)).length;
    const velocity = (recentDone / 3).toFixed(1);

    return { owner, tasks: tasks.length, done, critical, inProgress, overdue, pct, velocity, remaining: tasks.length - done };
  });

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Team Dashboard
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { l: "Team Progress", v: total ? Math.round((doneCount / total) * 100) + "%" : "0%", c: theme.accent },
          { l: "Tasks Done", v: `${doneCount}/${total}`, c: "#22c55e" },
          { l: "Overdue", v: allItems.filter(i => !d.checks[i.id] && daysUntil(i.due) < 0).length, c: "#ef4444" },
          { l: "In Progress", v: allItems.filter(i => d.statuses?.[i.id] === "In Progress").length, c: "#f59e0b" },
        ].map((card, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase" }}>{card.l}</div>
            <div className="text-2xl font-extrabold mt-1" style={{ color: card.c }}>{card.v}</div>
          </div>
        ))}
      </div>

      {/* Person cards */}
      <div className="space-y-3">
        {personStats.map((p) => (
          <div key={p.owner} className="rounded-xl overflow-hidden" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-4 p-4">
              {/* Avatar + ring */}
              <div className="relative shrink-0">
                <ProgressRing value={p.pct} size={56} stroke={4} color={OWNER_COLORS[p.owner]} />
                <span className="absolute inset-0 flex items-center justify-center font-extrabold" style={{ fontSize: 11, color: OWNER_COLORS[p.owner] }}>
                  {p.pct}%
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge text={p.owner} color={OWNER_COLORS[p.owner]} />
                  <span style={{ fontSize: 12, color: theme.textMuted }}>{p.done}/{p.tasks} tasks done</span>
                </div>
                <ProgressBar value={p.pct} height={5} />
              </div>

              {/* Stats */}
              <div className="flex gap-4 shrink-0">
                {[
                  { l: "Velocity", v: p.velocity + "/day", c: theme.accent },
                  { l: "Critical", v: p.critical, c: "#ef4444" },
                  { l: "Remaining", v: p.remaining, c: theme.textMuted },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div style={{ fontSize: 9, color: theme.textDim, textTransform: "uppercase", fontWeight: 700 }}>{s.l}</div>
                    <div className="font-extrabold mt-0.5" style={{ fontSize: 16, color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue warning */}
            {p.overdue > 0 && (
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: "#ef444410", borderTop: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>⚠ {p.overdue} overdue task{p.overdue !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
