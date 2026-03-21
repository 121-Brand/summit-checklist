import { useMemo } from "react";
import { useTheme } from "../ThemeContext";

export default function BurndownChart({ d, total, doneCount }) {
  const { theme } = useTheme();

  const burndownData = useMemo(() => {
    const startDate = new Date("2026-03-20");
    const numDays = 8;
    const log = (d.log || []).filter((l) => l.ts);
    const daily = {};
    log.forEach((l) => { const k = new Date(l.ts).toISOString().slice(0, 10); daily[k] = (daily[k] || 0) + 1; });
    const ideal = [];
    const actual = [];
    let cumDone = 0;
    for (let i = 0; i <= numDays; i++) {
      const dt = new Date(startDate);
      dt.setDate(dt.getDate() + i);
      const key = dt.toISOString().slice(0, 10);
      ideal.push({ x: i, y: total - (total / numDays * i) });
      cumDone += (daily[key] || 0);
      if (dt <= new Date()) actual.push({ x: i, y: Math.max(0, total - cumDone) });
    }
    const vel = actual.length > 1 ? (actual[0].y - actual[actual.length - 1].y) / (actual.length - 1) : 0;
    return { ideal, actual, vel, numDays, startDate };
  }, [d.log, total]);

  const { ideal, actual, vel, numDays, startDate } = burndownData;

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Burndown Chart
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { l: "Velocity", v: `${vel.toFixed(1)}/day`, c: theme.accent },
          { l: "Remaining", v: total - doneCount, c: "#f59e0b" },
          { l: "Completed", v: doneCount, c: "#22c55e" },
        ].map((card, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {card.l}
            </div>
            <div className="text-xl font-extrabold mt-1" style={{ color: card.c }}>{card.v}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl p-4 overflow-x-auto" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
        {(() => {
          const W = 560, H = 220, PL = 40, PBt = 24;
          const xS = (x) => (x / numDays) * (W - PL - 16) + PL;
          const yS = (v) => total > 0 ? (v / total) * (H - PL - PBt) : 0;
          const iLine = ideal.map((p, i) => `${i === 0 ? "M" : "L"}${xS(p.x)} ${H - PBt - yS(p.y)}`).join(" ");
          const aLine = actual.map((p, i) => `${i === 0 ? "M" : "L"}${xS(p.x)} ${H - PBt - yS(p.y)}`).join(" ");
          // Area fill under actual line
          const aFill = actual.length > 1
            ? `${aLine} L${xS(actual[actual.length - 1].x)} ${H - PBt} L${xS(actual[0].x)} ${H - PBt} Z`
            : "";
          return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <g key={f}>
                  <line x1={PL} x2={W - 16} y1={H - PBt - yS(total * f)} y2={H - PBt - yS(total * f)} stroke={theme.border} strokeWidth={1} />
                  <text x={PL - 5} y={H - PBt - yS(total * f) + 3} textAnchor="end" fill={theme.textDim} fontSize={9}>{Math.round(total * (1 - f))}</text>
                </g>
              ))}
              {/* X axis labels */}
              {Array.from({ length: numDays + 1 }, (_, i) => {
                const dt = new Date(startDate);
                dt.setDate(dt.getDate() + i);
                return <text key={i} x={xS(i)} y={H - 5} textAnchor="middle" fill={theme.textDim} fontSize={9}>{dt.getDate()}</text>;
              })}
              {/* Ideal line */}
              <path d={iLine} fill="none" stroke={theme.border} strokeWidth={2} strokeDasharray="6 4" />
              {/* Actual area */}
              {aFill && <path d={aFill} fill={theme.accent} opacity={0.08} />}
              {/* Actual line */}
              {actual.length > 1 && <path d={aLine} fill="none" stroke={theme.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
              {/* Dots */}
              {actual.map((p, i) => (
                <circle key={i} cx={xS(p.x)} cy={H - PBt - yS(p.y)} r={4} fill={theme.accent} stroke={theme.bgCard} strokeWidth={2} />
              ))}
              {/* Legend */}
              <line x1={W - 80} y1={10} x2={W - 60} y2={10} stroke={theme.border} strokeWidth={2} strokeDasharray="4 3" />
              <text x={W - 55} y={13} fill={theme.textDim} fontSize={9}>Ideal</text>
              <line x1={W - 80} y1={24} x2={W - 60} y2={24} stroke={theme.accent} strokeWidth={2.5} />
              <text x={W - 55} y={27} fill={theme.accent} fontSize={9}>Actual</text>
            </svg>
          );
        })()}
      </div>
      <div className="text-center mt-3" style={{ fontSize: 11, color: theme.textDim }}>
        Tasks remaining → 0 by March 28. Complete tasks to track your pace.
      </div>
    </div>
  );
}
