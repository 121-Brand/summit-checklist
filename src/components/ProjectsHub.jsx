import { useState } from "react";
import { Plus, Trash2, FolderOpen, BarChart3, ListChecks, Clock, LogOut } from "lucide-react";
import { ProgressRing, ProgressBar } from "./Shared";
import { useTheme } from "../ThemeContext";

const uid = () => "t" + Date.now() + Math.random().toString(36).slice(2, 6);

export default function ProjectsHub({ store, onSelectProject, onLogout }) {
  const { theme } = useTheme();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const projects = store.projects || [];

  // Load each project's data to show stats
  const getProjectStats = (id) => {
    try {
      const raw = localStorage.getItem("summit-data-" + id);
      if (!raw) return { sections: 0, tasks: 0, done: 0, pct: 0 };
      const data = JSON.parse(raw);
      let tasks = 0, done = 0;
      (data.sections || []).forEach(s => s.items.forEach(it => {
        tasks++;
        if (data.checks?.[it.id]) done++;
      }));
      return {
        sections: (data.sections || []).length,
        tasks,
        done,
        pct: tasks > 0 ? Math.round((done / tasks) * 100) : 0,
        goal: data.context?.goal || "",
        deadline: data.context?.deadline || "",
      };
    } catch { return { sections: 0, tasks: 0, done: 0, pct: 0 }; }
  };

  const createProject = () => {
    if (!newName.trim()) return;
    const id = uid();
    const np = [...projects, { id, name: newName.trim() }];
    store.setProjects(np);
    const nd = { sections: [], checks: {}, notes: {}, statuses: {}, log: [], context: {}, documents: [], comments: {} };
    store.saveData(nd, id);
    store.setActiveId(id);
    store.saveData(nd, id);
    setNewName(""); setShowNew(false);
    onSelectProject(id);
  };

  const deleteProject = (id) => {
    const np = projects.filter(p => p.id !== id);
    store.setProjects(np);
    store.deleteProject(id);
    setConfirmDelete(null);
    if (store.activeId === id && np.length > 0) {
      store.loadProject(np[0].id);
    }
  };

  const inputStyle = { background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text };

  return (
    <div className="min-h-screen" style={{ background: theme.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, #f59e0b, ${theme.accent})` }}>
          <ListChecks size={16} color="#0f172a" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-extrabold" style={{ color: theme.text, letterSpacing: "-0.02em" }}>SUMMIT</span>
        <div className="flex-1" />
        <button onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer font-semibold"
          style={{ fontSize: 12, background: "transparent", borderColor: theme.border, color: theme.textMuted }}>
          <LogOut size={13} /> Log Out
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-2xl font-extrabold" style={{ color: theme.text, letterSpacing: "-0.02em" }}>Your Projects</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
              {projects.length} checklist{projects.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-none cursor-pointer font-bold"
            style={{ fontSize: 13, background: theme.accent, color: "#fff" }}>
            <Plus size={16} /> New Project
          </button>
        </div>

        {/* New project form */}
        {showNew && (
          <div className="mb-6 p-4 rounded-xl view-enter" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div className="font-bold mb-3" style={{ fontSize: 13, color: theme.text }}>Create New Project</div>
            <div className="flex gap-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Project name..."
                className="flex-1 px-3 py-2.5 text-sm rounded-lg outline-none" style={inputStyle}
                autoFocus onKeyDown={(e) => e.key === "Enter" && createProject()} />
              <button onClick={createProject} className="px-5 py-2.5 rounded-lg border-none font-bold cursor-pointer" style={{ background: theme.accent, color: "#fff", fontSize: 13 }}>Create</button>
              <button onClick={() => setShowNew(false)} className="px-3 py-2.5 rounded-lg border-none cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted, fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Project cards */}
        {projects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: theme.accentBg, border: `1px solid ${theme.accent}30` }}>
              <FolderOpen size={28} style={{ color: theme.accent }} />
            </div>
            <div className="text-lg font-bold mb-2" style={{ color: theme.text }}>No projects yet</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 16 }}>Create your first project to get started.</div>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl border-none cursor-pointer font-bold mx-auto" style={{ background: theme.accent, color: "#fff" }}>
              <Plus size={16} /> Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map(p => {
              const stats = getProjectStats(p.id);
              const isActive = store.activeId === p.id;
              return (
                <div key={p.id} className="rounded-xl overflow-hidden cursor-pointer transition-all"
                  onClick={() => onSelectProject(p.id)}
                  style={{ background: theme.bgCard, border: `2px solid ${isActive ? theme.accent : theme.border}`, boxShadow: isActive ? `0 0 0 1px ${theme.accent}30` : "none" }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = theme.accent + "60"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = theme.border; }}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <ProgressRing value={stats.pct} size={48} stroke={4} />
                        <span className="absolute inset-0 flex items-center justify-center font-extrabold" style={{ fontSize: 11, color: stats.pct === 100 ? "#22c55e" : theme.accent }}>
                          {stats.pct}%
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate" style={{ fontSize: 15, color: theme.text }}>{p.name}</div>
                        {stats.goal && <div className="truncate mt-0.5" style={{ fontSize: 11, color: theme.textMuted }}>{stats.goal}</div>}
                        <div className="flex items-center gap-3 mt-2">
                          <span style={{ fontSize: 10, color: theme.textDim }}>{stats.sections} sections</span>
                          <span style={{ fontSize: 10, color: theme.textDim }}>{stats.done}/{stats.tasks} tasks</span>
                          {stats.deadline && (
                            <span className="flex items-center gap-1" style={{ fontSize: 10, color: theme.textDim }}>
                              <Clock size={9} /> {stats.deadline}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Delete */}
                      <div onClick={(e) => e.stopPropagation()}>
                        {confirmDelete === p.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteProject(p.id)} className="px-2 py-1 rounded border-none text-[10px] font-bold cursor-pointer" style={{ background: "#ef4444", color: "#fff" }}>Delete</button>
                            <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 rounded border-none text-[10px] cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted }}>No</button>
                          </div>
                        ) : (
                          projects.length > 1 && (
                            <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 rounded-lg border cursor-pointer" style={{ background: "transparent", borderColor: theme.border, color: theme.textDim }}>
                              <Trash2 size={12} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-3"><ProgressBar value={stats.pct} height={4} /></div>
                  {isActive && (
                    <div className="px-4 py-1.5" style={{ background: theme.accentBg, borderTop: `1px solid ${theme.border}` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent }}>Currently open</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
