import { Check, MessageSquare, Edit3, Trash2 } from "lucide-react";
import { Badge } from "./Shared";
import { OWNER_COLORS, PRIORITY_COLORS, STATUS_COLORS } from "../data";
import { useTheme } from "../ThemeContext";

export default function ItemRow({
  item, sectionId, compact,
  checks, notes, statuses,
  selected, toggleSelect, toggleCheck,
  setItemStatus, getStatus,
  onNote, onEdit, onDelete,
}) {
  const { theme } = useTheme();
  const ck = checks[item.id];
  const isSel = selected.has(item.id);
  const status = getStatus(item.id);
  const isBlocked = item.blockedBy?.length > 0 && item.blockedBy.some(id => !checks[id]);

  return (
    <div
      className="flex items-start gap-1.5"
      style={{
        padding: compact ? "3px 8px" : "7px 10px",
        borderBottom: `1px solid ${theme.border}`,
        opacity: ck ? 0.45 : 1,
        background: isSel ? theme.accentBg : "transparent",
        transition: "background 0.15s, opacity 0.15s",
      }}
    >
      {/* Select checkbox */}
      <button
        onClick={() => toggleSelect(item.id)}
        className="mt-1 flex items-center justify-center shrink-0 border-none cursor-pointer"
        style={{
          width: 14, height: 14, borderRadius: 3, padding: 0,
          border: `1.5px solid ${isSel ? theme.accent : theme.border}`,
          background: isSel ? theme.accent : "transparent",
        }}
      >
        {isSel ? <Check size={7} color="#fff" strokeWidth={3} /> : null}
      </button>

      {/* Done checkbox */}
      <button
        onClick={() => toggleCheck(item.id)}
        className="mt-0.5 flex items-center justify-center shrink-0 border-none cursor-pointer"
        style={{
          width: 17, height: 17, borderRadius: 5, padding: 0,
          border: ck ? "none" : `2px solid ${theme.textDim}`,
          background: ck ? "#22c55e" : "transparent",
        }}
      >
        {ck ? <Check size={10} color="#fff" strokeWidth={3} /> : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className={`leading-relaxed ${ck ? "line-through" : ""}`}
          style={{
            fontSize: compact ? 10.5 : 12,
            color: ck ? theme.textDim : theme.text,
          }}
        >
          {item.text}
        </div>
        <div className="flex gap-1 mt-0.5 items-center flex-wrap">
          <Badge text={item.owner} color={OWNER_COLORS[item.owner] || "#6b7280"} />
          <Badge text={item.p} color={PRIORITY_COLORS[item.p]} />
          <select
            value={status}
            onChange={(e) => setItemStatus(item.id, e.target.value)}
            className="px-0.5 rounded bg-transparent font-semibold cursor-pointer outline-none"
            style={{
              fontSize: 9, lineHeight: "16px",
              border: `1px solid ${STATUS_COLORS[status]}`,
              color: STATUS_COLORS[status],
            }}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          {isBlocked && (
            <span className="px-1 rounded font-bold" style={{ fontSize: 8, background: "#ef444420", color: "#ef4444" }}>BLOCKED</span>
          )}
          <button
            onClick={() => onNote(item.id)}
            className="border-none bg-transparent cursor-pointer p-0"
            style={{ color: notes[item.id] ? theme.accent : theme.textDim }}
          >
            <MessageSquare size={9} />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="border-none bg-transparent cursor-pointer p-0"
            style={{ color: theme.textDim }}
          >
            <Edit3 size={9} />
          </button>
          <button
            onClick={() => onDelete(sectionId, item.id)}
            className="border-none bg-transparent cursor-pointer p-0"
            style={{ color: "#ef4444" }}
          >
            <Trash2 size={9} />
          </button>
        </div>

        {/* Note display */}
        {notes[item.id] ? (
          <div
            className="mt-1 px-2 py-1 rounded italic"
            style={{
              fontSize: 10, background: theme.bgCard,
              border: `1px solid ${theme.border}`, color: theme.textMuted,
            }}
          >
            {notes[item.id]}
          </div>
        ) : null}
      </div>
    </div>
  );
}
