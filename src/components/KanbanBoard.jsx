import { useState, useRef } from "react";
import { Badge } from "./Shared";
import { OWNERS, OWNER_COLORS, PRIORITY_COLORS, STATUS_COLORS } from "../data";
import { useTheme } from "../ThemeContext";

export default function KanbanBoard({ allItems, d, getStatus, setItemStatus }) {
  const { theme } = useTheme();
  const [groupBy, setGroupBy] = useState("status"); // status | owner | section | priority
  const [filterOwner, setFilterOwner] = useState("All");
  const dragItem = useRef(null);
  const dragOverCol = useRef(null);

  const onDragStart = (e, item) => {
    dragItem.current = item;
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = "0.4";
  };
  const onDragEnd = (e) => { e.target.style.opacity = "1"; dragItem.current = null; };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (e, colKey) => {
    e.preventDefault();
    const item = dragItem.current;
    if (!item) return;
    // If grouping by status, change task status
    if (groupBy === "status") {
      setItemStatus(item.id, colKey);
    }
    dragItem.current = null;
  };

  const filtered = filterOwner === "All" ? allItems : allItems.filter(i => i.owner === filterOwner);

  const getGroups = () => {
    if (groupBy === "status") {
      return ["Not Started", "In Progress", "Done"].map(col => ({
        key: col, label: col, color: STATUS_COLORS[col],
        items: filtered.filter(i => getStatus(i.id) === col),
      }));
    }
    if (groupBy === "owner") {
      return OWNERS.map(o => ({
        key: o, label: o, color: OWNER_COLORS[o],
        items: filtered.filter(i => i.owner === o),
      }));
    }
    if (groupBy === "priority") {
      return ["CRITICAL", "HIGH", "MEDIUM"].map(p => ({
        key: p, label: p, color: PRIORITY_COLORS[p],
        items: filtered.filter(i => i.p === p),
      }));
    }
    // section
    const secs = [...new Set(filtered.map(i => i.sectionTitle))];
    return secs.map(s => ({
      key: s, label: s, color: theme.accent,
      items: filtered.filter(i => i.sectionTitle === s),
    }));
  };

  const groups = getGroups();

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Board
        </div>
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          {[
            { id: "status", label: "Status" },
            { id: "owner", label: "Owner" },
            { id: "priority", label: "Priority" },
            { id: "section", label: "Section" },
          ].map(g => (
            <button key={g.id} onClick={() => setGroupBy(g.id)}
              className="px-2.5 py-1 rounded-md border-none cursor-pointer font-semibold"
              style={{ fontSize: 11, background: groupBy === g.id ? theme.accent : "transparent", color: groupBy === g.id ? "#fff" : theme.textMuted }}
            >{g.label}</button>
          ))}
        </div>
        <select
          value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}
          className="ml-auto px-2 py-1.5 text-xs rounded-lg outline-none cursor-pointer"
          style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textMuted }}
        >
          <option value="All">All owners</option>
          {OWNERS.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
        {groups.map((col) => (
          <div key={col.key} className="rounded-xl flex flex-col shrink-0" onDragOver={onDragOver} onDrop={(e) => onDrop(e, col.key)} style={{ width: 280, minWidth: 280, background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            {/* Column header */}
            <div className="px-3 py-2.5 flex justify-between items-center shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                <span className="font-bold truncate" style={{ fontSize: 12, color: theme.text, maxWidth: 180 }}>{col.label}</span>
              </div>
              <span className="px-2 rounded-full font-bold" style={{ fontSize: 10, background: theme.bgHover, color: theme.textMuted }}>
                {col.items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: "70vh" }}>
              {col.items.map((it) => (
                <div key={it.id} draggable={groupBy === "status"} onDragStart={(e) => onDragStart(e, it)} onDragEnd={onDragEnd} className="p-2.5 rounded-lg mb-1.5 cursor-grab active:cursor-grabbing" style={{ border: `1px solid ${theme.border}`, background: theme.bg }}>
                  <div className="leading-snug mb-2" style={{ fontSize: 11, color: theme.text }}>{it.text}</div>
                  <div className="flex gap-1 items-center flex-wrap">
                    <Badge text={it.owner} color={OWNER_COLORS[it.owner]} />
                    <Badge text={it.p} color={PRIORITY_COLORS[it.p]} />
                    {groupBy !== "section" && <span style={{ fontSize: 8, color: theme.textDim }} className="truncate max-w-[80px]">{it.sectionTitle}</span>}
                    <select
                      value={getStatus(it.id)} onChange={(e) => setItemStatus(it.id, e.target.value)}
                      className="ml-auto px-1 rounded bg-transparent font-semibold cursor-pointer outline-none"
                      style={{ fontSize: 9, border: `1px solid ${STATUS_COLORS[getStatus(it.id)]}`, color: STATUS_COLORS[getStatus(it.id)] }}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>
              ))}
              {col.items.length === 0 && (
                <div className="py-8 text-center" style={{ fontSize: 11, color: theme.textDim }}>No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
