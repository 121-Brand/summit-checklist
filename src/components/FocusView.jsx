import ItemRow from "./ItemRow";
import { Badge } from "./Shared";
import { OWNERS, OWNER_COLORS, PRIORITY_COLORS } from "../data";
import { useTheme } from "../ThemeContext";

const daysUntil = (d) => Math.ceil((new Date(d + "T23:59:59") - new Date()) / 86400000);
const fmtDate = (d) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return d; }
};

export default function FocusView({
  d, allItems, focusPerson, setFocusPerson,
  toggleCheck, setItemStatus, getStatus,
  selected, setSelected, editHandlers,
}) {
  const { theme } = useTheme();

  const focusPool = focusPerson === "All" ? allItems : allItems.filter((i) => i.owner === focusPerson);
  const focusItems = focusPool
    .filter((i) => !d.checks[i.id])
    .sort((a, b) => {
      const da = daysUntil(a.due) - daysUntil(b.due);
      if (da !== 0) return da;
      const po = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
      return (po[a.p] ?? 2) - (po[b.p] ?? 2);
    })
    .slice(0, 10);

  const toggleSelect = (id) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };

  const deleteItem = () => {}; // No delete from focus view

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Focus Mode — Top 10 Priorities
      </div>

      {/* Person filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {["All", ...OWNERS].map((o) => (
          <button
            key={o}
            onClick={() => setFocusPerson(o)}
            className="px-3 py-1.5 rounded-lg border-none cursor-pointer font-semibold transition-all"
            style={{
              fontSize: 12,
              background: focusPerson === o ? (o === "All" ? theme.accent : OWNER_COLORS[o]) : theme.bgCard,
              color: focusPerson === o ? (o === "All" ? "#fff" : "#000") : theme.textMuted,
              border: `1px solid ${focusPerson === o ? "transparent" : theme.border}`,
            }}
          >
            {o}
          </button>
        ))}
      </div>

      {focusItems.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-bold" style={{ color: "#22c55e" }}>All caught up!</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
            {focusPerson === "All" ? "No pending tasks." : `${focusPerson} has no pending tasks.`}
          </div>
        </div>
      ) : (
        <div>
          {/* Top priority hero card */}
          <div
            className="p-4 rounded-xl mb-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${theme.bg}, ${theme.bgCard})`,
              border: `2px solid ${theme.border}`,
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5" style={{
              background: `radial-gradient(circle, ${theme.accent}, transparent)`,
            }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              🔥 Top Priority
            </div>
            <div className="font-bold leading-relaxed" style={{ fontSize: 15, color: theme.text }}>
              {focusItems[0].text}
            </div>
            <div className="flex gap-1.5 mt-3 items-center">
              <Badge text={focusItems[0].owner} color={OWNER_COLORS[focusItems[0].owner]} />
              <Badge text={focusItems[0].p} color={PRIORITY_COLORS[focusItems[0].p]} />
              <span style={{ fontSize: 10, color: theme.textMuted }}>
                {focusItems[0].sectionTitle} · Due {fmtDate(focusItems[0].due)}
              </span>
            </div>
          </div>

          {/* Remaining items */}
          {focusItems.length > 1 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Up Next
              </div>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}`, background: theme.bgCard }}>
                {focusItems.slice(1).map((it) => {
                  const sec = d.sections.find((s) => s.items.some((x) => x.id === it.id));
                  return (
                    <ItemRow
                      key={it.id}
                      item={it}
                      sectionId={sec?.id || ""}
                      compact
                      checks={d.checks}
                      notes={d.notes}
                      statuses={d.statuses}
                      selected={selected}
                      toggleSelect={toggleSelect}
                      toggleCheck={toggleCheck}
                      setItemStatus={setItemStatus}
                      getStatus={getStatus}
                      onNote={() => {}}
                      onEdit={(item) => editHandlers.start(item)}
                      onDelete={deleteItem}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
