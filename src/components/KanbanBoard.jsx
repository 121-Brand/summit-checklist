import { Badge } from "./Shared";
import { OWNER_COLORS, PRIORITY_COLORS, STATUS_COLORS } from "../data";
import { useTheme } from "../ThemeContext";

export default function KanbanBoard({ allItems, d, getStatus, setItemStatus }) {
  const { theme } = useTheme();

  const columns = ["Not Started", "In Progress", "Done"];

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Board View
      </div>
      <div className="grid grid-cols-3 gap-3" style={{ minHeight: 400 }}>
        {columns.map((col) => {
          const items = allItems.filter((i) => getStatus(i.id) === col);
          return (
            <div
              key={col}
              className="rounded-xl flex flex-col"
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
            >
              {/* Column header */}
              <div
                className="px-3 py-2.5 flex justify-between items-center"
                style={{ borderBottom: `1px solid ${theme.border}` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[col] }} />
                  <span className="font-bold" style={{ fontSize: 11, color: theme.text }}>{col}</span>
                </div>
                <span
                  className="px-1.5 rounded-full font-bold"
                  style={{ fontSize: 10, background: theme.bgHover, color: theme.textMuted }}
                >
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: "60vh" }}>
                {items.slice(0, 80).map((it) => (
                  <div
                    key={it.id}
                    className="p-2.5 rounded-lg mb-1.5 transition-colors"
                    style={{ border: `1px solid ${theme.border}`, background: theme.bg }}
                  >
                    <div className="leading-snug mb-2" style={{ fontSize: 10.5, color: theme.text }}>
                      {it.text}
                    </div>
                    <div className="flex gap-1 items-center flex-wrap">
                      <Badge text={it.owner} color={OWNER_COLORS[it.owner]} />
                      <Badge text={it.p} color={PRIORITY_COLORS[it.p]} />
                      <select
                        value={getStatus(it.id)}
                        onChange={(e) => setItemStatus(it.id, e.target.value)}
                        className="ml-auto px-1 rounded bg-transparent font-semibold cursor-pointer outline-none"
                        style={{
                          fontSize: 9,
                          border: `1px solid ${STATUS_COLORS[getStatus(it.id)]}`,
                          color: STATUS_COLORS[getStatus(it.id)],
                        }}
                      >
                        <option value="Not Started">NS</option>
                        <option value="In Progress">IP</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="py-6 text-center" style={{ fontSize: 11, color: theme.textDim }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
