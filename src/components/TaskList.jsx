import { useState } from "react";
import {
  Search, ChevronDown, ChevronRight, Plus, Trash2, Check
} from "lucide-react";
import ItemRow from "./ItemRow";
import { ProgressBar, Badge } from "./Shared";
import { OWNERS, OWNER_COLORS } from "../data";
import { useTheme } from "../ThemeContext";

const fmtDate = (d) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return d; }
};
const daysUntil = (d) => Math.ceil((new Date(d + "T23:59:59") - new Date()) / 86400000);
const uid = () => "t" + Date.now() + Math.random().toString(36).slice(2, 6);

export default function TaskList({
  d, save, secStats, sectionRefs,
  opened, setOpened,
  selected, setSelected,
  toggleCheck, setItemStatus, getStatus,
  noteHandlers, editHandlers,
}) {
  const { theme } = useTheme();
  const [filterOwner, setFilterOwner] = useState("All");
  const [filterPrio, setFilterPrio] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [addingTo, setAddingTo] = useState(null);
  const [newTask, setNewTask] = useState({ text: "", owner: "Chase", p: "HIGH" });
  const [noteId, setNoteId] = useState(null);
  const [noteVal, setNoteVal] = useState("");

  const ist = `rounded border bg-transparent outline-none`;

  const filterItems = (items) => items.filter((i) =>
    (filterOwner === "All" || i.owner === filterOwner) &&
    (filterPrio === "All" || i.p === filterPrio) &&
    (filterStatus === "All" || getStatus(i.id) === filterStatus) &&
    (!searchQ || i.text.toLowerCase().includes(searchQ.toLowerCase()))
  );

  const toggleSelect = (id) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };

  const selectAllInSec = (sid) => {
    const sec = d.sections.find((s) => s.id === sid);
    if (!sec) return;
    const n = new Set(selected);
    const allSel = sec.items.every((i) => n.has(i.id));
    sec.items.forEach((i) => allSel ? n.delete(i.id) : n.add(i.id));
    setSelected(n);
  };

  const deleteItem = (sid, iid) => save({ ...d, sections: d.sections.map((s) => s.id === sid ? { ...s, items: s.items.filter((i) => i.id !== iid) } : s) });
  const reassignSection = (sid, owner) => save({ ...d, sections: d.sections.map((s) => s.id === sid ? { ...s, items: s.items.map((i) => ({ ...i, owner })) } : s) });
  const deleteSection = (sid) => save({ ...d, sections: d.sections.filter((s) => s.id !== sid) });
  const bulkDelete = () => { if (!selected.size) return; save({ ...d, sections: d.sections.map((s) => ({ ...s, items: s.items.filter((i) => !selected.has(i.id)) })) }); setSelected(new Set()); };
  const bulkAssign = (owner) => { if (!selected.size) return; save({ ...d, sections: d.sections.map((s) => ({ ...s, items: s.items.map((i) => selected.has(i.id) ? { ...i, owner } : i) })) }); setSelected(new Set()); };

  const addTaskToSec = (sid) => {
    if (!newTask.text.trim()) return;
    save({ ...d, sections: d.sections.map((s) => s.id === sid ? { ...s, items: [...s.items, { id: uid(), text: newTask.text, owner: newTask.owner, p: newTask.p }] } : s) });
    setNewTask({ text: "", owner: "Chase", p: "HIGH" });
    setAddingTo(null);
  };

  const saveNote = (id) => {
    save({ ...d, notes: { ...d.notes, [id]: noteVal } });
    setNoteId(null);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <div className="flex-1 min-w-[120px] relative">
          <Search size={12} className="absolute left-2.5 top-2.5" style={{ color: theme.textDim }} />
          <input
            value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-7 pr-2 py-2 text-xs rounded-lg outline-none box-border"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.text }}
          />
        </div>
        {[
          { v: filterOwner, f: setFilterOwner, o: ["All", ...OWNERS], l: "Owner" },
          { v: filterPrio, f: setFilterPrio, o: ["All", "CRITICAL", "HIGH", "MEDIUM"], l: "Priority" },
          { v: filterStatus, f: setFilterStatus, o: ["All", "Not Started", "In Progress", "Done"], l: "Status" },
        ].map((x) => (
          <select
            key={x.l} value={x.v} onChange={(e) => x.f(e.target.value)}
            className="py-2 px-2 text-xs rounded-lg outline-none cursor-pointer"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textMuted }}
          >
            {x.o.map((o) => <option key={o} value={o}>{x.l}: {o}</option>)}
          </select>
        ))}
        <button
          onClick={() => setOpened(d.sections.reduce((a, s) => ({ ...a, [s.id]: true }), {}))}
          className="px-2 py-2 rounded-lg border cursor-pointer text-xs"
          style={{ background: "transparent", borderColor: theme.border, color: theme.textDim }}
          title="Expand all"
        >+</button>
        <button
          onClick={() => setOpened({})}
          className="px-2 py-2 rounded-lg border cursor-pointer text-xs"
          style={{ background: "transparent", borderColor: theme.border, color: theme.textDim }}
          title="Collapse all"
        >−</button>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div
          className="flex gap-1.5 mb-3 p-2.5 rounded-lg items-center flex-wrap"
          style={{ background: theme.accentBg, border: `1px solid ${theme.accent}40` }}
        >
          <span className="font-bold" style={{ fontSize: 11, color: theme.accent }}>{selected.size} selected</span>
          <button onClick={bulkDelete} className="px-2.5 py-1 rounded-md bg-red-500 text-white border-none text-[10px] cursor-pointer font-semibold">Delete</button>
          {OWNERS.map((o) => (
            <button key={o} onClick={() => bulkAssign(o)} className="px-2.5 py-1 rounded-md border-none text-black text-[10px] cursor-pointer font-bold" style={{ background: OWNER_COLORS[o] }}>
              {o}
            </button>
          ))}
          <button onClick={() => setSelected(new Set())} className="px-2 py-1 rounded-md border-none text-[10px] cursor-pointer" style={{ background: theme.bgCard, color: theme.textMuted }}>
            Clear
          </button>
        </div>
      )}

      {/* Sections */}
      {d.sections.map((sec) => {
        const isOpen = opened[sec.id];
        const st = secStats(sec);
        const du = daysUntil(sec.due);
        const fl = filterItems(sec.items);
        return (
          <div
            key={sec.id}
            ref={(el) => { sectionRefs.current[sec.id] = el; }}
            className="mb-2 rounded-xl overflow-hidden"
            style={{
              border: sec.title === "Final Validation" ? "2px solid #ef4444" : `1px solid ${theme.border}`,
              background: theme.bgCard,
            }}
          >
            {/* Section header */}
            <div
              onClick={() => setOpened((prev) => ({ ...prev, [sec.id]: !prev[sec.id] }))}
              className="px-3 py-2.5 flex items-center gap-2.5 cursor-pointer"
            >
              {isOpen
                ? <ChevronDown size={14} style={{ color: theme.textDim }} />
                : <ChevronRight size={14} style={{ color: theme.textDim }} />
              }
              <div className="flex-1">
                <div className="font-bold" style={{ fontSize: 12.5, color: theme.text }}>{sec.title}</div>
                <div className="flex gap-2 mt-0.5 items-center">
                  <span style={{ fontSize: 10, color: theme.textDim }}>{st.done}/{st.total}</span>
                  <div style={{ width: 48 }}><ProgressBar value={st.pct} height={3} /></div>
                  <span style={{ fontSize: 10, color: du <= 0 ? "#ef4444" : du <= 2 ? "#f59e0b" : theme.textDim }}>
                    Due {fmtDate(sec.due)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                <select
                  onChange={(e) => { if (e.target.value) reassignSection(sec.id, e.target.value); e.target.selectedIndex = 0; }}
                  defaultValue=""
                  className="p-0.5 rounded outline-none cursor-pointer"
                  style={{ fontSize: 9, background: "transparent", border: `1px solid ${theme.border}`, color: theme.textDim }}
                >
                  <option value="" disabled>Assign</option>
                  {OWNERS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <button onClick={(e) => { e.stopPropagation(); selectAllInSec(sec.id); }} className="bg-transparent border-none cursor-pointer" style={{ fontSize: 9, color: theme.accent }}>Sel</button>
                <button onClick={(e) => { e.stopPropagation(); deleteSection(sec.id); }} className="bg-transparent border-none cursor-pointer"><Trash2 size={10} color="#ef4444" /></button>
              </div>
              <span className="font-extrabold" style={{ fontSize: 14, color: st.pct === 100 ? "#22c55e" : theme.textDim }}>
                {st.pct}%
              </span>
            </div>

            {/* Items */}
            {isOpen && (
              <div>
                {fl.length === 0 && (
                  <div className="py-3 text-center" style={{ fontSize: 11, color: theme.textDim }}>No items match filters</div>
                )}
                {fl.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    sectionId={sec.id}
                    checks={d.checks}
                    notes={d.notes}
                    statuses={d.statuses}
                    selected={selected}
                    toggleSelect={toggleSelect}
                    toggleCheck={toggleCheck}
                    setItemStatus={setItemStatus}
                    getStatus={getStatus}
                    onNote={(id) => { setNoteId(id); setNoteVal(d.notes[id] || ""); }}
                    onEdit={(item) => editHandlers.start(item)}
                    onDelete={deleteItem}
                  />
                ))}

                {/* Inline note editor */}
                {noteId && fl.some(i => i.id === noteId) && (
                  <div className="px-3 py-2 flex gap-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                    <input
                      value={noteVal} onChange={(e) => setNoteVal(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
                      style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                      placeholder="Add a note..."
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && saveNote(noteId)}
                    />
                    <button onClick={() => saveNote(noteId)} className="px-3 py-1 rounded text-xs font-bold border-none cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>
                      Save
                    </button>
                    <button onClick={() => setNoteId(null)} className="px-2 py-1 rounded text-xs border-none cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted }}>
                      ✕
                    </button>
                  </div>
                )}

                {/* Add task */}
                {addingTo === sec.id ? (
                  <div className="p-2 flex gap-1.5 flex-wrap" style={{ borderTop: `1px solid ${theme.border}` }}>
                    <input
                      value={newTask.text} onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                      placeholder="New task..."
                      className="flex-1 min-w-[120px] px-2 py-1.5 text-xs rounded-lg outline-none"
                      style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && addTaskToSec(sec.id)}
                    />
                    <select
                      value={newTask.owner} onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })}
                      className="px-1.5 py-1 text-xs rounded-lg outline-none cursor-pointer"
                      style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMuted }}
                    >
                      {OWNERS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <button onClick={() => addTaskToSec(sec.id)} className="px-3 py-1 rounded-lg text-xs font-bold border-none cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo(sec.id)}
                    className="w-full flex items-center justify-center gap-1 py-2 border-none cursor-pointer"
                    style={{ background: "transparent", color: theme.textDim, fontSize: 11, borderTop: `1px solid ${theme.border}` }}
                  >
                    <Plus size={12} /> Add task
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
