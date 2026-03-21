import { Clipboard, Menu, FolderPlus, Upload } from "lucide-react";
import { ProgressBar } from "./Shared";
import { useTheme } from "../ThemeContext";

export default function Header({
  store, pct, sidebarCollapsed, onToggleSidebar,
  onUpload, onNewProject,
}) {
  const { theme } = useTheme();

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 sticky top-0 z-40"
      style={{
        background: theme.headerBg,
        borderBottom: `1px solid ${theme.sidebarBorder}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Mobile burger */}
      <button
        onClick={onToggleSidebar}
        className="sm:hidden flex items-center justify-center border-none bg-transparent cursor-pointer p-1"
        style={{ color: theme.textMuted }}
      >
        <Menu size={20} />
      </button>

      {/* Project selector */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 sm:hidden"
          style={{ background: `linear-gradient(135deg, #f59e0b, ${theme.accent})` }}
        >
          <Clipboard size={12} color="#0f172a" />
        </div>
        <select
          value={store.activeId || ""}
          onChange={(e) => store.loadProject(e.target.value)}
          className="text-xs font-bold bg-transparent border-none cursor-pointer outline-none max-w-[180px]"
          style={{ color: theme.text }}
        >
          {(store.projects || []).map((p) => (
            <option key={p.id} value={p.id} style={{ background: theme.bgCard }}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <button
        onClick={onUpload}
        className="flex items-center gap-1 px-2 py-1 rounded-lg border cursor-pointer text-xs"
        style={{ background: "transparent", borderColor: theme.border, color: theme.textMuted }}
      >
        <Upload size={11} /> Import
      </button>
      <button
        onClick={onNewProject}
        className="flex items-center justify-center px-1.5 py-1 rounded-lg border cursor-pointer"
        style={{ background: "transparent", borderColor: theme.border, color: theme.textMuted }}
      >
        <FolderPlus size={12} />
      </button>

      {/* Progress */}
      <div className="flex items-center gap-1.5">
        <div style={{ width: 40 }}><ProgressBar value={pct} height={4} /></div>
        <span className="font-extrabold" style={{ fontSize: 11, color: pct === 100 ? "#22c55e" : theme.accent }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}
