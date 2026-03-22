import { useMemo } from "react";
import { useTheme } from "../ThemeContext";

export default function BurndownChart({ d, total, doneCount }) {
  const { theme } = useTheme();

  const burndownData = useMemo(() => {
    const log = (d.log || []).filter(l => l.ts);
    if (log.length === 0 && total === 0) return null;

    // Dynamic dates: use first log entry as start, deadline as end
    const deadline = d.context?.deadline;
    const firstLog = log.length > 0 ? Math.min(...log.map(l => l.ts)) : Date.now();
    const startDate = new Date(firstLog);
    startDate.setHours(0, 0, 0, 0);

    let endDate;
    if (deadline) {
      endDate = new Date(deadline + "T23:59:59");
    } else {
      // Default: 14 days from first activity or today
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14);
    }

    const numDays = Math.max(3, Math.ceil((endDate - startDate) / 86400000));
    const daily = {};
    log.forEach(l => { const k = new Date(l.ts).toISOString().slice(0, 10); daily[k] = (daily[k] || 0) + 1; });

    const ideal = [];
    const actual = [];
    let cumDone = 0;
    for (let i = 0; i <= numDays; i++) {
      const dt = new Date(startDate);
      dt.setDate(dt.getDate() + i);
      const key = dt.toISOString().slice(0, 10);
      ideal.push({ x: i, y: total - (total / numDays * i), date: dt });
      cumDone += (daily[key] || 0);
      if (dt <= new Date()) actual.push({ x: i, y: Math.max(0, total - cumDone), date: dt });
    }
    const vel = actual.length > 1 ? (actual[0].y - actual[actual.length - 1].y) / (actual.length - 1) : 0;
    const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / 86400000));
    const projectedDays = vel > 0 ? Math.ceil((total - doneCount) / vel) : Infinity;

    return { ideal, actual, vel, numDays, startDate, daysLeft, projectedDays, onTrack: projectedDays <= daysLeft };
  }, [d.log, d.context?.deadline, total, doneCount]);

  if (!burndownData) {
    return (
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Burndown Chart</div>
        <div className="py-16 text-center">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-lg font-bold mb-2" style={{ color: theme.text }}>No data yet</div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>Complete some tasks to see your burndown chart. Set a deadline in Settings for the ideal line.</div>
        </div>
      </div>
    );
  }

  const { ideal, actual, vel, numDays, startDate, daysLeft, projectedDays, onTrack } = burndownData;

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Burndown Chart</div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { l: "Velocity", v: vel > 0 ? `${vel.toFixed(1)}/day` : "—", c: theme.accent },
          { l: "Remaining", v: total - doneCount, c: "#f59e0b" },
          { l: "Days Left", v: daysLeft, c: daysLeft <= 2 ? "#ef4444" : theme.textMuted },
          { l: "On Track", v: total === doneCount ? "Done!" : onTrack ? "Yes ✓" : "Behind", c: total === doneCount ? "#22c55e" : onTrack ? "#22c55e" : "#ef4444" },
        ].map((card, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase" }}>{card.l}</div>
            <div className="text-xl font-extrabold mt-1" style={{ color: card.c }}>{card.v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 overflow-x-auto" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
        {(() => {
          const W = 560, H = 220, PL = 40, PBt = 24;
          const xS = (x) => (x / numDays) * (W - PL - 16) + PL;
          const yS = (v) => total > 0 ? (v / total) * (H - PL - PBt) : 0;
          const iLine = ideal.map((p, i) => `${i === 0 ? "M" : "L"}${xS(p.x)} ${H - PBt - yS(p.y)}`).join(" ");
          const aLine = actual.map((p, i) => `${i === 0 ? "M" : "L"}${xS(p.x)} ${H - PBt - yS(p.y)}`).join(" ");
          const aFill = actual.length > 1 ? `${aLine} L${xS(actual[actual.length - 1].x)} ${H - PBt} L${xS(actual[0].x)} ${H - PBt} Z` : "";
          // Show ~8 labels max
          const labelInterval = Math.max(1, Math.floor(numDays / 8));
          return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
              {[0, 0.25, 0.5, 0.75, 1].map(f => (
                <g key={f}>
                  <line x1={PL} x2={W - 16} y1={H - PBt - yS(total * f)} y2={H - PBt - yS(total * f)} stroke={theme.border} strokeWidth={1} />
                  <text x={PL - 5} y={H - PBt - yS(total * f) + 3} textAnchor="end" fill={theme.textDim} fontSize={9}>{Math.round(total * (1 - f))}</text>
                </g>
              ))}
              {ideal.filter((_, i) => i % labelInterval === 0 || i === numDays).map((p) => (
                <text key={p.x} x={xS(p.x)} y={H - 5} textAnchor="middle" fill={theme.textDim} fontSize={8}>
                  {p.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </text>
              ))}
              <path d={iLine} fill="none" stroke={theme.border} strokeWidth={2} strokeDasharray="6 4" />
              {aFill && <path d={aFill} fill={theme.accent} opacity={0.08} />}
              {actual.length > 1 && <path d={aLine} fill="none" stroke={theme.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
              {actual.map((p, i) => <circle key={i} cx={xS(p.x)} cy={H - PBt - yS(p.y)} r={4} fill={theme.accent} stroke={theme.bgCard} strokeWidth={2} />)}
              <line x1={W - 80} y1={10} x2={W - 60} y2={10} stroke={theme.border} strokeWidth={2} strokeDasharray="4 3" />
              <text x={W - 55} y={13} fill={theme.textDim} fontSize={9}>Ideal</text>
              <line x1={W - 80} y1={24} x2={W - 60} y2={24} stroke={theme.accent} strokeWidth={2.5} />
              <text x={W - 55} y={27} fill={theme.accent} fontSize={9}>Actual</text>
            </svg>
          );
        })()}
      </div>
      <div className="text-center mt-3" style={{ fontSize: 11, color: theme.textDim }}>
        {vel > 0
          ? `At current pace (${vel.toFixed(1)} tasks/day), you'll finish in ${projectedDays} days. ${onTrack ? "You're on track!" : `That's ${projectedDays - daysLeft} days past deadline.`}`
          : "Complete tasks to start tracking velocity."}
      </div>
    </div>
  );
}
