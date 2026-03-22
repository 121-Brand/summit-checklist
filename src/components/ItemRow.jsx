import { useState } from "react";
import { Check, MessageSquare, Edit3, Trash2, ChevronDown, ChevronRight, Send } from "lucide-react";
import { Badge } from "./Shared";
import { PRIORITY_COLORS, STATUS_COLORS, getOwnerColors } from "../helpers";
import { useTheme } from "../ThemeContext";

const fmtDate = (d) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return d; } };

export default function ItemRow({
  item, sectionId, compact, d,
  checks, notes, statuses,
  selected, toggleSelect, toggleCheck,
  setItemStatus, getStatus,
  onNote, onEdit, onDelete, save,
}) {
  const { theme } = useTheme();
  const ownerColors = getOwnerColors(d);
  const ck = checks[item.id];
  const isSel = selected.has(item.id);
  const status = getStatus(item.id);
  const isBlocked = item.blockedBy?.length > 0 && item.blockedBy.some(id => !checks[id]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const comments = d.comments?.[item.id] || [];

  const addComment = () => {
    if (!newComment.trim() || !save) return;
    const c = { text: newComment.trim(), ts: Date.now(), author: "You" };
    save({ ...d, comments: { ...(d.comments || {}), [item.id]: [...comments, c] } });
    setNewComment("");
  };

  const taskDue = item.due || item.sectionDue;

  return (
    <div style={{ borderBottom: `1px solid ${theme.border}`, opacity: ck ? 0.45 : 1, background: isSel ? theme.accentBg : "transparent" }}>
      <div className="flex items-start gap-1.5" style={{ padding: compact ? "3px 8px" : "7px 10px" }}>
        <button onClick={() => toggleSelect(item.id)} className="mt-1 flex items-center justify-center shrink-0 border-none cursor-pointer"
          style={{ width: 14, height: 14, borderRadius: 3, padding: 0, border: `1.5px solid ${isSel ? theme.accent : theme.border}`, background: isSel ? theme.accent : "transparent" }}>
          {isSel ? <Check size={7} color="#fff" strokeWidth={3} /> : null}
        </button>
        <button onClick={() => toggleCheck(item.id)} className="mt-0.5 flex items-center justify-center shrink-0 border-none cursor-pointer"
          style={{ width: 17, height: 17, borderRadius: 5, padding: 0, border: ck ? "none" : `2px solid ${theme.textDim}`, background: ck ? "#22c55e" : "transparent" }}>
          {ck ? <Check size={10} color="#fff" strokeWidth={3} /> : null}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`leading-relaxed ${ck ? "line-through" : ""}`} style={{ fontSize: compact ? 10.5 : 12, color: ck ? theme.textDim : theme.text }}>
            {item.text}
          </div>
          <div className="flex gap-1 mt-0.5 items-center flex-wrap">
            <Badge text={item.owner} color={ownerColors[item.owner] || "#6b7280"} />
            <Badge text={item.p} color={PRIORITY_COLORS[item.p]} />
            {isBlocked && <span className="px-1 rounded font-bold" style={{ fontSize: 8, background: "#ef444420", color: "#ef4444" }}>BLOCKED</span>}
            <select value={status} onChange={(e) => setItemStatus(item.id, e.target.value)} className="px-0.5 rounded bg-transparent font-semibold cursor-pointer outline-none"
              style={{ fontSize: 9, lineHeight: "16px", border: `1px solid ${STATUS_COLORS[status]}`, color: STATUS_COLORS[status] }}>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
            {taskDue && <span style={{ fontSize: 9, color: theme.textDim }}>{fmtDate(taskDue)}</span>}
            <button onClick={() => setShowComments(!showComments)} className="border-none bg-transparent cursor-pointer p-0 flex items-center gap-0.5"
              style={{ color: comments.length > 0 ? theme.accent : theme.textDim }}>
              <MessageSquare size={9} />{comments.length > 0 && <span style={{ fontSize: 8 }}>{comments.length}</span>}
            </button>
            <button onClick={() => onEdit(item)} className="border-none bg-transparent cursor-pointer p-0" style={{ color: theme.textDim }}><Edit3 size={9} /></button>
            <button onClick={() => onDelete(sectionId, item.id)} className="border-none bg-transparent cursor-pointer p-0" style={{ color: "#ef4444" }}><Trash2 size={9} /></button>
          </div>
        </div>
      </div>

      {/* Comments thread */}
      {showComments && (
        <div className="px-10 pb-2">
          {comments.length > 0 && (
            <div className="space-y-1 mb-2">
              {comments.map((c, i) => (
                <div key={i} className="flex items-start gap-2 py-1" style={{ borderBottom: i < comments.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                  <span className="font-bold shrink-0" style={{ fontSize: 9, color: theme.accent }}>{c.author}</span>
                  <span className="flex-1" style={{ fontSize: 10, color: theme.text, lineHeight: 1.4 }}>{c.text}</span>
                  <span style={{ fontSize: 8, color: theme.textDim, shrink: 0 }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              ))}
            </div>
          )}
          {save && (
            <div className="flex gap-1.5">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..."
                className="flex-1 px-2 py-1 text-[10px] rounded-lg outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                onKeyDown={(e) => e.key === "Enter" && addComment()} />
              <button onClick={addComment} className="px-2 py-1 rounded-lg border-none cursor-pointer" style={{ background: theme.accent, color: "#fff" }}><Send size={10} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
