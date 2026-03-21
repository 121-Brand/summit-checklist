import { ChevronDown, Menu, FolderPlus, Upload } from "lucide-react";
import { ProgressRing } from "./Shared";
import { useTheme } from "../ThemeContext";

export default function Header({ store, pct, onToggleSidebar, onUpload, onNewProject }) {
  const { theme } = useTheme();

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 sticky top-0 z-40"
      style={{ background: theme.headerBg, borderBottom: `1px solid ${theme.sidebarBorder}`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    >
      {/* Mobile burger */}
      <button onClick={onToggleSidebar} className="sm:hidden flex items-center justify-center border-none bg-transparent cursor-pointer p-1" style={{ color: theme.textMuted }}>
        <Menu size={20} />
      </button>

      {/* Project selector — styled pill */}
      <div
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer"
        style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
      >
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

      <div className="flex-1" />

      {/* Action buttons */}
      <button
        onClick={onUpload}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer font-semibold"
        style={{ fontSize: 12, background: "transparent", borderColor: theme.border, color: theme.textMuted }}
      >
        <Upload size={13} /> Import
      </button>
      <button
        onClick={onNewProject}
        className="flex items-center justify-center p-1.5 rounded-lg border cursor-pointer"
        style={{ background: "transparent", borderColor: theme.border, color: theme.textMuted }}
        title="New Project"
      >
        <FolderPlus size={14} />
      </button>

      {/* Progress ring */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <ProgressRing value={pct} size={32} stroke={3} />
          <span className="absolute inset-0 flex items-center justify-center font-extrabold" style={{ fontSize: 8, color: pct === 100 ? "#22c55e" : theme.accent }}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}
