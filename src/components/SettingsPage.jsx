import { Plus, Trash2, Upload, Sparkles, Palette, Users, Target, FileText } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { OWNERS } from "../data";

const uid = () => "t" + Date.now() + Math.random().toString(36).slice(2, 6);

export default function SettingsPage({
  d, save, store,
  onUpload, onClearProject,
}) {
  const { themeId, setThemeId, themes, theme } = useTheme();

  const addSection = (name, due) => {
    if (!name.trim()) return;
    save({ ...d, sections: [...d.sections, { id: uid(), title: name.trim(), due: due || "2026-03-28", items: [] }] });
  };

  const inputStyle = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    color: theme.text,
  };

  return (
    <div className="max-w-2xl">
      {/* Theme selector */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={16} style={{ color: theme.accent }} />
          <div className="font-bold" style={{ fontSize: 14, color: theme.text }}>Theme</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(themes).map(([id, t]) => (
            <button
              key={id}
              onClick={() => setThemeId(id)}
              className="p-3 rounded-xl cursor-pointer text-left transition-all"
              style={{
                background: t.bg,
                border: `2px solid ${themeId === id ? t.accent : t.border}`,
                boxShadow: themeId === id ? `0 0 0 1px ${t.accent}40` : "none",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full" style={{ background: t.accent }} />
                <span className="font-bold" style={{ fontSize: 12, color: t.text }}>{t.name}</span>
                {themeId === id && (
                  <span className="ml-auto px-1.5 rounded-full font-bold" style={{ fontSize: 9, background: t.accent, color: t.bg }}>
                    Active
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: t.textMuted }}>{t.description}</div>
              {/* Color preview dots */}
              <div className="flex gap-1 mt-2">
                {[t.bg, t.bgCard, t.border, t.accent, t.text].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ background: c, border: `1px solid ${t.border}` }} />
                ))}
              </div>
            </button>
          ))}
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
            <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Project Goal
            </label>
            <textarea
              value={d.context?.goal || ""}
              onChange={(e) => save({ ...d, context: { ...d.context, goal: e.target.value } })}
              placeholder="What is the end goal? e.g. 'Launch AI agent package for construction businesses by March 28'"
              className="w-full p-2.5 text-xs rounded-lg outline-none resize-none h-16 box-border"
              style={inputStyle}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Deadline
            </label>
            <input
              type="date"
              value={d.context?.deadline || ""}
              onChange={(e) => save({ ...d, context: { ...d.context, deadline: e.target.value } })}
              className="w-full p-2.5 text-xs rounded-lg outline-none box-border"
              style={inputStyle}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Team Members
            </label>
            <div className="space-y-2">
              {(d.context?.team || OWNERS.map((o) => ({ name: o, role: "" }))).map((member, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={member.name}
                    onChange={(e) => {
                      const team = [...(d.context?.team || OWNERS.map((o) => ({ name: o, role: "" })))];
                      team[i] = { ...team[i], name: e.target.value };
                      save({ ...d, context: { ...d.context, team } });
                    }}
                    placeholder="Name"
                    className="flex-1 p-2 text-xs rounded-lg outline-none"
                    style={inputStyle}
                  />
                  <input
                    value={member.role}
                    onChange={(e) => {
                      const team = [...(d.context?.team || OWNERS.map((o) => ({ name: o, role: "" })))];
                      team[i] = { ...team[i], role: e.target.value };
                      save({ ...d, context: { ...d.context, team } });
                    }}
                    placeholder="Role (e.g. QA, Builder, Strategy)"
                    className="flex-1 p-2 text-xs rounded-lg outline-none"
                    style={inputStyle}
                  />
                  <button
                    onClick={() => {
                      const team = [...(d.context?.team || OWNERS.map((o) => ({ name: o, role: "" })))];
                      team.splice(i, 1);
                      save({ ...d, context: { ...d.context, team } });
                    }}
                    className="p-1 bg-transparent border-none cursor-pointer"
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const team = [...(d.context?.team || OWNERS.map((o) => ({ name: o, role: "" }))), { name: "", role: "" }];
                  save({ ...d, context: { ...d.context, team } });
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border cursor-pointer"
                style={{ fontSize: 11, color: theme.accent, borderColor: theme.accent + "40", background: "transparent" }}
              >
                <Plus size={12} /> Add team member
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Description
            </label>
            <textarea
              value={d.context?.description || ""}
              onChange={(e) => save({ ...d, context: { ...d.context, description: e.target.value } })}
              placeholder="Brief description: What are you building? What modules/phases? Any key constraints?"
              className="w-full p-2.5 text-xs rounded-lg outline-none resize-none h-20 box-border"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Priority Strategy
            </label>
            <textarea
              value={d.context?.priorityStrategy || ""}
              onChange={(e) => save({ ...d, context: { ...d.context, priorityStrategy: e.target.value } })}
              placeholder="How should tasks be prioritized? e.g. 'Testing and QA first, documentation second.'"
              className="w-full p-2.5 text-xs rounded-lg outline-none resize-none h-16 box-border"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* Manage Sections */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} style={{ color: theme.accent }} />
          <div className="font-bold" style={{ fontSize: 14, color: theme.text }}>Sections</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          <AddSectionForm onAdd={addSection} theme={theme} inputStyle={inputStyle} />
          <div className="mt-3 space-y-1">
            {d.sections.map((s) => (
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
          {(store.projects || []).map((p) => (
            <div key={p.id} className="flex items-center gap-2 py-1.5">
              <span className="flex-1" style={{ fontSize: 12, color: p.id === store.activeId ? theme.accent : theme.text, fontWeight: p.id === store.activeId ? 700 : 400 }}>
                {p.name} {p.id === store.activeId && "✦"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer font-semibold"
            style={{ fontSize: 12, background: theme.bgCard, borderColor: theme.border, color: theme.textMuted }}
          >
            <Upload size={14} /> Upload & Parse Document
          </button>
          <button
            onClick={onClearProject}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer font-semibold"
            style={{ fontSize: 12, background: "transparent", borderColor: "#ef444440", color: "#ef4444" }}
          >
            <Trash2 size={14} /> Clear All Tasks
          </button>
        </div>
      </section>
    </div>
  );
}

function AddSectionForm({ onAdd, theme, inputStyle }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onAdd(fd.get("name"), fd.get("due"));
    e.target.reset();
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input name="name" placeholder="New section name..." className="flex-1 p-2 text-xs rounded-lg outline-none" style={inputStyle} />
      <input name="due" type="date" defaultValue="2026-03-28" className="p-2 text-xs rounded-lg outline-none" style={inputStyle} />
      <button type="submit" className="px-3 py-2 rounded-lg text-xs font-bold border-none cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>
        Add
      </button>
    </form>
  );
}
