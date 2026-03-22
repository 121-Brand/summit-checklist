import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import ItemRow from "./ItemRow";
import { Badge } from "./Shared";
import { getOwners, getOwnerColors, PRIORITY_COLORS } from "../helpers";
import { useTheme } from "../ThemeContext";

const daysUntil = (d) => { if (!d) return 999; try { return Math.ceil((new Date(d + "T23:59:59") - new Date()) / 86400000); } catch { return 999; } };
const fmtDate = (d) => { if (!d) return "—"; try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return d; } };

export default function FocusView({ d, save, allItems, focusPerson, setFocusPerson, toggleCheck, setItemStatus, getStatus, selected, setSelected, editHandlers }) {
  const { theme } = useTheme();
  const OWNERS = getOwners(d);
  const OWNER_COLORS = getOwnerColors(d);
  const [aiRecs, setAiRecs] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const focusPool = focusPerson === "All" ? allItems : allItems.filter(i => i.owner === focusPerson);
  const focusItems = focusPool
    .filter(i => !d.checks[i.id])
    .sort((a, b) => {
      const da = daysUntil(a.due) - daysUntil(b.due);
      if (da !== 0) return da;
      const po = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
      return (po[a.p] ?? 2) - (po[b.p] ?? 2);
    })
    .slice(0, 10);

  const toggleSelect = (id) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n); };

  const askAiFocus = async () => {
    setAiLoading(true); setAiRecs(null);
    try {
      const pending = focusPool.filter(i => !d.checks[i.id]).slice(0, 30);
      const res = await fetch("/api/ai-assist", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "focus", data: { person: focusPerson, tasks: pending, context: d.context || {} } }) });
      const json = await res.json();
      if (json.result) setAiRecs(json.result);
    } catch (e) { console.error(e); }
    setAiLoading(false);
  };

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Focus Mode — Top 10 Priorities</div>

      <div className="flex gap-1.5 mb-4 flex-wrap items-center">
        {["All", ...OWNERS].map(o => (
          <button key={o} onClick={() => { setFocusPerson(o); setAiRecs(null); }}
            className="px-3 py-1.5 rounded-lg border-none cursor-pointer font-semibold transition-all"
            style={{ fontSize: 12, background: focusPerson === o ? (o === "All" ? theme.accent : OWNER_COLORS[o]) : theme.bgCard, color: focusPerson === o ? (o === "All" ? "#fff" : "#000") : theme.textMuted, border: `1px solid ${focusPerson === o ? "transparent" : theme.border}` }}>
            {o}
          </button>
        ))}
        <button onClick={askAiFocus} disabled={aiLoading || focusItems.length === 0}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-none cursor-pointer font-semibold transition-all"
          style={{ fontSize: 12, background: theme.accentBg, color: theme.accent, opacity: aiLoading || focusItems.length === 0 ? 0.5 : 1 }}>
          {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          What should {focusPerson === "All" ? "we" : focusPerson === "You" ? "I" : focusPerson} focus on?
        </button>
      </div>

      {aiRecs && (
        <div className="mb-5 p-4 rounded-xl" style={{ background: theme.accentBg, border: `1px solid ${theme.accent}30` }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} style={{ color: theme.accent }} />
            <span className="font-bold" style={{ fontSize: 12, color: theme.accent }}>AI Recommendations</span>
            <button onClick={() => setAiRecs(null)} className="ml-auto text-xs bg-transparent border-none cursor-pointer" style={{ color: theme.textDim }}>✕</button>
          </div>
          {aiRecs.dailyAdvice && <div className="mb-3 italic" style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.5 }}>"{aiRecs.dailyAdvice}"</div>}
          {(aiRecs.recommendations || []).map((rec, i) => {
            const task = focusPool.filter(t => !d.checks[t.id])[rec.taskIndex - 1];
            return (
              <div key={i} className="flex items-start gap-2 mb-2 pb-2" style={{ borderBottom: i < (aiRecs.recommendations || []).length - 1 ? `1px solid ${theme.border}` : "none" }}>
                <span className="font-extrabold shrink-0" style={{ fontSize: 13, color: theme.accent, width: 20 }}>{i + 1}</span>
                <div className="flex-1">
                  <div className="font-semibold" style={{ fontSize: 11.5, color: theme.text }}>{task?.text || `Task #${rec.taskIndex}`}</div>
                  <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>{rec.reason}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {focusItems.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-bold" style={{ color: "#22c55e" }}>All caught up!</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>{focusPerson === "All" ? "No pending tasks." : `${focusPerson} has no pending tasks.`}</div>
        </div>
      ) : (
        <div>
          <div className="p-4 rounded-xl mb-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.bgCard})`, border: `2px solid ${theme.border}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>🔥 Top Priority</div>
            <div className="font-bold leading-relaxed" style={{ fontSize: 15, color: theme.text }}>{focusItems[0].text}</div>
            <div className="flex gap-1.5 mt-3 items-center">
              <Badge text={focusItems[0].owner} color={OWNER_COLORS[focusItems[0].owner]} />
              <Badge text={focusItems[0].p} color={PRIORITY_COLORS[focusItems[0].p]} />
              <span style={{ fontSize: 10, color: theme.textMuted }}>{focusItems[0].sectionTitle} · Due {fmtDate(focusItems[0].due)}</span>
            </div>
          </div>

          {focusItems.length > 1 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Up Next</div>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}`, background: theme.bgCard }}>
                {focusItems.slice(1).map(it => {
                  const sec = d.sections.find(s => s.items.some(x => x.id === it.id));
                  return (
                    <ItemRow key={it.id} item={{ ...it, sectionDue: sec?.due }} sectionId={sec?.id || ""} compact d={d} save={save}
                      checks={d.checks} notes={d.notes} statuses={d.statuses} selected={selected} toggleSelect={toggleSelect}
                      toggleCheck={toggleCheck} setItemStatus={setItemStatus} getStatus={getStatus}
                      onNote={() => {}} onEdit={(item) => editHandlers.start(item)} onDelete={() => {}} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
