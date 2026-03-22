import { useState } from "react";
import { Search, ChevronDown, ChevronRight, Plus, Trash2, Check, Sparkles, Loader2, X, Pencil, Save, Bookmark } from "lucide-react";
import ItemRow from "./ItemRow";
import { ProgressBar, Badge } from "./Shared";
import { getOwners, getOwnerColors, PRIORITY_COLORS } from "../helpers";
import { useTheme } from "../ThemeContext";

const fmtDate = (d) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return d; } };
const daysUntil = (d) => Math.ceil((new Date(d + "T23:59:59") - new Date()) / 86400000);
const uid = () => "t" + Date.now() + Math.random().toString(36).slice(2, 6);

export default function TaskList({ d, save, secStats, sectionRefs, opened, setOpened, selected, setSelected, toggleCheck, setItemStatus, getStatus, editHandlers }) {
  const { theme } = useTheme();
  const owners = getOwners(d);
  const ownerColors = getOwnerColors(d);

  const [filterOwner, setFilterOwner] = useState("All");
  const [filterPrio, setFilterPrio] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [addingTo, setAddingTo] = useState(null);
  const [newTask, setNewTask] = useState({ text: "", owner: owners[0] || "You", p: "HIGH" });
  const [editingSec, setEditingSec] = useState(null);
  const [editSecName, setEditSecName] = useState("");
  const [editSecDue, setEditSecDue] = useState("");
  const [dupeLoading, setDupeLoading] = useState(false);
  const [dupeGroups, setDupeGroups] = useState(null);
  const [savedFilters, setSavedFilters] = useState(() => {
    try { const r = localStorage.getItem("summit-filters"); return r ? JSON.parse(r) : []; } catch { return []; }
  });

  const allItems = [];
  d.sections.forEach(s => s.items.forEach(it => allItems.push({ ...it, sectionId: s.id, sectionTitle: s.title })));

  const filterItems = (items) => items.filter(i =>
    (filterOwner === "All" || i.owner === filterOwner) &&
    (filterPrio === "All" || i.p === filterPrio) &&
    (filterStatus === "All" || getStatus(i.id) === filterStatus) &&
    (!searchQ || i.text.toLowerCase().includes(searchQ.toLowerCase()))
  );

  const toggleSelect = (id) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n); };
  const selectAllInSec = (sid) => { const sec = d.sections.find(s => s.id === sid); if (!sec) return; const n = new Set(selected); const all = sec.items.every(i => n.has(i.id)); sec.items.forEach(i => all ? n.delete(i.id) : n.add(i.id)); setSelected(n); };
  const deleteItem = (sid, iid) => save({ ...d, sections: d.sections.map(s => s.id === sid ? { ...s, items: s.items.filter(i => i.id !== iid) } : s) });
  const reassignSection = (sid, owner) => save({ ...d, sections: d.sections.map(s => s.id === sid ? { ...s, items: s.items.map(i => ({ ...i, owner })) } : s) });
  const deleteSection = (sid) => save({ ...d, sections: d.sections.filter(s => s.id !== sid) });
  const bulkDelete = () => { if (!selected.size) return; save({ ...d, sections: d.sections.map(s => ({ ...s, items: s.items.filter(i => !selected.has(i.id)) })) }); setSelected(new Set()); };
  const bulkAssign = (owner) => { if (!selected.size) return; save({ ...d, sections: d.sections.map(s => ({ ...s, items: s.items.map(i => selected.has(i.id) ? { ...i, owner } : i) })) }); setSelected(new Set()); };
  const addTaskToSec = (sid) => { if (!newTask.text.trim()) return; save({ ...d, sections: d.sections.map(s => s.id === sid ? { ...s, items: [...s.items, { id: uid(), text: newTask.text, owner: newTask.owner, p: newTask.p }] } : s) }); setNewTask({ text: "", owner: owners[0] || "You", p: "HIGH" }); setAddingTo(null); };

  // Section editing
  const startEditSec = (sec) => { setEditingSec(sec.id); setEditSecName(sec.title); setEditSecDue(sec.due); };
  const saveEditSec = () => { if (!editingSec || !editSecName.trim()) { setEditingSec(null); return; } save({ ...d, sections: d.sections.map(s => s.id === editingSec ? { ...s, title: editSecName.trim(), due: editSecDue } : s) }); setEditingSec(null); };

  // Move section up/down
  const moveSection = (sid, dir) => {
    const idx = d.sections.findIndex(s => s.id === sid);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= d.sections.length) return;
    const secs = [...d.sections];
    [secs[idx], secs[newIdx]] = [secs[newIdx], secs[idx]];
    save({ ...d, sections: secs });
  };

  // Saved filters
  const saveCurrentFilter = () => {
    const name = prompt("Filter name:");
    if (!name) return;
    const f = { name, owner: filterOwner, prio: filterPrio, status: filterStatus, search: searchQ };
    const updated = [...savedFilters, f];
    setSavedFilters(updated);
    try { localStorage.setItem("summit-filters", JSON.stringify(updated)); } catch {}
  };
  const applyFilter = (f) => { setFilterOwner(f.owner); setFilterPrio(f.prio); setFilterStatus(f.status); setSearchQ(f.search || ""); };
  const removeFilter = (i) => { const updated = savedFilters.filter((_, idx) => idx !== i); setSavedFilters(updated); try { localStorage.setItem("summit-filters", JSON.stringify(updated)); } catch {} };

  // Duplicates
  const findDuplicates = async () => {
    setDupeLoading(true); setDupeGroups(null);
    try {
      const res = await fetch("/api/ai-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "duplicates", data: { tasks: allItems.slice(0, 100) } }) });
      const json = await res.json();
      if (json.result?.groups) setDupeGroups(json.result.groups);
    } catch (e) { console.error(e); }
    setDupeLoading(false);
  };
  const applyAllDupeSuggestions = () => { if (!dupeGroups?.length) return; const rm = new Set(); dupeGroups.forEach(g => g.indices.slice(1).forEach(idx => { const t = allItems[idx]; if (t) rm.add(t.id); })); save({ ...d, sections: d.sections.map(s => ({ ...s, items: s.items.filter(i => !rm.has(i.id)) })) }); setDupeGroups(null); };
  const removeAllInGroup = (gi) => { const g = dupeGroups[gi]; const rm = new Set(); g.indices.slice(1).forEach(idx => { const t = allItems[idx]; if (t) rm.add(t.id); }); save({ ...d, sections: d.sections.map(s => ({ ...s, items: s.items.filter(i => !rm.has(i.id)) })) }); setDupeGroups(prev => prev?.filter((_, i) => i !== gi)); };

  const inputStyle = { background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.text };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <div className="flex-1 min-w-[120px] relative">
          <Search size={12} className="absolute left-2.5 top-2.5" style={{ color: theme.textDim }} />
          <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search tasks..." className="w-full pl-7 pr-2 py-2 text-xs rounded-lg outline-none box-border" style={inputStyle} />
        </div>
        {[{ v: filterOwner, f: setFilterOwner, o: ["All", ...owners], l: "Owner" }, { v: filterPrio, f: setFilterPrio, o: ["All", "CRITICAL", "HIGH", "MEDIUM"], l: "Priority" }, { v: filterStatus, f: setFilterStatus, o: ["All", "Not Started", "In Progress", "Done"], l: "Status" }].map(x => (
          <select key={x.l} value={x.v} onChange={(e) => x.f(e.target.value)} className="py-2 px-2 text-xs rounded-lg outline-none cursor-pointer" style={inputStyle}>
            {x.o.map(o => <option key={o} value={o}>{x.l}: {o}</option>)}
          </select>
        ))}
        <button onClick={() => setOpened(d.sections.reduce((a, s) => ({ ...a, [s.id]: true }), {}))} className="px-2 py-2 rounded-lg border cursor-pointer text-xs" style={{ background: "transparent", borderColor: theme.border, color: theme.textDim }} title="Expand all">+</button>
        <button onClick={() => setOpened({})} className="px-2 py-2 rounded-lg border cursor-pointer text-xs" style={{ background: "transparent", borderColor: theme.border, color: theme.textDim }} title="Collapse all">−</button>
        <button onClick={findDuplicates} disabled={dupeLoading} className="flex items-center gap-1 px-2.5 py-2 rounded-lg border cursor-pointer text-xs font-semibold" style={{ background: theme.accentBg, borderColor: theme.accent + "30", color: theme.accent, opacity: dupeLoading ? 0.5 : 1 }}>
          {dupeLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Duplicates
        </button>
        <button onClick={saveCurrentFilter} className="flex items-center gap-1 px-2 py-2 rounded-lg border cursor-pointer text-xs" style={{ background: "transparent", borderColor: theme.border, color: theme.textDim }} title="Save current filter">
          <Bookmark size={11} />
        </button>
      </div>

      {/* Saved filters */}
      {savedFilters.length > 0 && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {savedFilters.map((f, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer" style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, fontSize: 10 }}>
              <span onClick={() => applyFilter(f)} style={{ color: theme.accent, fontWeight: 600 }}>{f.name}</span>
              <button onClick={() => removeFilter(i)} className="bg-transparent border-none cursor-pointer p-0"><X size={9} style={{ color: theme.textDim }} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex gap-1.5 mb-3 p-2.5 rounded-lg items-center flex-wrap" style={{ background: theme.accentBg, border: `1px solid ${theme.accent}40` }}>
          <span className="font-bold" style={{ fontSize: 11, color: theme.accent }}>{selected.size} selected</span>
          <button onClick={bulkDelete} className="px-2.5 py-1 rounded-md bg-red-500 text-white border-none text-[10px] cursor-pointer font-semibold">Delete</button>
          {owners.map(o => <button key={o} onClick={() => bulkAssign(o)} className="px-2.5 py-1 rounded-md border-none text-black text-[10px] cursor-pointer font-bold" style={{ background: ownerColors[o] }}>{o}</button>)}
          <button onClick={() => setSelected(new Set())} className="px-2 py-1 rounded-md border-none text-[10px] cursor-pointer" style={{ background: theme.bgCard, color: theme.textMuted }}>Clear</button>
        </div>
      )}

      {/* Duplicate results */}
      {dupeGroups && (
        <div className="mb-3 p-3 rounded-xl" style={{ background: theme.accentBg, border: `1px solid ${theme.accent}30` }}>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="font-bold" style={{ fontSize: 12, color: theme.accent }}>{dupeGroups.length > 0 ? `Found ${dupeGroups.length} duplicate group${dupeGroups.length !== 1 ? "s" : ""}` : "No duplicates found!"}</span>
            <div className="flex items-center gap-2">
              {dupeGroups.length > 0 && <button onClick={applyAllDupeSuggestions} className="px-3 py-1.5 rounded-lg border-none text-xs font-bold cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>Apply All</button>}
              <button onClick={() => setDupeGroups(null)} className="bg-transparent border-none cursor-pointer" style={{ color: theme.textDim }}><X size={14} /></button>
            </div>
          </div>
          {dupeGroups.map((group, gi) => (
            <div key={gi} className="mb-2 p-2.5 rounded-lg" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ fontSize: 10, color: theme.textMuted }}>{group.reason}</span>
                <button onClick={() => removeAllInGroup(gi)} className="px-2 py-0.5 rounded text-[9px] font-bold border-none cursor-pointer" style={{ background: "#ef444420", color: "#ef4444" }}>Keep first, remove rest</button>
              </div>
              {group.indices.map(idx => { const task = allItems[idx]; return task ? <div key={idx} className="flex items-center gap-2 py-1" style={{ fontSize: 11 }}><span className="flex-1" style={{ color: theme.text }}>{task.text}</span><span style={{ fontSize: 9, color: theme.textDim }}>{task.sectionTitle}</span></div> : null; })}
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {d.sections.map((sec, secIdx) => {
        const isOpen = opened[sec.id]; const st = secStats(sec); const du = daysUntil(sec.due); const fl = filterItems(sec.items);
        const isEditing = editingSec === sec.id;
        return (
          <div key={sec.id} ref={(el) => { sectionRefs.current[sec.id] = el; }} className="mb-2 rounded-xl overflow-hidden" style={{ border: sec.title === "Final Validation" ? "2px solid #ef4444" : `1px solid ${theme.border}`, background: theme.bgCard }}>
            {/* Section header */}
            <div className="px-3 py-2.5 flex items-center gap-2 cursor-pointer" onClick={() => !isEditing && setOpened(prev => ({ ...prev, [sec.id]: !prev[sec.id] }))}>
              {isOpen ? <ChevronDown size={14} style={{ color: theme.textDim }} /> : <ChevronRight size={14} style={{ color: theme.textDim }} />}
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                    <input value={editSecName} onChange={(e) => setEditSecName(e.target.value)} className="flex-1 px-2 py-1 text-xs rounded-lg outline-none font-bold" style={{ background: theme.bg, border: `1px solid ${theme.accent}`, color: theme.text }} autoFocus onKeyDown={(e) => e.key === "Enter" && saveEditSec()} />
                    <input type="date" value={editSecDue} onChange={(e) => setEditSecDue(e.target.value)} className="px-2 py-1 text-xs rounded-lg outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
                    <button onClick={saveEditSec} className="p-1 bg-transparent border-none cursor-pointer"><Check size={14} style={{ color: "#22c55e" }} /></button>
                    <button onClick={() => setEditingSec(null)} className="p-1 bg-transparent border-none cursor-pointer"><X size={14} style={{ color: "#ef4444" }} /></button>
                  </div>
                ) : (
                  <>
                    <div className="font-bold" style={{ fontSize: 12.5, color: theme.text }}>{sec.title}</div>
                    <div className="flex gap-2 mt-0.5 items-center">
                      <span style={{ fontSize: 10, color: theme.textDim }}>{st.done}/{st.total}</span>
                      <div style={{ width: 48 }}><ProgressBar value={st.pct} height={3} /></div>
                      <span style={{ fontSize: 10, color: du <= 0 ? "#ef4444" : du <= 2 ? "#f59e0b" : theme.textDim }}>Due {fmtDate(sec.due)}</span>
                    </div>
                  </>
                )}
              </div>
              {!isEditing && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => startEditSec(sec)} className="p-1 bg-transparent border-none cursor-pointer" title="Edit section"><Pencil size={10} style={{ color: theme.textDim }} /></button>
                  <button onClick={() => moveSection(sec.id, -1)} className="bg-transparent border-none cursor-pointer text-[10px]" style={{ color: theme.textDim }} disabled={secIdx === 0}>↑</button>
                  <button onClick={() => moveSection(sec.id, 1)} className="bg-transparent border-none cursor-pointer text-[10px]" style={{ color: theme.textDim }} disabled={secIdx === d.sections.length - 1}>↓</button>
                  <select onChange={(e) => { if (e.target.value) reassignSection(sec.id, e.target.value); e.target.selectedIndex = 0; }} defaultValue="" className="p-0.5 rounded outline-none cursor-pointer" style={{ fontSize: 9, background: "transparent", border: `1px solid ${theme.border}`, color: theme.textDim }}>
                    <option value="" disabled>Assign</option>
                    {owners.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <button onClick={() => selectAllInSec(sec.id)} className="bg-transparent border-none cursor-pointer" style={{ fontSize: 9, color: theme.accent }}>Sel</button>
                  <button onClick={() => deleteSection(sec.id)} className="bg-transparent border-none cursor-pointer"><Trash2 size={10} color="#ef4444" /></button>
                </div>
              )}
              {!isEditing && <span className="font-extrabold" style={{ fontSize: 14, color: st.pct === 100 ? "#22c55e" : theme.textDim }}>{st.pct}%</span>}
            </div>

            {/* Items */}
            {isOpen && (
              <div>
                {fl.length === 0 && <div className="py-3 text-center" style={{ fontSize: 11, color: theme.textDim }}>No items match filters</div>}
                {fl.map(it => (
                  <ItemRow key={it.id} item={{ ...it, sectionDue: sec.due }} sectionId={sec.id} d={d} checks={d.checks} notes={d.notes} statuses={d.statuses} selected={selected} toggleSelect={toggleSelect} toggleCheck={toggleCheck} setItemStatus={setItemStatus} getStatus={getStatus}
                    onNote={() => {}} onEdit={(item) => editHandlers.start(item)} onDelete={deleteItem} save={save} />
                ))}
                {addingTo === sec.id ? (
                  <div className="p-2 flex gap-1.5 flex-wrap" style={{ borderTop: `1px solid ${theme.border}` }}>
                    <input value={newTask.text} onChange={(e) => setNewTask({ ...newTask, text: e.target.value })} placeholder="New task..." className="flex-1 min-w-[120px] px-2 py-1.5 text-xs rounded-lg outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} autoFocus onKeyDown={(e) => e.key === "Enter" && addTaskToSec(sec.id)} />
                    <select value={newTask.owner} onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })} className="px-1.5 py-1 text-xs rounded-lg outline-none cursor-pointer" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
                      {owners.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <button onClick={() => addTaskToSec(sec.id)} className="px-3 py-1 rounded-lg text-xs font-bold border-none cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>Add</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingTo(sec.id)} className="w-full flex items-center justify-center gap-1 py-2 border-none cursor-pointer" style={{ background: "transparent", color: theme.textDim, fontSize: 11, borderTop: `1px solid ${theme.border}` }}>
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
