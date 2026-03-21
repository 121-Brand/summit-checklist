import { CheckCircle2, Upload, Trash2, Clock, Edit3, AlertTriangle } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { OWNER_COLORS } from "../data";

const timeAgo = (ts) => {
  if (!ts) return "";
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
};

export default function ActivityFeed({ d }) {
  const { theme } = useTheme();

  // Build activity from completion log + document uploads
  const activities = [];

  // Task completions
  const allItems = {};
  (d.sections || []).forEach(s => s.items.forEach(it => { allItems[it.id] = { ...it, section: s.title }; }));

  (d.log || []).forEach(l => {
    if (l.ts && l.id) {
      const task = allItems[l.id];
      activities.push({
        type: "complete", ts: l.ts,
        text: task?.text || "Unknown task",
        owner: task?.owner || "—",
        section: task?.section || "",
      });
    }
  });

  // Document uploads
  (d.documents || []).forEach(doc => {
    activities.push({
      type: "upload", ts: doc.uploadedAt,
      text: doc.name,
      detail: `${doc.taskCount} tasks extracted (${doc.parseMode})`,
    });
  });

  // Sort newest first
  activities.sort((a, b) => b.ts - a.ts);

  const iconMap = {
    complete: { icon: CheckCircle2, color: "#22c55e" },
    upload: { icon: Upload, color: theme.accent },
  };

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Activity Feed
      </div>

      {activities.length === 0 ? (
        <div className="py-16 text-center">
          <Clock size={32} style={{ color: theme.textDim, margin: "0 auto 12px" }} />
          <div className="text-lg font-bold mb-2" style={{ color: theme.text }}>No activity yet</div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>Complete tasks and upload documents to see your activity here.</div>
        </div>
      ) : (
        <div>
          {/* Stats bar */}
          <div className="flex gap-3 mb-5">
            {[
              { label: "Today", count: activities.filter(a => Date.now() - a.ts < 86400000).length },
              { label: "This week", count: activities.filter(a => Date.now() - a.ts < 604800000).length },
              { label: "Total", count: activities.length },
            ].map((s, i) => (
              <div key={i} className="flex-1 p-3 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase" }}>{s.label}</div>
                <div className="text-xl font-extrabold mt-0.5" style={{ color: theme.accent }}>{s.count}</div>
              </div>
            ))}
          </div>

          {/* Feed */}
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
            {activities.slice(0, 50).map((a, i) => {
              const { icon: Icon, color } = iconMap[a.type] || iconMap.complete;
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3" style={{ background: i % 2 === 0 ? theme.bgCard : theme.bg, borderBottom: i < Math.min(activities.length, 50) - 1 ? `1px solid ${theme.border}` : "none" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: color + "18" }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate" style={{ fontSize: 12, color: theme.text }}>{a.text}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {a.owner && <span className="px-1.5 rounded font-bold text-white" style={{ fontSize: 9, background: OWNER_COLORS[a.owner] || theme.textDim }}>{a.owner}</span>}
                      {a.section && <span style={{ fontSize: 10, color: theme.textDim }}>{a.section}</span>}
                      {a.detail && <span style={{ fontSize: 10, color: theme.textMuted }}>{a.detail}</span>}
                    </div>
                  </div>
                  <span className="shrink-0" style={{ fontSize: 10, color: theme.textDim }}>{timeAgo(a.ts)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
