import { useState } from "react";
import { Sparkles, Upload, Plus, FolderPlus } from "lucide-react";
import { ProgressBar, ProgressRing, Badge } from "./Shared";
import { getOwners, getOwnerColors } from "../helpers";
import { useTheme } from "../ThemeContext";

const fmtDate = (d) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return d; }
};
const daysUntil = (d) => Math.ceil((new Date(d + "T23:59:59") - new Date()) / 86400000);
const uid = () => "t" + Date.now() + Math.random().toString(36).slice(2, 6);

export default function Dashboard({ d, save, allItems, total, doneCount, pct, secStats, goToSection, onSetup, onUpload }) {
  const { theme } = useTheme();
  const OWNERS = getOwners(d);
  const OWNER_COLORS = getOwnerColors(d);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSecName, setNewSecName] = useState("");
  const [newSecDue, setNewSecDue] = useState("2026-03-28");
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [quickTask, setQuickTask] = useState("");
  const [quickSec, setQuickSec] = useState("");
  const [quickOwner, setQuickOwner] = useState("Chase");

  const inputStyle = { background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text };

  const addSection = () => {
    if (!newSecName.trim()) return;
    save({ ...d, sections: [...d.sections, { id: uid(), title: newSecName.trim(), due: newSecDue, items: [] }] });
    setNewSecName(""); setShowAddSection(false);
  };

  const addQuickTask = () => {
    if (!quickTask.trim() || !quickSec) return;
    save({
      ...d,
      sections: d.sections.map(s => s.id === quickSec
        ? { ...s, items: [...s.items, { id: uid(), text: quickTask.trim(), owner: quickOwner, p: "HIGH" }] }
        : s
      )
    });
    setQuickTask(""); setShowQuickTask(false);
  };

  if (total === 0 && d.sections.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-5xl mb-4">🚀</div>
        <div className="text-xl font-bold mb-1" style={{ color: theme.text }}>Get Started</div>
        <div className="text-sm mb-8 max-w-md mx-auto" style={{ color: theme.textMuted }}>
          Create sections and tasks manually, or upload a document and let AI organize everything.
        </div>
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {/* Add Section inline */}
          {showAddSection ? (
            <div className="p-4 rounded-xl text-left" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              <div className="font-bold mb-2" style={{ fontSize: 12, color: theme.text }}>New Section</div>
              <input value={newSecName} onChange={(e) => setNewSecName(e.target.value)} placeholder="e.g. Marketing, Development, QA..." className="w-full p-2.5 text-sm rounded-lg outline-none mb-2 box-border" style={inputStyle} autoFocus onKeyDown={(e) => e.key === "Enter" && addSection()} />
              <div className="flex gap-2">
                <input type="date" value={newSecDue} onChange={(e) => setNewSecDue(e.target.value)} className="flex-1 p-2 text-xs rounded-lg outline-none" style={inputStyle} />
                <button onClick={addSection} className="px-4 py-2 rounded-lg border-none text-xs font-bold cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>Create</button>
                <button onClick={() => setShowAddSection(false)} className="px-3 py-2 rounded-lg border-none text-xs cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddSection(true)} className="w-full py-3.5 rounded-xl border cursor-pointer flex items-center justify-center gap-2 font-bold text-sm" style={{ background: theme.accentBg, borderColor: theme.accent + "40", color: theme.accent }}>
              <FolderPlus size={16} /> Add Your First Section
            </button>
          )}
          <button onClick={onUpload} className="w-full py-3.5 rounded-xl border cursor-pointer flex items-center justify-center gap-2 font-bold text-sm" style={{ background: theme.bgCard, borderColor: theme.border, color: theme.textMuted }}>
            <Upload size={16} /> Upload & Import Document
          </button>
          <button onClick={onSetup} className="w-full py-3 rounded-xl border cursor-pointer flex items-center justify-center gap-2 text-sm" style={{ background: "transparent", borderColor: theme.border, color: theme.textDim }}>
            <Sparkles size={14} /> Set Up Project Context (AI)
          </button>
          <div style={{ fontSize: 11, color: theme.textDim, marginTop: 4 }}>
            Tip: Create a section first, then add tasks to it. Or upload a Word/Excel/CSV file to bulk-import tasks.
          </div>
        </div>
      </div>
    );
  }

  const criticalCount = allItems.filter((i) => i.p === "CRITICAL" && !d.checks[i.id]).length;
  const inProgressCount = allItems.filter((i) => (d.statuses?.[i.id] === "In Progress")).length;

  return (
    <div>
      {/* Quick action bar */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {showQuickTask ? (
          <div className="flex-1 flex gap-2 items-center p-2 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <input value={quickTask} onChange={(e) => setQuickTask(e.target.value)} placeholder="Task description..." className="flex-1 px-2.5 py-1.5 text-xs rounded-lg outline-none" style={inputStyle} autoFocus onKeyDown={(e) => e.key === "Enter" && addQuickTask()} />
            <select value={quickSec} onChange={(e) => setQuickSec(e.target.value)} className="px-2 py-1.5 text-xs rounded-lg outline-none cursor-pointer" style={inputStyle}>
              <option value="">Section...</option>
              {d.sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <select value={quickOwner} onChange={(e) => setQuickOwner(e.target.value)} className="px-2 py-1.5 text-xs rounded-lg outline-none cursor-pointer" style={inputStyle}>
              {OWNERS.map(o => <option key={o}>{o}</option>)}
            </select>
            <button onClick={addQuickTask} className="px-3 py-1.5 rounded-lg border-none text-xs font-bold cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>Add</button>
            <button onClick={() => setShowQuickTask(false)} className="px-2 py-1.5 rounded-lg border-none text-xs cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted }}>✕</button>
          </div>
        ) : showAddSection ? (
          <div className="flex-1 flex gap-2 items-center p-2 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <input value={newSecName} onChange={(e) => setNewSecName(e.target.value)} placeholder="Section name..." className="flex-1 px-2.5 py-1.5 text-xs rounded-lg outline-none" style={inputStyle} autoFocus onKeyDown={(e) => e.key === "Enter" && addSection()} />
            <input type="date" value={newSecDue} onChange={(e) => setNewSecDue(e.target.value)} className="px-2 py-1.5 text-xs rounded-lg outline-none" style={inputStyle} />
            <button onClick={addSection} className="px-3 py-1.5 rounded-lg border-none text-xs font-bold cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>Add</button>
            <button onClick={() => setShowAddSection(false)} className="px-2 py-1.5 rounded-lg border-none text-xs cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted }}>✕</button>
          </div>
        ) : (
          <>
            <button onClick={() => setShowQuickTask(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer font-semibold" style={{ fontSize: 12, background: theme.accentBg, borderColor: theme.accent + "30", color: theme.accent }}>
              <Plus size={14} /> Add Task
            </button>
            <button onClick={() => setShowAddSection(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer font-semibold" style={{ fontSize: 12, background: "transparent", borderColor: theme.border, color: theme.textMuted }}>
              <FolderPlus size={14} /> Add Section
            </button>
          </>
        )}
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { l: "Progress", v: `${pct}%`, ring: true },
          { l: "Critical", v: criticalCount, c: "#ef4444" },
          { l: "In Progress", v: inProgressCount, c: "#f59e0b" },
          { l: "Done", v: `${doneCount}/${total}`, c: "#22c55e" },
        ].map((card, i) => (
          <div key={i} className="p-4 rounded-xl flex items-center gap-3" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            {card.ring ? (
              <div className="relative">
                <ProgressRing value={pct} size={48} stroke={4} />
                <span className="absolute inset-0 flex items-center justify-center font-extrabold" style={{ fontSize: 12, color: pct === 100 ? "#22c55e" : theme.accent }}>{pct}%</span>
              </div>
            ) : (
              <div className="text-2xl font-extrabold" style={{ color: card.c }}>{card.v}</div>
            )}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.l}</div>
              {card.ring && <div style={{ fontSize: 11, color: theme.textMuted }}>{doneCount} of {total} tasks</div>}
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
            <div key={o} className="p-3 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              <div className="flex justify-between items-center mb-2">
                <Badge text={o} color={OWNER_COLORS[o]} />
                <span className="font-extrabold" style={{ fontSize: 13, color: op === 100 ? "#22c55e" : theme.text }}>{op}%</span>
              </div>
              <ProgressBar value={op} height={4} />
              <div style={{ fontSize: 10, color: theme.textDim, marginTop: 6 }}>{done}/{items.length} tasks</div>
            </div>
          );
        })}
      </div>

      {/* Section list */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Sections</div>
        {d.sections.map((s) => {
          const st = secStats(s);
          const du = daysUntil(s.due);
          return (
            <div key={s.id} onClick={() => goToSection(s.id)} className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg cursor-pointer transition-colors" style={{ border: `1px solid ${theme.border}` }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate" style={{ fontSize: 12, color: theme.text }}>{s.title}</div>
              </div>
              <div style={{ width: 48 }}><ProgressBar value={st.pct} height={3} /></div>
              <span className="font-bold" style={{ fontSize: 11, color: st.pct === 100 ? "#22c55e" : theme.textMuted, width: 32, textAlign: "right" }}>{st.pct}%</span>
              <span style={{ fontSize: 10, width: 48, textAlign: "right", color: du <= 0 ? "#ef4444" : du <= 2 ? "#f59e0b" : theme.textDim }}>{fmtDate(s.due)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
