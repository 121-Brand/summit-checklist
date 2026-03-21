import {
  LayoutDashboard, ListChecks, Target, Columns3, TrendingDown,
  FileText, Settings, ChevronLeft, ChevronRight, Clipboard,
  Activity, Users, Download
} from "lucide-react";
import { useTheme } from "../ThemeContext";

const NAV_ITEMS = [
  { id: "dash", label: "Home", icon: LayoutDashboard },
  { id: "list", label: "Tasks", icon: ListChecks },
  { id: "focus", label: "Focus", icon: Target },
  { id: "kanban", label: "Board", icon: Columns3 },
  { id: "team", label: "Team", icon: Users },
  { id: "docs", label: "Docs", icon: FileText },
  { id: "burndown", label: "Burndown", icon: TrendingDown },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "export", label: "Export", icon: Download },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ view, setView, collapsed, setCollapsed, pct }) {
  const { theme } = useTheme();

  return (
    <div
      className="fixed left-0 top-0 h-full flex flex-col z-50 transition-all duration-300"
      style={{
        width: collapsed ? 56 : 200,
        background: theme.sidebar,
        borderRight: `1px solid ${theme.sidebarBorder}`,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{ height: 56, borderBottom: `1px solid ${theme.sidebarBorder}` }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, #f59e0b, ${theme.accent})` }}
        >
          <Clipboard size={14} color="#0f172a" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span style={{ fontSize: 15, fontWeight: 800, color: theme.text, letterSpacing: "-0.02em" }}>
            SUMMIT
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="flex items-center gap-2.5 rounded-lg border-none cursor-pointer transition-all duration-150"
              style={{
                padding: collapsed ? "10px 0" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: active ? theme.accentBg : "transparent",
                color: active ? theme.accent : theme.textMuted,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
              }}
              title={collapsed ? item.label : undefined}
              data-tip={collapsed ? item.label : undefined}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Progress + Collapse */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: `1px solid ${theme.sidebarBorder}` }}
      >
        {!collapsed && (
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Progress
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: pct === 100 ? "#22c55e" : theme.accent }}>
                {pct}%
              </span>
            </div>
            <div style={{ height: 4, background: theme.border, borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  width: `${pct}%`, height: "100%",
                  background: pct === 100 ? "#22c55e" : theme.accent,
                  borderRadius: 2, transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full rounded-md border-none cursor-pointer transition-colors"
          style={{
            padding: "6px 0",
            background: theme.bgHover,
            color: theme.textDim,
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
}
