import { useState, useRef, useEffect } from "react";
import { ChevronDown, Menu, FolderPlus, Upload, Pencil, Check, X, LayoutGrid } from "lucide-react";
import { ProgressRing } from "./Shared";
import { useTheme } from "../ThemeContext";

export default function Header({ store, pct, onToggleSidebar, onUpload, onNewProject, onGoToProjects }) {
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const inputRef = useRef(null);

  const currentProject = (store.projects || []).find(p => p.id === store.activeId);

  const startRename = () => {
    if (!currentProject) return;
    setEditName(currentProject.name);
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const saveRename = () => {
    if (!editName.trim() || !currentProject) { setEditing(false); return; }
    const updated = (store.projects || []).map(p => p.id === currentProject.id ? { ...p, name: editName.trim() } : p);
    store.setProjects(updated);
    setEditing(false);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 sticky top-0 z-40"
      style={{ background: theme.headerBg, borderBottom: `1px solid ${theme.sidebarBorder}`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    >
      <button onClick={onToggleSidebar} className="sm:hidden flex items-center justify-center border-none bg-transparent cursor-pointer p-1" style={{ color: theme.textMuted }}>
        <Menu size={20} />
      </button>

      {/* Project name — editable */}
      {editing ? (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: theme.bgCard, border: `1px solid ${theme.accent}` }}>
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setEditing(false); }}
            className="text-sm font-bold bg-transparent border-none outline-none"
            style={{ color: theme.text, width: Math.max(80, editName.length * 8) }}
          />
          <button onClick={saveRename} className="p-0.5 bg-transparent border-none cursor-pointer"><Check size={14} style={{ color: "#22c55e" }} /></button>
          <button onClick={() => setEditing(false)} className="p-0.5 bg-transparent border-none cursor-pointer"><X size={14} style={{ color: "#ef4444" }} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {(store.projects || []).length > 1 ? (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              <select
                value={store.activeId || ""}
                onChange={(e) => store.loadProject(e.target.value)}
                className="text-sm font-bold bg-transparent border-none cursor-pointer outline-none appearance-none pr-1"
                style={{ color: theme.text, maxWidth: 200 }}
              >
                {(store.projects || []).map((p) => (
                  <option key={p.id} value={p.id} style={{ background: theme.bgCard }}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ color: theme.textDim }} />
            </div>
          ) : (
            <span className="text-sm font-bold px-3 py-1.5 rounded-lg" style={{ color: theme.text, background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              {currentProject?.name || "My Project"}
            </span>
          )}
          <button onClick={startRename} className="p-1 bg-transparent border-none cursor-pointer" style={{ color: theme.textDim }} title="Rename project">
            <Pencil size={12} />
          </button>
        </div>
      )}

      <div className="flex-1" />

      <button onClick={onGoToProjects} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer font-semibold" style={{ fontSize: 11, background: "transparent", borderColor: theme.border, color: theme.textDim }} title="All Projects">
        <LayoutGrid size={12} /> Projects
      </button>
      <button onClick={onUpload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer font-semibold" style={{ fontSize: 12, background: "transparent", borderColor: theme.border, color: theme.textMuted }}>
        <Upload size={13} /> Import
      </button>
      <button onClick={onNewProject} className="flex items-center justify-center p-1.5 rounded-lg border cursor-pointer" style={{ background: "transparent", borderColor: theme.border, color: theme.textMuted }} title="New Project">
        <FolderPlus size={14} />
      </button>

      <div className="flex items-center gap-2">
        <div className="relative">
          <ProgressRing value={pct} size={32} stroke={3} />
          <span className="absolute inset-0 flex items-center justify-center font-extrabold" style={{ fontSize: 8, color: pct === 100 ? "#22c55e" : theme.accent }}>{pct}%</span>
        </div>
      </div>
    </div>
  );
}
