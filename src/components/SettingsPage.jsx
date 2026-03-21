import { useState } from "react";
import { Plus, Trash2, Upload, Palette, Users, Target, FileText, Sun, Moon, Pipette } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { OWNERS } from "../data";

const uid = () => "t" + Date.now() + Math.random().toString(36).slice(2, 6);

const ACCENT_PRESETS = [
  "#06b6d4", "#a78bfa", "#f59e0b", "#22c55e", "#ec4899", "#ef4444",
  "#f97316", "#84cc16", "#14b8a6", "#6366f1", "#e879f9", "#fb923c",
  "#38bdf8", "#34d399", "#fbbf24", "#f472b6",
];

export default function SettingsPage({ d, save, store, onUpload, onClearProject }) {
  const { themeId, setThemeId, themes, theme, customTheme, setCustomTheme, createCustomFromAccent } = useTheme();
  const [customAccent, setCustomAccent] = useState(customTheme?.accent || "#06b6d4");
  const [customName, setCustomName] = useState(customTheme?.name || "My Theme");
  const [customDark, setCustomDark] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);

  const addSection = (name, due) => {
    if (!name.trim()) return;
    save({ ...d, sections: [...d.sections, { id: uid(), title: name.trim(), due: due || "2026-03-28", items: [] }] });
  };

  const inputStyle = { background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text };

  return (
    <div className="max-w-2xl">
      {/* Theme selector */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette size={16} style={{ color: theme.accent }} />
            <div className="font-bold" style={{ fontSize: 14, color: theme.text }}>Theme</div>
          </div>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer font-semibold"
            style={{ fontSize: 11, background: showBuilder ? theme.accentBg : "transparent", borderColor: showBuilder ? theme.accent + "40" : theme.border, color: showBuilder ? theme.accent : theme.textMuted }}
          >
            <Pipette size={13} /> {showBuilder ? "Hide Builder" : "Custom Theme"}
          </button>
        </div>

        {/* Custom theme builder */}
        {showBuilder && (
          <div className="mb-4 p-4 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div className="font-bold mb-3" style={{ fontSize: 12, color: theme.text }}>Create Your Theme</div>

            {/* Name */}
            <div className="flex gap-2 mb-3">
              <input
                value={customName} onChange={(e) => setCustomName(e.target.value)}
                placeholder="Theme name..."
                className="flex-1 px-3 py-2 text-xs rounded-lg outline-none"
                style={inputStyle}
              />
              <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <button onClick={() => setCustomDark(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border-none cursor-pointer"
                  style={{ fontSize: 10, fontWeight: 600, background: customDark ? theme.accent : "transparent", color: customDark ? "#fff" : theme.textDim }}
                ><Moon size={11} /> Dark</button>
                <button onClick={() => setCustomDark(false)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border-none cursor-pointer"
                  style={{ fontSize: 10, fontWeight: 600, background: !customDark ? theme.accent : "transparent", color: !customDark ? "#fff" : theme.textDim }}
                ><Sun size={11} /> Light</button>
              </div>
            </div>

            {/* Accent color picker */}
            <div className="mb-3">
              <div className="mb-2" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Accent Color</div>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {ACCENT_PRESETS.map((c) => (
                  <button key={c} onClick={() => setCustomAccent(c)}
                    className="w-7 h-7 rounded-lg border-none cursor-pointer transition-all"
                    style={{ background: c, outline: customAccent === c ? `2px solid ${c}` : "none", outlineOffset: 2, transform: customAccent === c ? "scale(1.15)" : "scale(1)" }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={customAccent} onChange={(e) => setCustomAccent(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none" style={{ padding: 0 }} />
                <input value={customAccent} onChange={(e) => setCustomAccent(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg outline-none font-mono"
                  style={inputStyle} placeholder="#hex" />
              </div>
            </div>

            {/* Preview */}
            <div className="mb-3 p-3 rounded-lg" style={{ background: customDark ? "#0d0d12" : "#f8f8fa", border: `1px solid ${customDark ? "#2a2a38" : "#e0e0e6"}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: customAccent }} />
                <span className="font-bold" style={{ fontSize: 11, color: customDark ? "#e8e8ef" : "#1a1a24" }}>{customName || "Preview"}</span>
              </div>
              <div className="flex gap-1">
                {[customDark ? "#0d0d12" : "#f8f8fa", customDark ? "#16161e" : "#ffffff", customDark ? "#2a2a38" : "#e0e0e6", customAccent, customDark ? "#e8e8ef" : "#1a1a24"].map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded" style={{ background: c, border: `1px solid ${customDark ? "#2a2a38" : "#e0e0e6"}` }} />
                ))}
              </div>
            </div>

            <button onClick={() => createCustomFromAccent(customAccent, customName || "Custom", customDark)}
              className="w-full py-2.5 rounded-lg border-none font-bold cursor-pointer"
              style={{ fontSize: 12, background: customAccent, color: "#fff" }}
            >Apply Custom Theme</button>
          </div>
        )}

        {/* Preset themes grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(themes).map(([id, t]) => (
            <button key={id} onClick={() => setThemeId(id)}
              className="p-3 rounded-xl cursor-pointer text-left transition-all"
              style={{ background: t.bg, border: `2px solid ${themeId === id ? t.accent : t.border}`, boxShadow: themeId === id ? `0 0 0 1px ${t.accent}40` : "none" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3.5 h-3.5 rounded-full" style={{ background: t.accent }} />
                <span className="font-bold" style={{ fontSize: 11, color: t.text }}>{t.name}</span>
                {themeId === id && <span className="ml-auto px-1.5 rounded-full font-bold" style={{ fontSize: 8, background: t.accent, color: t.bg }}>✓</span>}
              </div>
              <div style={{ fontSize: 9, color: t.textMuted }}>{t.description}</div>
              <div className="flex gap-0.5 mt-1.5">
                {[t.bg, t.bgCard, t.accent, t.text].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded" style={{ background: c, border: `1px solid ${t.border}` }} />
                ))}
              </div>
            </button>
          ))}
          {/* Custom theme card */}
          {customTheme && (
            <button onClick={() => setThemeId("custom")}
              className="p-3 rounded-xl cursor-pointer text-left transition-all"
              style={{ background: customTheme.bg, border: `2px solid ${themeId === "custom" ? customTheme.accent : customTheme.border}`, boxShadow: themeId === "custom" ? `0 0 0 1px ${customTheme.accent}40` : "none" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3.5 h-3.5 rounded-full" style={{ background: customTheme.accent }} />
                <span className="font-bold" style={{ fontSize: 11, color: customTheme.text }}>{customTheme.name}</span>
                {themeId === "custom" && <span className="ml-auto px-1.5 rounded-full font-bold" style={{ fontSize: 8, background: customTheme.accent, color: customTheme.bg }}>✓</span>}
              </div>
              <div style={{ fontSize: 9, color: customTheme.textMuted }}>Your custom theme</div>
              <div className="flex gap-0.5 mt-1.5">
                {[customTheme.bg, customTheme.bgCard, customTheme.accent, customTheme.text].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded" style={{ background: c, border: `1px solid ${customTheme.border}` }} />
                ))}
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Project Context */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} style={{ color: theme.accent }} />
          <div className="font-bold" style={{ fontSize: 14, color: theme.text }}>Project Context</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          <div className="mb-4">
            <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Project Goal</label>
            <textarea value={d.context?.goal || ""} onChange={(e) => save({ ...d, context: { ...d.context, goal: e.target.value } })} placeholder="e.g. 'Launch AI agent package by March 28'" className="w-full p-2.5 text-xs rounded-lg outline-none resize-none h-16 box-border" style={inputStyle} />
          </div>
          <div className="mb-4">
            <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Deadline</label>
            <input type="date" value={d.context?.deadline || ""} onChange={(e) => save({ ...d, context: { ...d.context, deadline: e.target.value } })} className="w-full p-2.5 text-xs rounded-lg outline-none box-border" style={inputStyle} />
          </div>
          <div className="mb-4">
            <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Team Members</label>
            <div className="space-y-2">
              {(d.context?.team || OWNERS.map(o => ({ name: o, role: "" }))).map((member, i) => (
                <div key={i} className="flex gap-2">
                  <input value={member.name} onChange={(e) => { const team = [...(d.context?.team || OWNERS.map(o => ({ name: o, role: "" })))]; team[i] = { ...team[i], name: e.target.value }; save({ ...d, context: { ...d.context, team } }); }} placeholder="Name" className="flex-1 p-2 text-xs rounded-lg outline-none" style={inputStyle} />
                  <input value={member.role} onChange={(e) => { const team = [...(d.context?.team || OWNERS.map(o => ({ name: o, role: "" })))]; team[i] = { ...team[i], role: e.target.value }; save({ ...d, context: { ...d.context, team } }); }} placeholder="Role" className="flex-1 p-2 text-xs rounded-lg outline-none" style={inputStyle} />
                  <button onClick={() => { const team = [...(d.context?.team || OWNERS.map(o => ({ name: o, role: "" })))]; team.splice(i, 1); save({ ...d, context: { ...d.context, team } }); }} className="p-1 bg-transparent border-none cursor-pointer"><Trash2 size={14} color="#ef4444" /></button>
                </div>
              ))}
              <button onClick={() => { const team = [...(d.context?.team || OWNERS.map(o => ({ name: o, role: "" }))), { name: "", role: "" }]; save({ ...d, context: { ...d.context, team } }); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border cursor-pointer" style={{ fontSize: 11, color: theme.accent, borderColor: theme.accent + "40", background: "transparent" }}><Plus size={12} /> Add member</button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
            <textarea value={d.context?.description || ""} onChange={(e) => save({ ...d, context: { ...d.context, description: e.target.value } })} placeholder="What are you building?" className="w-full p-2.5 text-xs rounded-lg outline-none resize-none h-20 box-border" style={inputStyle} />
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Priority Strategy</label>
            <textarea value={d.context?.priorityStrategy || ""} onChange={(e) => save({ ...d, context: { ...d.context, priorityStrategy: e.target.value } })} placeholder="How should tasks be prioritized?" className="w-full p-2.5 text-xs rounded-lg outline-none resize-none h-16 box-border" style={inputStyle} />
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} style={{ color: theme.accent }} />
          <div className="font-bold" style={{ fontSize: 14, color: theme.text }}>Sections</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          <AddSectionForm onAdd={addSection} theme={theme} inputStyle={inputStyle} />
          <div className="mt-3 space-y-1">
            {d.sections.map(s => (
              <div key={s.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: theme.bg }}>
                <span className="flex-1 truncate" style={{ fontSize: 12, color: theme.text }}>{s.title}</span>
                <span style={{ fontSize: 10, color: theme.textDim }}>{s.items.length} tasks</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} style={{ color: theme.accent }} />
          <div className="font-bold" style={{ fontSize: 14, color: theme.text }}>Projects</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          {(store.projects || []).map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1.5">
              <span className="flex-1" style={{ fontSize: 12, color: p.id === store.activeId ? theme.accent : theme.text, fontWeight: p.id === store.activeId ? 700 : 400 }}>{p.name} {p.id === store.activeId && "✦"}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section>
        <div className="flex gap-3 flex-wrap">
          <button onClick={onUpload} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer font-semibold" style={{ fontSize: 12, background: theme.bgCard, borderColor: theme.border, color: theme.textMuted }}><Upload size={14} /> Upload Document</button>
          <button onClick={onClearProject} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer font-semibold" style={{ fontSize: 12, background: "transparent", borderColor: "#ef444440", color: "#ef4444" }}><Trash2 size={14} /> Clear All Tasks</button>
        </div>
      </section>
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
