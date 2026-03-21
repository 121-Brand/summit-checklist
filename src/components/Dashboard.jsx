import { Sparkles, Upload } from "lucide-react";
import { ProgressBar, ProgressRing, Badge } from "./Shared";
import { OWNERS, OWNER_COLORS } from "../data";
import { useTheme } from "../ThemeContext";

const fmtDate = (d) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return d; }
};
const daysUntil = (d) => Math.ceil((new Date(d + "T23:59:59") - new Date()) / 86400000);

export default function Dashboard({ d, allItems, total, doneCount, pct, secStats, goToSection, onSetup, onUpload }) {
  const { theme } = useTheme();

  if (total === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl mb-4">🚀</div>
        <div className="text-xl font-bold mb-1" style={{ color: theme.text }}>Get Started</div>
        <div className="text-sm mb-8 max-w-md mx-auto" style={{ color: theme.textMuted }}>
          Set up your project context, then upload your documents and let AI break them into organized tasks.
        </div>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button
            onClick={onSetup}
            className="w-full py-3.5 rounded-xl border cursor-pointer flex items-center justify-center gap-2 font-bold text-sm transition-all"
            style={{ background: theme.accentBg, borderColor: theme.accent + "40", color: theme.accent }}
          >
            <Sparkles size={16} /> Step 1: Project Setup
          </button>
          <button
            onClick={onUpload}
            className="w-full py-3.5 rounded-xl border cursor-pointer flex items-center justify-center gap-2 font-bold text-sm transition-all"
            style={{ background: theme.bgCard, borderColor: theme.border, color: theme.textMuted }}
          >
            <Upload size={16} /> Step 2: Upload Documents
          </button>
          <div style={{ fontSize: 11, color: theme.textDim, marginTop: 8 }}>
            Supports Word (.docx), Excel (.xlsx), CSV, and text files. AI will auto-extract tasks, assign owners, and set priorities.
          </div>
        </div>
      </div>
    );
  }

  const criticalCount = allItems.filter((i) => i.p === "CRITICAL" && !d.checks[i.id]).length;
  const inProgressCount = allItems.filter((i) => (d.statuses?.[i.id] === "In Progress")).length;

  return (
    <div>
      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { l: "Progress", v: `${pct}%`, ring: true },
          { l: "Critical", v: criticalCount, c: "#ef4444" },
          { l: "In Progress", v: inProgressCount, c: "#f59e0b" },
          { l: "Done", v: `${doneCount}/${total}`, c: "#22c55e" },
        ].map((card, i) => (
          <div
            key={i}
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            {card.ring ? (
              <div className="relative">
                <ProgressRing value={pct} size={48} stroke={4} />
                <span
                  className="absolute inset-0 flex items-center justify-center font-extrabold"
                  style={{ fontSize: 12, color: pct === 100 ? "#22c55e" : theme.accent }}
                >
                  {pct}%
                </span>
              </div>
            ) : (
              <div className="text-2xl font-extrabold" style={{ color: card.c }}>{card.v}</div>
            )}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {card.l}
              </div>
              {card.ring && (
                <div style={{ fontSize: 11, color: theme.textMuted }}>{doneCount} of {total} tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Owner cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {OWNERS.map((o) => {
          const items = allItems.filter((i) => i.owner === o);
          const done = items.filter((i) => d.checks[i.id]).length;
          const op = items.length ? Math.round((done / items.length) * 100) : 0;
          return (
            <div
              key={o}
              className="p-3 rounded-xl"
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
            >
              <div className="flex justify-between items-center mb-2">
                <Badge text={o} color={OWNER_COLORS[o]} />
                <span className="font-extrabold" style={{ fontSize: 13, color: op === 100 ? "#22c55e" : theme.text }}>
                  {op}%
                </span>
              </div>
              <ProgressBar value={op} height={4} />
              <div style={{ fontSize: 10, color: theme.textDim, marginTop: 6 }}>{done}/{items.length} tasks</div>
            </div>
          );
        })}
      </div>

      {/* Section list */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Sections
        </div>
        {d.sections.map((s) => {
          const st = secStats(s);
          const du = daysUntil(s.due);
          return (
            <div
              key={s.id}
              onClick={() => goToSection(s.id)}
              className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg cursor-pointer transition-colors"
              style={{
                border: `1px solid ${theme.border}`,
                background: "transparent",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate" style={{ fontSize: 12, color: theme.text }}>{s.title}</div>
              </div>
              <div style={{ width: 48 }}><ProgressBar value={st.pct} height={3} /></div>
              <span className="font-bold" style={{ fontSize: 11, color: st.pct === 100 ? "#22c55e" : theme.textMuted, width: 32, textAlign: "right" }}>
                {st.pct}%
              </span>
              <span style={{
                fontSize: 10, width: 48, textAlign: "right",
                color: du <= 0 ? "#ef4444" : du <= 2 ? "#f59e0b" : theme.textDim,
              }}>
                {fmtDate(s.due)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
