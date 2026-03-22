import { useState } from "react";
import { Plus, Trash2, Upload, Palette, Users, Target, FileText, Sun, Moon, Pipette, Activity, Download, Share2, Settings, Printer, FileSpreadsheet, Copy, Check, Link, Lock, Loader2, X, Globe } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { getOwners } from "../helpers";
import ActivityFeed from "./ActivityFeed";
import ExportView from "./ExportView";
import ShareInvite from "./ShareInvite";
import DocumentHub from "./DocumentHub";

const uid = () => "t" + Date.now() + Math.random().toString(36).slice(2, 6);

const ACCENT_PRESETS = [
  "#06b6d4", "#a78bfa", "#f59e0b", "#22c55e", "#ec4899", "#ef4444",
  "#f97316", "#84cc16", "#14b8a6", "#6366f1", "#e879f9", "#fb923c",
  "#38bdf8", "#34d399", "#fbbf24", "#f472b6",
];

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "export", label: "Export", icon: Download },
  { id: "share", label: "Share", icon: Share2 },
  { id: "docs", label: "Docs", icon: FileText },
];

export default function SettingsPage({ d, save, store, onUpload, onClearProject, allItems, total, doneCount, pct }) {
  const { themeId, setThemeId, themes, theme, customTheme, setCustomTheme, createCustomFromAccent } = useTheme();
  const [tab, setTab] = useState("general");
  const [customAccent, setCustomAccent] = useState(customTheme?.accent || "#06b6d4");
  const [customName, setCustomName] = useState(customTheme?.name || "My Theme");
  const [customDark, setCustomDark] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);

  const owners = getOwners(d);
  const inputStyle = { background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text };

  const addSection = (name, due) => {
    if (!name.trim()) return;
    save({ ...d, sections: [...d.sections, { id: uid(), title: name.trim(), due: due || "2026-03-28", items: [] }] });
  };

  return (
    <div className="max-w-4xl">
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-none cursor-pointer font-semibold whitespace-nowrap"
              style={{ fontSize: 12, background: tab === t.id ? theme.accent : "transparent", color: tab === t.id ? "#fff" : theme.textMuted }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Activity tab */}
      {tab === "activity" && <ActivityFeed d={d} />}

      {/* Export tab */}
      {tab === "export" && <ExportView d={d} allItems={allItems || []} total={total || 0} doneCount={doneCount || 0} pct={pct || 0} />}

      {/* Share tab */}
      {tab === "share" && <ShareInvite d={d} save={save} store={store} />}

      {/* Docs tab */}
      {tab === "docs" && <DocumentHub d={d} save={save} onUpload={onUpload} />}

      {/* General tab */}
      {tab === "general" && (
        <div className="max-w-2xl">
          {/* Theme */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Palette size={16} style={{ color: theme.accent }} />
                <div className="font-bold" style={{ fontSize: 14, color: theme.text }}>Theme</div>
              </div>
              <button onClick={() => setShowBuilder(!showBuilder)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer font-semibold"
                style={{ fontSize: 11, background: showBuilder ? theme.accentBg : "transparent", borderColor: showBuilder ? theme.accent + "40" : theme.border, color: showBuilder ? theme.accent : theme.textMuted }}>
                <Pipette size={13} /> {showBuilder ? "Hide Builder" : "Custom Theme"}
              </button>
            </div>

            {showBuilder && (
              <div className="mb-4 p-4 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <div className="flex gap-2 mb-3">
                  <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Theme name..." className="flex-1 px-3 py-2 text-xs rounded-lg outline-none" style={inputStyle} />
                  <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                    <button onClick={() => setCustomDark(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border-none cursor-pointer" style={{ fontSize: 10, fontWeight: 600, background: customDark ? theme.accent : "transparent", color: customDark ? "#fff" : theme.textDim }}><Moon size={11} /> Dark</button>
                    <button onClick={() => setCustomDark(false)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border-none cursor-pointer" style={{ fontSize: 10, fontWeight: 600, background: !customDark ? theme.accent : "transparent", color: !customDark ? "#fff" : theme.textDim }}><Sun size={11} /> Light</button>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {ACCENT_PRESETS.map(c => (
                    <button key={c} onClick={() => setCustomAccent(c)} className="w-6 h-6 rounded-lg border-none cursor-pointer" style={{ background: c, outline: customAccent === c ? `2px solid ${c}` : "none", outlineOffset: 2 }} />
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input type="color" value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-none" style={{ padding: 0 }} />
                  <input value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="flex-1 px-2 py-1.5 text-xs rounded-lg outline-none font-mono" style={inputStyle} />
                </div>
                <button onClick={() => createCustomFromAccent(customAccent, customName || "Custom", customDark)} className="w-full py-2.5 rounded-lg border-none font-bold cursor-pointer" style={{ fontSize: 12, background: customAccent, color: "#fff" }}>Apply Custom Theme</button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(themes).map(([id, t]) => (
                <button key={id} onClick={() => setThemeId(id)} className="p-2.5 rounded-xl cursor-pointer text-left" style={{ background: t.bg, border: `2px solid ${themeId === id ? t.accent : t.border}` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: t.accent }} />
                    <span className="font-bold" style={{ fontSize: 10, color: t.text }}>{t.name}</span>
                    {themeId === id && <span className="ml-auto" style={{ fontSize: 8, color: t.accent }}>✓</span>}
                  </div>
                  <div className="flex gap-0.5">{[t.bg, t.bgCard, t.accent, t.text].map((c, i) => <div key={i} className="w-2.5 h-2.5 rounded" style={{ background: c, border: `1px solid ${t.border}` }} />)}</div>
                </button>
              ))}
              {customTheme && (
                <button onClick={() => setThemeId("custom")} className="p-2.5 rounded-xl cursor-pointer text-left" style={{ background: customTheme.bg, border: `2px solid ${themeId === "custom" ? customTheme.accent : customTheme.border}` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: customTheme.accent }} />
                    <span className="font-bold" style={{ fontSize: 10, color: customTheme.text }}>{customTheme.name}</span>
                    {themeId === "custom" && <span className="ml-auto" style={{ fontSize: 8, color: customTheme.accent }}>✓</span>}
                  </div>
                  <div className="flex gap-0.5">{[customTheme.bg, customTheme.bgCard, customTheme.accent, customTheme.text].map((c, i) => <div key={i} className="w-2.5 h-2.5 rounded" style={{ background: c, border: `1px solid ${customTheme.border}` }} />)}</div>
                </button>
              )}
            </div>
          </section>

          {/* Project Context */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4"><Target size={16} style={{ color: theme.accent }} /><div className="font-bold" style={{ fontSize: 14, color: theme.text }}>Project Context</div></div>
            <div className="rounded-xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              <div className="mb-4">
                <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Project Goal</label>
                <textarea value={d.context?.goal || ""} onChange={(e) => save({ ...d, context: { ...d.context, goal: e.target.value } })} placeholder="What's the end goal?" className="w-full p-2.5 text-xs rounded-lg outline-none resize-none h-16 box-border" style={inputStyle} />
              </div>
              <div className="mb-4">
                <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Deadline</label>
                <input type="date" value={d.context?.deadline || ""} onChange={(e) => save({ ...d, context: { ...d.context, deadline: e.target.value } })} className="w-full p-2.5 text-xs rounded-lg outline-none box-border" style={inputStyle} />
              </div>
              <div className="mb-4">
                <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Team Members <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(these become task owners everywhere)</span></label>
                <div className="space-y-2">
                  {(d.context?.team || [{ name: "You", role: "Owner" }]).map((member, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={member.name} onChange={(e) => { const team = [...(d.context?.team || [{ name: "You", role: "" }])]; team[i] = { ...team[i], name: e.target.value }; save({ ...d, context: { ...d.context, team } }); }} placeholder="Name" className="flex-1 p-2 text-xs rounded-lg outline-none" style={inputStyle} />
                      <input value={member.role} onChange={(e) => { const team = [...(d.context?.team || [{ name: "You", role: "" }])]; team[i] = { ...team[i], role: e.target.value }; save({ ...d, context: { ...d.context, team } }); }} placeholder="Role" className="flex-1 p-2 text-xs rounded-lg outline-none" style={inputStyle} />
                      <button onClick={() => { const team = [...(d.context?.team || [])]; team.splice(i, 1); save({ ...d, context: { ...d.context, team } }); }} className="p-1 bg-transparent border-none cursor-pointer"><Trash2 size={14} color="#ef4444" /></button>
                    </div>
                  ))}
                  <button onClick={() => { const team = [...(d.context?.team || []), { name: "", role: "" }]; save({ ...d, context: { ...d.context, team } }); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border cursor-pointer" style={{ fontSize: 11, color: theme.accent, borderColor: theme.accent + "40", background: "transparent" }}><Plus size={12} /> Add member</button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
                <textarea value={d.context?.description || ""} onChange={(e) => save({ ...d, context: { ...d.context, description: e.target.value } })} placeholder="What are you building?" className="w-full p-2.5 text-xs rounded-lg outline-none resize-none h-16 box-border" style={inputStyle} />
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Priority Strategy</label>
                <textarea value={d.context?.priorityStrategy || ""} onChange={(e) => save({ ...d, context: { ...d.context, priorityStrategy: e.target.value } })} placeholder="How should tasks be prioritized?" className="w-full p-2.5 text-xs rounded-lg outline-none resize-none h-12 box-border" style={inputStyle} />
              </div>
            </div>
          </section>

          {/* Sections */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4"><FileText size={16} style={{ color: theme.accent }} /><div className="font-bold" style={{ fontSize: 14, color: theme.text }}>Sections</div></div>
            <div className="rounded-xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              <AddSectionForm onAdd={addSection} theme={theme} inputStyle={inputStyle} />
              <div className="mt-3 space-y-1">
                {d.sections.map(s => (
                  <div key={s.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: theme.bg }}>
                    <span className="flex-1 truncate" style={{ fontSize: 12, color: theme.text }}>{s.title}</span>
                    <span style={{ fontSize: 10, color: theme.textDim }}>{s.items.length} tasks · {s.due}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Danger */}
          <section>
            <div className="flex gap-3 flex-wrap">
              <button onClick={onUpload} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer font-semibold" style={{ fontSize: 12, background: theme.bgCard, borderColor: theme.border, color: theme.textMuted }}><Upload size={14} /> Upload Document</button>
              <button onClick={onClearProject} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer font-semibold" style={{ fontSize: 12, background: "transparent", borderColor: "#ef444440", color: "#ef4444" }}><Trash2 size={14} /> Clear All Tasks</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function AddSectionForm({ onAdd, theme, inputStyle }) {
  const handleSubmit = (e) => { e.preventDefault(); const fd = new FormData(e.target); onAdd(fd.get("name"), fd.get("due")); e.target.reset(); };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input name="name" placeholder="New section name..." className="flex-1 p-2 text-xs rounded-lg outline-none" style={inputStyle} />
      <input name="due" type="date" defaultValue="2026-03-28" className="p-2 text-xs rounded-lg outline-none" style={inputStyle} />
      <button type="submit" className="px-3 py-2 rounded-lg text-xs font-bold border-none cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>Add</button>
    </form>
  );
}
