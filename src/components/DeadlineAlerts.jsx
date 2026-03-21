import { AlertTriangle, Clock, X } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { Badge } from "./Shared";
import { OWNER_COLORS, PRIORITY_COLORS } from "../data";

const daysUntil = (d) => Math.ceil((new Date(d + "T23:59:59") - new Date()) / 86400000);

export default function DeadlineAlerts({ d, allItems, onDismiss }) {
  const { theme } = useTheme();

  const overdue = allItems.filter(i => !d.checks[i.id] && daysUntil(i.due) < 0);
  const dueSoon = allItems.filter(i => !d.checks[i.id] && daysUntil(i.due) >= 0 && daysUntil(i.due) <= 2);

  if (overdue.length === 0 && dueSoon.length === 0) return null;

  return (
    <div className="mb-5 space-y-2">
      {overdue.length > 0 && (
        <div className="p-3 rounded-xl" style={{ background: "#ef444412", border: "1px solid #ef444430" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} style={{ color: "#ef4444" }} />
            <span className="font-bold" style={{ fontSize: 12, color: "#ef4444" }}>
              {overdue.length} overdue task{overdue.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-1">
            {overdue.slice(0, 5).map((it, i) => (
              <div key={i} className="flex items-center gap-2 py-1" style={{ borderBottom: i < Math.min(overdue.length, 5) - 1 ? `1px solid ${theme.border}` : "none" }}>
                <span className="flex-1 truncate" style={{ fontSize: 11, color: theme.text }}>{it.text}</span>
                <Badge text={it.owner} color={OWNER_COLORS[it.owner]} />
                <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>{Math.abs(daysUntil(it.due))}d late</span>
              </div>
            ))}
            {overdue.length > 5 && <div style={{ fontSize: 10, color: "#ef4444" }}>+{overdue.length - 5} more</div>}
          </div>
        </div>
      )}

      {dueSoon.length > 0 && (
        <div className="p-3 rounded-xl" style={{ background: "#f59e0b10", border: "1px solid #f59e0b30" }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} style={{ color: "#f59e0b" }} />
            <span className="font-bold" style={{ fontSize: 12, color: "#f59e0b" }}>
              {dueSoon.length} task{dueSoon.length !== 1 ? "s" : ""} due within 2 days
            </span>
          </div>
          <div className="space-y-1">
            {dueSoon.slice(0, 5).map((it, i) => (
              <div key={i} className="flex items-center gap-2 py-1" style={{ borderBottom: i < Math.min(dueSoon.length, 5) - 1 ? `1px solid ${theme.border}` : "none" }}>
                <span className="flex-1 truncate" style={{ fontSize: 11, color: theme.text }}>{it.text}</span>
                <Badge text={it.owner} color={OWNER_COLORS[it.owner]} />
                <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>{daysUntil(it.due) === 0 ? "today" : daysUntil(it.due) + "d left"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
