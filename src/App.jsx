import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Check, ChevronDown, ChevronRight, Plus, Search, Clipboard,
  Trash2, Edit3, Upload, FolderPlus, Settings, MessageSquare,
  Target, LayoutGrid, TrendingDown, BarChart3, Loader2, FileText, Sparkles
} from "lucide-react";
import { DEFAULT_SECTIONS, OWNERS, OWNER_COLORS, PRIORITY_COLORS, STATUS_COLORS } from "./data";
import { useStore } from "./useStore";
import { extractText, aiParseTasks } from "./docParser";

// ── Helpers ──────────────────────────────────────────
const uid = () => "t" + Date.now() + Math.random().toString(36).slice(2, 6);
const daysUntil = (d) => Math.ceil((new Date(d + "T23:59:59") - new Date()) / 86400000);
const fmtDate = (d) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return d; }
};

function ProgressBar({ value, height = 6 }) {
  const color = value === 100 ? "#22c55e" : value > 60 ? "#06b6d4" : "#f59e0b";
  return (
    <div style={{ width: "100%", height, background: "#1e293b", borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: height / 2, transition: "width 0.4s" }} />
    </div>
  );
}

function Badge({ text, color }) {
  return <span className="inline-block px-1.5 rounded text-[10px] font-bold text-white" style={{ background: color }}>{text}</span>;
}

// ── Main App ─────────────────────────────────────────
export default function App() {
  const store = useStore();
  const [view, setView] = useState("dash");
  const [opened, setOpened] = useState({});
  const [filterOwner, setFilterOwner] = useState("All");
  const [filterPrio, setFilterPrio] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [noteId, setNoteId] = useState(null);
  const [noteVal, setNoteVal] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editPrio, setEditPrio] = useState("");
  const [addingTo, setAddingTo] = useState(null);
  const [newTask, setNewTask] = useState({ text: "", owner: "Chase", p: "HIGH" });
  const [focusPerson, setFocusPerson] = useState("All");
  const [selected, setSelected] = useState(new Set());
  const [showImport, setShowImport] = useState(false);
  const [showNewProj, setShowNewProj] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [showMgr, setShowMgr] = useState(false);
  const [importTasks, setImportTasks] = useState(null);
  const [importSec, setImportSec] = useState("");
  const [importOwner, setImportOwner] = useState("Chase");
  const [aiParsing, setAiParsing] = useState(false);
  const [importMode, setImportMode] = useState("manual"); // "manual" or "ai"
  const [importError, setImportError] = useState(null);
  const [newSecName, setNewSecName] = useState("");
  const [newSecDue, setNewSecDue] = useState("2026-03-28");
  const [scrollTarget, setScrollTarget] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [aiUsage, setAiUsage] = useState(null);
  const fileRef = useRef(null);
  const sectionRefs = useRef({});

  // ── Init ──
  useEffect(() => {
    if (!store.projects) {
      const id = uid();
      const projects = [{ id, name: "Pre-Sales Checklist" }];
      const data = { sections: DEFAULT_SECTIONS, checks: {}, notes: {}, statuses: {}, log: [] };
      store.setProjects(projects);
      store.setActiveId(id);
      store.saveData(data, id);
    } else if (store.projects.length && !store.data) {
      store.loadProject(store.projects[0].id);
    }
  }, []);

  // ── Scroll to section when navigating from dashboard ──
  useEffect(() => {
    if (scrollTarget && view === "list" && sectionRefs.current[scrollTarget]) {
      setTimeout(() => {
        sectionRefs.current[scrollTarget]?.scrollIntoView({ behavior: "smooth", block: "start" });
        setScrollTarget(null);
      }, 100);
    }
  }, [scrollTarget, view, opened]);

  const d = store.data;
  if (!d) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white font-sans">
        <div className="text-center">
          <div className="text-2xl font-extrabold">SUMMIT</div>
          <div className="text-slate-400 mt-1">Loading...</div>
        </div>
      </div>
    );
  }

  const save = (nd) => store.saveData(nd);

  // ── Computed ──
  const allItems = [];
  d.sections.forEach((s) => s.items.forEach((it) => allItems.push({ ...it, sectionId: s.id, sectionTitle: s.title, due: s.due })));
  const total = allItems.length;
  const doneCount = allItems.filter((i) => d.checks[i.id]).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const getStatus = (id) => d.checks[id] ? "Done" : (d.statuses?.[id] || "Not Started");

  const secStats = (s) => {
    const done = s.items.filter((i) => d.checks[i.id]).length;
    return { total: s.items.length, done, pct: s.items.length ? Math.round((done / s.items.length) * 100) : 0 };
  };

  const filterItems = (items) => items.filter((i) =>
    (filterOwner === "All" || i.owner === filterOwner) &&
    (filterPrio === "All" || i.p === filterPrio) &&
    (filterStatus === "All" || getStatus(i.id) === filterStatus) &&
    (!searchQ || i.text.toLowerCase().includes(searchQ.toLowerCase()))
  );

  // ── Actions ──
  const toggleCheck = (id) => {
    const nc = { ...d.checks, [id]: !d.checks[id] };
    const lg = [...(d.log || [])];
    if (!d.checks[id]) lg.push({ id, ts: Date.now() });
    save({ ...d, checks: nc, log: lg });
  };

  const setItemStatus = (id, val) => {
    const ns = { ...d.statuses, [id]: val };
    const nc = { ...d.checks };
    if (val === "Done") {
      nc[id] = true;
      save({ ...d, checks: nc, statuses: ns, log: [...(d.log || []), { id, ts: Date.now() }] });
    } else {
      if (val === "Not Started") nc[id] = false;
      save({ ...d, checks: nc, statuses: ns });
    }
  };

  const saveNote = (id) => { save({ ...d, notes: { ...d.notes, [id]: noteVal } }); setNoteId(null); };
  const addTaskToSec = (sid) => {
    if (!newTask.text.trim()) return;
    save({ ...d, sections: d.sections.map((s) => s.id === sid ? { ...s, items: [...s.items, { id: uid(), text: newTask.text, owner: newTask.owner, p: newTask.p }] } : s) });
    setNewTask({ text: "", owner: "Chase", p: "HIGH" }); setAddingTo(null);
  };
  const deleteItem = (sid, iid) => save({ ...d, sections: d.sections.map((s) => s.id === sid ? { ...s, items: s.items.filter((i) => i.id !== iid) } : s) });
  const saveEdit = () => {
    if (!editId) return;
    save({ ...d, sections: d.sections.map((s) => ({ ...s, items: s.items.map((i) => i.id === editId ? { ...i, text: editText, owner: editOwner, p: editPrio } : i) })) });
    setEditId(null);
  };
  const bulkDelete = () => { if (!selected.size) return; save({ ...d, sections: d.sections.map((s) => ({ ...s, items: s.items.filter((i) => !selected.has(i.id)) })) }); setSelected(new Set()); };
  const bulkAssign = (owner) => { if (!selected.size) return; save({ ...d, sections: d.sections.map((s) => ({ ...s, items: s.items.map((i) => selected.has(i.id) ? { ...i, owner } : i) })) }); setSelected(new Set()); };
  const reassignSection = (sid, owner) => save({ ...d, sections: d.sections.map((s) => s.id === sid ? { ...s, items: s.items.map((i) => ({ ...i, owner })) } : s) });
  const addSection = () => { if (!newSecName.trim()) return; save({ ...d, sections: [...d.sections, { id: uid(), title: newSecName.trim(), due: newSecDue, items: [] }] }); setNewSecName(""); };
  const deleteSection = (sid) => save({ ...d, sections: d.sections.filter((s) => s.id !== sid) });
  const toggleSelect = (id) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n); };
  const selectAllInSec = (sid) => {
    const sec = d.sections.find((s) => s.id === sid);
    if (!sec) return;
    const n = new Set(selected);
    const allSel = sec.items.every((i) => n.has(i.id));
    sec.items.forEach((i) => allSel ? n.delete(i.id) : n.add(i.id));
    setSelected(n);
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImportError(null);
    setImportMode("manual");
    try {
      const result = await extractText(f);
      // Create editable task objects from each line
      const tasks = result.lines.map((line, i) => ({
        _id: i, text: line, owner: "Chase", p: "HIGH", section: "", include: true
      }));
      setImportTasks(tasks);
      setShowImport(true);
    } catch(e) {
      setImportError("Could not read file: " + e.message);
      setImportTasks([]);
      setShowImport(true);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAiParse = async () => {
    if (!importTasks || importTasks.length === 0) return;
    setAiParsing(true);
    setImportError(null);
    setAiUsage(null);
    try {
      const rawText = importTasks.map((t) => t.text).join("\n");
      // Build project context from stored data
      const projectContext = {
        goal: d.context?.goal || "complete project checklist",
        description: d.context?.description || "",
        priorityStrategy: d.context?.priorityStrategy || "",
        team: d.context?.team || OWNERS.map(o => ({ name: o, role: o === "You" ? "Owner/Strategy" : o === "Spencer" ? "Builder/Customizer" : "QA/Onboarding" })),
        deadline: d.context?.deadline || "2026-03-28",
        sections: d.sections.map(s => s.title),
      };
      const result = await aiParseTasks(rawText, projectContext);
      if (result.tasks && result.tasks.length > 0) {
        const tasks = result.tasks.map((t, i) => ({
          _id: i, text: t.text, owner: t.owner || "Chase", p: t.priority || "HIGH",
          section: t.section || "Imported", include: true
        }));
        setImportTasks(tasks);
        setImportMode("ai");
        if (result.usage) setAiUsage(result.usage);
      } else {
        setImportError("AI could not extract any tasks from this document.");
      }
    } catch(e) {
      setImportError("AI parsing failed: " + e.message);
    }
    setAiParsing(false);
  };

  const updateImportTask = (id, field, value) => {
    setImportTasks((prev) => prev.map((t) => t._id === id ? { ...t, [field]: value } : t));
  };

  const removeImportTask = (id) => {
    setImportTasks((prev) => prev.filter((t) => t._id !== id));
  };

  const setAllImportOwner = (owner) => {
    setImportTasks((prev) => prev.map((t) => ({ ...t, owner })));
  };

  const doImport = () => {
    if (!importTasks || importTasks.length === 0) return;
    const tasksToImport = importTasks.filter((t) => t.include && t.text.trim());

    if (importMode === "ai") {
      // Group by section name
      const sectionMap = {};
      tasksToImport.forEach((t) => {
        const secName = t.section || "Imported";
        if (!sectionMap[secName]) sectionMap[secName] = [];
        sectionMap[secName].push({ id: uid(), text: t.text, owner: t.owner, p: t.p });
      });
      let newSections = [...d.sections];
      Object.entries(sectionMap).forEach(([secName, items]) => {
        const existing = newSections.find((s) => s.title.toLowerCase() === secName.toLowerCase());
        if (existing) {
          newSections = newSections.map((s) => s.id === existing.id ? { ...s, items: [...s.items, ...items] } : s);
        } else {
          newSections.push({ id: uid(), title: secName, due: "2026-03-28", items });
        }
      });
      save({ ...d, sections: newSections });
    } else {
      if (!importSec) return;
      const newItems = tasksToImport.map((t) => ({ id: uid(), text: t.text, owner: t.owner, p: t.p }));
      save({ ...d, sections: d.sections.map((s) => s.id === importSec ? { ...s, items: [...s.items, ...newItems] } : s) });
    }
    setShowImport(false); setImportTasks(null); setImportMode("manual");
  };

  const createProject = () => {
    if (!newProjName.trim()) return;
    const id = uid();
    const np = [...store.projects, { id, name: newProjName.trim() }];
    store.setProjects(np);
    const nd = { sections: [], checks: {}, notes: {}, statuses: {}, log: {}, context: {} };
    store.saveData(nd, id);
    store.setActiveId(id);
    store.saveData(nd, id);
    setNewProjName(""); setShowNewProj(false);
    // Open setup questionnaire for new project
    setShowSetup(true);
  };

  const clearProject = () => {
    if (!window.confirm("Clear all tasks and start fresh? This keeps your project context but removes all sections and tasks.")) return;
    save({ ...d, sections: [], checks: {}, notes: {}, statuses: {}, log: [] });
  };

  const deleteProject = (id) => {
    const np = store.projects.filter((p) => p.id !== id);
    store.setProjects(np);
    store.deleteProject(id);
    if (store.activeId === id) {
      if (np.length) store.loadProject(np[0].id);
      else store.saveData(null);
    }
  };

  const goToSection = (secId) => {
    setOpened((prev) => ({ ...prev, [secId]: true }));
    setView("list");
    setScrollTarget(secId);
  };

  // Focus items
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

  // Burndown data
  const burndownData = useMemo(() => {
    const startDate = new Date("2026-03-20");
    const numDays = 8;
    const log = (d.log || []).filter((l) => l.ts);
    const daily = {};
    log.forEach((l) => { const k = new Date(l.ts).toISOString().slice(0, 10); daily[k] = (daily[k] || 0) + 1; });
    const ideal = [];
    const actual = [];
    let cumDone = 0;
    for (let i = 0; i <= numDays; i++) {
      const dt = new Date(startDate);
      dt.setDate(dt.getDate() + i);
      const key = dt.toISOString().slice(0, 10);
      ideal.push({ x: i, y: total - (total / numDays * i) });
      cumDone += (daily[key] || 0);
      if (dt <= new Date()) actual.push({ x: i, y: Math.max(0, total - cumDone) });
    }
    const vel = actual.length > 1 ? (actual[0].y - actual[actual.length - 1].y) / (actual.length - 1) : 0;
    return { ideal, actual, vel, numDays, startDate };
  }, [d.log, total]);

  // ── Item Component ──
  const ItemRow = ({ item, sectionId, compact }) => {
    const ck = d.checks[item.id];
    const isSel = selected.has(item.id);
    return (
      <div className={`flex items-start gap-1.5 border-b border-slate-800 ${compact ? "px-2 py-0.5" : "px-2.5 py-1.5"} ${isSel ? "bg-cyan-500/5" : ""}`} style={{ opacity: ck ? 0.5 : 1 }}>
        <button onClick={() => toggleSelect(item.id)} className="mt-1 flex items-center justify-center shrink-0" style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${isSel ? "#06b6d4" : "#334155"}`, background: isSel ? "#06b6d4" : "transparent" }}>
          {isSel ? <Check size={7} color="#fff" strokeWidth={3} /> : null}
        </button>
        <button onClick={() => toggleCheck(item.id)} className="mt-0.5 flex items-center justify-center shrink-0" style={{ width: 17, height: 17, borderRadius: 4, border: ck ? "none" : "2px solid #475569", background: ck ? "#22c55e" : "transparent" }}>
          {ck ? <Check size={10} color="#fff" strokeWidth={3} /> : null}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`leading-relaxed ${ck ? "line-through text-slate-500" : "text-slate-200"}`} style={{ fontSize: compact ? 10 : 11.5 }}>{item.text}</div>
          <div className="flex gap-1 mt-0.5 items-center flex-wrap">
            <Badge text={item.owner} color={OWNER_COLORS[item.owner] || "#6b7280"} />
            <Badge text={item.p} color={PRIORITY_COLORS[item.p]} />
            <select value={getStatus(item.id)} onChange={(e) => setItemStatus(item.id, e.target.value)} className="text-[8px] px-0.5 rounded bg-transparent font-semibold cursor-pointer outline-none" style={{ border: `1px solid ${STATUS_COLORS[getStatus(item.id)]}`, color: STATUS_COLORS[getStatus(item.id)] }}>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
            <button onClick={() => { setNoteId(item.id); setNoteVal(d.notes[item.id] || ""); }} className="border-none bg-transparent cursor-pointer" style={{ color: d.notes[item.id] ? "#06b6d4" : "#475569" }}><MessageSquare size={8} /></button>
            <button onClick={() => { setEditId(item.id); setEditText(item.text); setEditOwner(item.owner); setEditPrio(item.p); }} className="border-none bg-transparent cursor-pointer text-slate-500"><Edit3 size={8} /></button>
            <button onClick={() => deleteItem(sectionId, item.id)} className="border-none bg-transparent cursor-pointer text-red-500"><Trash2 size={8} /></button>
          </div>
          {noteId === item.id ? (
            <div className="mt-1 flex gap-1">
              <input value={noteVal} onChange={(e) => setNoteVal(e.target.value)} className="flex-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-700 text-slate-200 outline-none" onKeyDown={(e) => e.key === "Enter" && saveNote(item.id)} autoFocus />
              <button onClick={() => saveNote(item.id)} className="px-2 py-0.5 rounded text-[9px] bg-cyan-500 text-white border-none cursor-pointer">OK</button>
            </div>
          ) : null}
          {noteId !== item.id && d.notes[item.id] ? (
            <div className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] bg-slate-950 border border-slate-800 text-slate-400 italic">{d.notes[item.id]}</div>
          ) : null}
        </div>
      </div>
    );
  };

  // ── Input style ──
  const ist = "rounded border border-slate-700 bg-slate-950 text-slate-200 outline-none";

  // ── VIEWS ──
  const views = ["dash", "list", "focus", "kanban", "burndown"];
  const viewLabels = { dash: "Dash", list: "Tasks", focus: "Focus", kanban: "Board", burndown: "Burn" };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.docx,.xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />

      {/* Edit Modal */}
      {editId ? (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-800 rounded-xl p-4 w-full max-w-sm border border-slate-700">
            <div className="text-sm font-bold mb-2">Edit Task</div>
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className={`w-full p-1.5 text-xs mb-2 resize-y box-border ${ist}`} />
            <div className="flex gap-2 mb-3">
              <select value={editOwner} onChange={(e) => setEditOwner(e.target.value)} className={`flex-1 p-1.5 text-xs ${ist}`}>{OWNERS.map((o) => <option key={o}>{o}</option>)}</select>
              <select value={editPrio} onChange={(e) => setEditPrio(e.target.value)} className={`flex-1 p-1.5 text-xs ${ist}`}><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option></select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-md bg-slate-700 text-slate-400 border-none text-xs cursor-pointer">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-1.5 rounded-md bg-cyan-500 text-white border-none text-xs font-bold cursor-pointer">Save</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Import Modal */}
      {showImport ? (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowImport(false); setImportTasks(null); setImportMode("manual"); setImportError(null); }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-800 rounded-xl p-4 w-full max-w-2xl max-h-[85vh] overflow-auto border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-cyan-400" />
              <div className="text-sm font-bold">Import Tasks</div>
              <span className="text-[10px] text-slate-400 ml-auto">{importTasks ? importTasks.filter(t => t.include).length + " tasks" : ""}</span>
            </div>

            {importError ? (
              <div className="mb-3 p-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{importError}</div>
            ) : null}

            {/* Mode toggle */}
            <div className="flex gap-1 mb-3">
              <button onClick={() => setImportMode("manual")} className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold border-none cursor-pointer ${importMode === "manual" ? "bg-slate-700 text-white" : "bg-transparent text-slate-500"}`}>Manual Import</button>
              <button onClick={() => { if (importMode !== "ai") handleAiParse(); else setImportMode("ai"); }} className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold border-none cursor-pointer flex items-center justify-center gap-1 ${importMode === "ai" ? "bg-cyan-500/20 text-cyan-400" : "bg-transparent text-slate-500"}`}>
                {aiParsing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI Parse
              </button>
            </div>

            {aiParsing ? (
              <div className="py-8 text-center">
                <Loader2 size={24} className="animate-spin text-cyan-400 mx-auto mb-2" />
                <div className="text-xs text-slate-400">AI is analyzing your document and extracting tasks...</div>
              </div>
            ) : importTasks && importTasks.length > 0 ? (
              <div>
                {/* Section selector for manual mode */}
                {importMode === "manual" ? (
                  <div className="flex gap-2 mb-3 flex-wrap items-center">
                    <select value={importSec} onChange={(e) => setImportSec(e.target.value)} className={`flex-1 p-1.5 text-xs ${ist}`}>
                      <option value="">Select section...</option>
                      {d.sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                    <span className="text-[9px] text-slate-500">Assign all:</span>
                    {OWNERS.map((o) => (
                      <button key={o} onClick={() => setAllImportOwner(o)} className="px-1.5 py-0.5 rounded text-[9px] font-bold border-none cursor-pointer" style={{ background: OWNER_COLORS[o], color: "#000" }}>{o}</button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 mb-2">
                    AI organized {importTasks.filter(t => t.include).length} tasks into {[...new Set(importTasks.map(t => t.section))].length} sections. Edit owners/priorities below:
                  </div>
                )}

                {/* Task list with per-task editing */}
                <div className="max-h-96 overflow-y-auto mb-3 border border-slate-700 rounded">
                  {importTasks.map((t) => (
                    <div key={t._id} className={`px-2 py-1.5 border-b border-slate-800 ${t.include ? "" : "opacity-30"}`}>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" checked={t.include} onChange={() => updateImportTask(t._id, "include", !t.include)} className="mt-1 cursor-pointer" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-slate-200 leading-relaxed">{t.text}</div>
                          <div className="flex gap-1 mt-1 items-center flex-wrap">
                            <select value={t.owner} onChange={(e) => updateImportTask(t._id, "owner", e.target.value)} className="text-[9px] px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 outline-none cursor-pointer">
                              {OWNERS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                            <select value={t.p} onChange={(e) => updateImportTask(t._id, "p", e.target.value)} className="text-[9px] px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 outline-none cursor-pointer">
                              <option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option>
                            </select>
                            {importMode === "ai" && t.section ? (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-slate-700 text-slate-400">{t.section}</span>
                            ) : null}
                            <button onClick={() => removeImportTask(t._id)} className="ml-auto text-red-500 bg-transparent border-none cursor-pointer"><Trash2 size={10} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowImport(false); setImportTasks(null); setImportError(null); }} className="px-3 py-1.5 rounded-md bg-slate-700 text-slate-400 border-none text-xs cursor-pointer">Cancel</button>
                  <button onClick={doImport} className={`px-3 py-1.5 rounded-md border-none text-xs font-bold cursor-pointer ${(importMode === "ai" || importSec) ? "bg-cyan-500 text-white" : "bg-slate-700 text-slate-500"}`}>
                    Import {importTasks.filter(t => t.include).length} Tasks
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">No tasks found in document</div>
            )}

            <div className="mt-3 pt-2 border-t border-slate-700 text-[9px] text-slate-500">
              Supports: .csv, .txt, .docx (Word), .xlsx (Excel)
              {aiUsage ? (
                <span className="ml-2 text-cyan-500">AI used {aiUsage.input_tokens + aiUsage.output_tokens} tokens (~${((aiUsage.input_tokens * 0.8 + aiUsage.output_tokens * 4) / 1000000).toFixed(4)})</span>
              ) : " — AI Parse uses Claude Haiku for fast, cheap task extraction"}
              {!d.context?.goal ? (
                <span className="ml-1 text-amber-400 cursor-pointer" onClick={() => { setShowSetup(true); }}> • Set up project context for better results</span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── HEADER ── */}
      <div className="border-b border-slate-800 px-3 py-1.5 flex items-center gap-2 bg-slate-950/95 sticky top-0 z-40 flex-wrap backdrop-blur">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #06b6d4)" }}>
            <Clipboard size={12} color="#0f172a" />
          </div>
          <select value={store.activeId || ""} onChange={(e) => store.loadProject(e.target.value)} className="text-xs font-extrabold bg-transparent border-none text-slate-100 cursor-pointer outline-none max-w-[140px]">
            {(store.projects || []).map((p) => <option key={p.id} value={p.id} style={{ background: "#1e293b" }}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex gap-0.5 bg-slate-800 rounded-md p-0.5">
          {views.map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-2.5 py-1 rounded text-[9px] font-semibold border-none cursor-pointer ${view === v ? "bg-cyan-500 text-white" : "bg-transparent text-slate-500"}`}>
              {viewLabels[v]}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => fileRef.current?.click()} className="px-1.5 py-0.5 rounded border border-slate-700 bg-transparent text-slate-500 text-[9px] cursor-pointer flex items-center gap-1"><Upload size={9} /> Import</button>
        <button onClick={() => setShowNewProj(true)} className="px-1.5 py-0.5 rounded border border-slate-700 bg-transparent text-slate-500 text-[9px] cursor-pointer"><FolderPlus size={9} /></button>
        <button onClick={() => setShowMgr(!showMgr)} className="px-1 py-0.5 rounded border border-slate-700 bg-transparent text-slate-500 cursor-pointer"><Settings size={9} /></button>
        <div className="w-9"><ProgressBar value={pct} height={4} /></div>
        <span className="text-[10px] font-extrabold" style={{ color: pct === 100 ? "#22c55e" : "#06b6d4" }}>{pct}%</span>
      </div>

      {/* New Project Bar */}
      {showNewProj ? (
        <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 flex gap-2">
          <input value={newProjName} onChange={(e) => setNewProjName(e.target.value)} placeholder="Project name..." className={`flex-1 px-2 py-1 text-xs ${ist}`} autoFocus onKeyDown={(e) => e.key === "Enter" && createProject()} />
          <button onClick={createProject} className="px-3 py-1 rounded bg-cyan-500 text-white border-none text-[10px] font-bold cursor-pointer">Create</button>
          <button onClick={() => setShowNewProj(false)} className="px-2 py-1 rounded bg-slate-700 text-slate-400 border-none text-[10px] cursor-pointer">X</button>
        </div>
      ) : null}

      {/* Manage Panel */}
      {showMgr ? (
        <div className="px-3 py-2 bg-slate-800 border-b border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 mb-1">Projects</div>
          {(store.projects || []).map((p) => (
            <div key={p.id} className="flex items-center gap-2 py-0.5">
              <span className="text-[10px] flex-1" style={{ color: p.id === store.activeId ? "#06b6d4" : "#e2e8f0" }}>{p.name}</span>
              {store.projects.length > 1 ? <button onClick={() => deleteProject(p.id)} className="text-[9px] text-red-500 bg-transparent border-none cursor-pointer">Del</button> : null}
            </div>
          ))}
          <div className="mt-2 text-[10px] font-bold text-slate-400 mb-1">Add Section</div>
          <div className="flex gap-2">
            <input value={newSecName} onChange={(e) => setNewSecName(e.target.value)} placeholder="Name..." className={`flex-1 px-1.5 py-1 text-[10px] ${ist}`} onKeyDown={(e) => e.key === "Enter" && addSection()} />
            <input type="date" value={newSecDue} onChange={(e) => setNewSecDue(e.target.value)} className={`px-1 py-1 text-[10px] ${ist}`} />
            <button onClick={addSection} className="px-2 py-1 rounded bg-cyan-500 text-white border-none text-[10px] cursor-pointer">Add</button>
          </div>
          <button onClick={() => setShowSetup(true)} className="mt-2 w-full py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold cursor-pointer flex items-center justify-center gap-1">
            <Sparkles size={10} /> Project Setup &amp; AI Context
          </button>
          <div className="flex gap-2 mt-1.5">
            <button onClick={() => { fileRef.current?.click(); setShowMgr(false); }} className="flex-1 py-1.5 rounded-md bg-slate-700 text-slate-300 border-none text-[10px] font-semibold cursor-pointer flex items-center justify-center gap-1">
              <Upload size={10} /> Upload &amp; Parse Document
            </button>
            <button onClick={clearProject} className="py-1.5 px-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-semibold cursor-pointer">
              Clear All Tasks
            </button>
          </div>
        </div>
      ) : null}

      {/* Project Setup Modal */}
      {showSetup ? (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSetup(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-800 rounded-xl p-5 w-full max-w-lg max-h-[85vh] overflow-auto border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-cyan-400" />
              <div className="text-base font-bold">Project Setup</div>
              <span className="text-[9px] text-slate-500 ml-auto">This context makes AI parsing smarter and more accurate</span>
            </div>

            <div className="mb-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Project Goal</label>
              <textarea
                value={d.context?.goal || ""}
                onChange={(e) => save({ ...d, context: { ...d.context, goal: e.target.value } })}
                placeholder="What is the end goal? e.g. 'Launch AI agent package for construction businesses by March 28'"
                className={`w-full p-2 text-xs resize-none h-16 ${ist}`}
              />
            </div>

            <div className="mb-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Deadline</label>
              <input
                type="date"
                value={d.context?.deadline || ""}
                onChange={(e) => save({ ...d, context: { ...d.context, deadline: e.target.value } })}
                className={`w-full p-2 text-xs ${ist}`}
              />
            </div>

            <div className="mb-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Team Members</label>
              <div className="space-y-1.5">
                {(d.context?.team || OWNERS.map((o) => ({ name: o, role: "" }))).map((member, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={member.name}
                      onChange={(e) => {
                        const team = [...(d.context?.team || OWNERS.map((o) => ({ name: o, role: "" })))];
                        team[i] = { ...team[i], name: e.target.value };
                        save({ ...d, context: { ...d.context, team } });
                      }}
                      placeholder="Name"
                      className={`flex-1 p-1.5 text-xs ${ist}`}
                    />
                    <input
                      value={member.role}
                      onChange={(e) => {
                        const team = [...(d.context?.team || OWNERS.map((o) => ({ name: o, role: "" })))];
                        team[i] = { ...team[i], role: e.target.value };
                        save({ ...d, context: { ...d.context, team } });
                      }}
                      placeholder="Role (e.g. QA, Builder, Strategy)"
                      className={`flex-1 p-1.5 text-xs ${ist}`}
                    />
                    <button
                      onClick={() => {
                        const team = [...(d.context?.team || OWNERS.map((o) => ({ name: o, role: "" })))];
                        team.splice(i, 1);
                        save({ ...d, context: { ...d.context, team } });
                      }}
                      className="text-red-500 bg-transparent border-none cursor-pointer"
                    ><Trash2 size={12} /></button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const team = [...(d.context?.team || OWNERS.map((o) => ({ name: o, role: "" }))), { name: "", role: "" }];
                    save({ ...d, context: { ...d.context, team } });
                  }}
                  className="text-[10px] text-cyan-400 bg-transparent border border-cyan-500/30 rounded px-2 py-1 cursor-pointer flex items-center gap-1"
                ><Plus size={10} /> Add team member</button>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Project Description</label>
              <textarea
                value={d.context?.description || ""}
                onChange={(e) => save({ ...d, context: { ...d.context, description: e.target.value } })}
                placeholder="Brief description: What are you building? What modules/phases? Any key constraints?"
                className={`w-full p-2 text-xs resize-none h-20 ${ist}`}
              />
            </div>

            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Priority Strategy</label>
              <textarea
                value={d.context?.priorityStrategy || ""}
                onChange={(e) => save({ ...d, context: { ...d.context, priorityStrategy: e.target.value } })}
                placeholder="How should tasks be prioritized? e.g. 'Testing and QA first, documentation second. Everything blocking client demo is CRITICAL.'"
                className={`w-full p-2 text-xs resize-none h-16 ${ist}`}
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 mb-3">
              <div className="text-[9px] text-slate-500 font-semibold uppercase mb-1">How this helps AI Parse</div>
              <div className="text-[10px] text-slate-400 leading-relaxed">
                When you upload documents and click "AI Parse", this context tells the AI who does what, what matters most, and how to organize tasks. It uses Claude Haiku (fastest, cheapest model) — each parse costs ~$0.001. The AI will automatically assign owners by role, set priorities based on your deadline, and group tasks into your existing sections.
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSetup(false)} className="px-4 py-2 rounded-md bg-cyan-500 text-white border-none text-xs font-bold cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── CONTENT ── */}
      <div className="max-w-4xl mx-auto p-3">

        {/* DASHBOARD */}
        {view === "dash" ? (
          <div>
            {total === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🚀</div>
                <div className="text-lg font-bold text-slate-200 mb-1">Get Started</div>
                <div className="text-xs text-slate-400 mb-6 max-w-md mx-auto">Set up your project context, then upload your documents and let AI break them into organized tasks.</div>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <button onClick={() => setShowSetup(true)} className="w-full py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-bold cursor-pointer flex items-center justify-center gap-2">
                    <Sparkles size={16} /> Step 1: Project Setup
                  </button>
                  <button onClick={() => fileRef.current?.click()} className="w-full py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold cursor-pointer flex items-center justify-center gap-2">
                    <Upload size={16} /> Step 2: Upload Documents
                  </button>
                  <div className="text-[10px] text-slate-500 mt-2">Supports Word (.docx), Excel (.xlsx), CSV, and text files. AI will auto-extract tasks, assign owners, and set priorities.</div>
                </div>
              </div>
            ) : (
            <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[
                { l: "Progress", v: `${pct}%`, c: "#06b6d4" },
                { l: "Critical", v: allItems.filter((i) => i.p === "CRITICAL" && !d.checks[i.id]).length, c: "#ef4444" },
                { l: "Done", v: doneCount, c: "#22c55e" },
                { l: "Total", v: total, c: "#94a3b8" },
              ].map((card, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-500 font-semibold uppercase mb-0.5">{card.l}</div>
                  <div className="text-xl font-extrabold" style={{ color: card.c }}>{card.v}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {OWNERS.map((o) => {
                const items = allItems.filter((i) => i.owner === o);
                const done = items.filter((i) => d.checks[i.id]).length;
                const op = items.length ? Math.round((done / items.length) * 100) : 0;
                return (
                  <div key={o} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex justify-between mb-1"><Badge text={o} color={OWNER_COLORS[o]} /><span className="text-[10px] font-bold" style={{ color: op === 100 ? "#22c55e" : "#e2e8f0" }}>{op}%</span></div>
                    <ProgressBar value={op} />
                    <div className="text-[9px] text-slate-500 mt-1">{done}/{items.length} tasks</div>
                  </div>
                );
              })}
            </div>
            {d.sections.map((s) => {
              const st = secStats(s);
              const du = daysUntil(s.due);
              return (
                <div key={s.id} onClick={() => goToSection(s.id)} className="flex items-center gap-2 px-2 py-1.5 mb-0.5 rounded-md border border-slate-800 cursor-pointer hover:bg-slate-900/50">
                  <div className="flex-1 text-[11px] font-semibold text-slate-200 truncate">{s.title}</div>
                  <div className="w-10"><ProgressBar value={st.pct} height={3} /></div>
                  <span className="text-[10px] font-bold w-7 text-right" style={{ color: st.pct === 100 ? "#22c55e" : "#94a3b8" }}>{st.pct}%</span>
                  <span className="text-[9px] w-10 text-right" style={{ color: du <= 0 ? "#ef4444" : du <= 2 ? "#f59e0b" : "#475569" }}>{fmtDate(s.due)}</span>
                </div>
              );
            })}
          </div>
          )}
          </div>
        ) : null}

        {/* CHECKLIST */}
        {view === "list" ? (
          <div>
            <div className="flex gap-1 mb-2 flex-wrap items-center">
              <div className="flex-1 min-w-[100px] relative">
                <Search size={10} className="absolute left-1.5 top-2 text-slate-500" />
                <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search..." className={`w-full pl-5 pr-1 py-1.5 text-[10px] box-border ${ist}`} />
              </div>
              {[
                { v: filterOwner, f: setFilterOwner, o: ["All", ...OWNERS], l: "Owner" },
                { v: filterPrio, f: setFilterPrio, o: ["All", "CRITICAL", "HIGH", "MEDIUM"], l: "Prio" },
                { v: filterStatus, f: setFilterStatus, o: ["All", "Not Started", "In Progress", "Done"], l: "St" },
              ].map((x) => (
                <select key={x.l} value={x.v} onChange={(e) => x.f(e.target.value)} className={`p-1 text-[9px] ${ist}`}>
                  {x.o.map((o) => <option key={o} value={o}>{x.l}: {o}</option>)}
                </select>
              ))}
              <button onClick={() => setOpened(d.sections.reduce((a, s) => ({ ...a, [s.id]: true }), {}))} className="px-1.5 py-1 rounded border border-slate-800 bg-transparent text-slate-500 text-[9px] cursor-pointer">+</button>
              <button onClick={() => setOpened({})} className="px-1.5 py-1 rounded border border-slate-800 bg-transparent text-slate-500 text-[9px] cursor-pointer">-</button>
            </div>

            {selected.size > 0 ? (
              <div className="flex gap-1 mb-2 p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500 items-center flex-wrap">
                <span className="text-[10px] text-cyan-400 font-bold">{selected.size} selected</span>
                <button onClick={bulkDelete} className="px-2 py-0.5 rounded bg-red-500 text-white border-none text-[9px] cursor-pointer">Delete</button>
                {OWNERS.map((o) => <button key={o} onClick={() => bulkAssign(o)} className="px-2 py-0.5 rounded border-none text-black text-[9px] cursor-pointer font-semibold" style={{ background: OWNER_COLORS[o] }}>{o}</button>)}
                <button onClick={() => setSelected(new Set())} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border-none text-[9px] cursor-pointer">Clear</button>
              </div>
            ) : null}

            {d.sections.map((sec) => {
              const isOpen = opened[sec.id];
              const st = secStats(sec);
              const du = daysUntil(sec.due);
              const fl = filterItems(sec.items);
              return (
                <div key={sec.id} ref={(el) => { sectionRefs.current[sec.id] = el; }} className="mb-1.5 rounded-lg border border-slate-800 bg-slate-900 overflow-hidden" style={sec.title === "Final Validation" ? { borderColor: "#ef4444", borderWidth: 2 } : {}}>
                  <div onClick={() => setOpened((prev) => ({ ...prev, [sec.id]: !prev[sec.id] }))} className="px-2.5 py-2 flex items-center gap-2 cursor-pointer">
                    {isOpen ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-slate-100">{sec.title}</div>
                      <div className="flex gap-2 mt-0.5 items-center">
                        <span className="text-[9px] text-slate-500">{st.done}/{st.total}</span>
                        <div className="w-10"><ProgressBar value={st.pct} height={3} /></div>
                        <span className="text-[9px]" style={{ color: du <= 0 ? "#ef4444" : du <= 2 ? "#f59e0b" : "#64748b" }}>Due {fmtDate(sec.due)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <select onChange={(e) => { if (e.target.value) reassignSection(sec.id, e.target.value); e.target.selectedIndex = 0; }} defaultValue="" className="text-[8px] p-0.5 rounded bg-transparent border border-slate-700 text-slate-500 outline-none">
                        <option value="" disabled>Assign</option>
                        {OWNERS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                      <button onClick={(e) => { e.stopPropagation(); selectAllInSec(sec.id); }} className="text-[8px] text-cyan-400 bg-transparent border-none cursor-pointer">Sel</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteSection(sec.id); }} className="text-[8px] text-red-500 bg-transparent border-none cursor-pointer"><Trash2 size={9} /></button>
                    </div>
                    <span className="text-sm font-extrabold" style={{ color: st.pct === 100 ? "#22c55e" : "#475569" }}>{st.pct}%</span>
                  </div>
                  {isOpen ? (
                    <div>
                      {fl.length === 0 ? <div className="p-2 text-center text-slate-600 text-[10px]">No items match filters</div> : null}
                      {fl.map((it) => <ItemRow key={it.id} item={it} sectionId={sec.id} />)}
                      {addingTo === sec.id ? (
                        <div className="p-1.5 border-t border-slate-800 flex gap-1 flex-wrap">
                          <input value={newTask.text} onChange={(e) => setNewTask({ ...newTask, text: e.target.value })} placeholder="New task..." className={`flex-1 min-w-[100px] px-1.5 py-1 text-[10px] ${ist}`} autoFocus onKeyDown={(e) => e.key === "Enter" && addTaskToSec(sec.id)} />
                          <select value={newTask.owner} onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })} className={`p-1 text-[9px] ${ist}`}>{OWNERS.map((o) => <option key={o}>{o}</option>)}</select>
                          <button onClick={() => addTaskToSec(sec.id)} className="px-2 py-1 rounded bg-cyan-500 text-white border-none text-[9px] cursor-pointer">Add</button>
                        </div>
                      ) : (
                        <div onClick={() => setAddingTo(sec.id)} className="p-1.5 border-t border-slate-800 text-slate-500 text-[9px] cursor-pointer text-center flex items-center justify-center gap-1">
                          <Plus size={10} /> Add task
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* FOCUS */}
        {view === "focus" ? (
          <div>
            <div className="flex gap-1 mb-3">
              {["All", ...OWNERS].map((o) => (
                <button key={o} onClick={() => setFocusPerson(o)} className="px-3 py-1.5 rounded-md border-none text-[10px] font-bold cursor-pointer" style={{ background: focusPerson === o ? (OWNER_COLORS[o] || "#06b6d4") : "#1e293b", color: focusPerson === o ? "#000" : "#94a3b8" }}>
                  {o}
                </button>
              ))}
            </div>
            {focusItems.length === 0 ? (
              <div className="py-8 text-center text-green-400 text-sm font-bold">All caught up!</div>
            ) : (
              <div>
                <div className="p-3 rounded-lg border-2 border-slate-700 mb-3" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
                  <div className="text-[9px] text-red-500 uppercase font-bold tracking-wider mb-1">Top Priority</div>
                  <div className="text-sm font-bold text-slate-100 leading-relaxed">{focusItems[0].text}</div>
                  <div className="flex gap-1 mt-2">
                    <Badge text={focusItems[0].owner} color={OWNER_COLORS[focusItems[0].owner]} />
                    <Badge text={focusItems[0].p} color={PRIORITY_COLORS[focusItems[0].p]} />
                    <span className="text-[9px] text-slate-500">{focusItems[0].sectionTitle} • Due {fmtDate(focusItems[0].due)}</span>
                  </div>
                </div>
                {focusItems.length > 1 ? <div className="text-[10px] text-slate-500 font-semibold mb-1">Next {focusItems.length - 1} priorities:</div> : null}
                {focusItems.slice(1).map((it) => {
                  const sec = d.sections.find((s) => s.items.some((x) => x.id === it.id));
                  return <ItemRow key={it.id} item={it} sectionId={sec?.id || ""} compact />;
                })}
              </div>
            )}
          </div>
        ) : null}

        {/* KANBAN */}
        {view === "kanban" ? (
          <div className="grid grid-cols-3 gap-2" style={{ minHeight: 300 }}>
            {["Not Started", "In Progress", "Done"].map((col) => {
              const items = allItems.filter((i) => getStatus(i.id) === col);
              return (
                <div key={col} className="rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                  <div className="px-2 py-1.5 border-b border-slate-800 flex justify-between">
                    <span className="text-[10px] font-bold" style={{ color: STATUS_COLORS[col] }}>{col}</span>
                    <span className="text-[10px] text-slate-500">{items.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-1">
                    {items.slice(0, 60).map((it) => (
                      <div key={it.id} className="p-1.5 rounded border border-slate-800 mb-0.5">
                        <div className="text-[9px] text-slate-200 leading-snug mb-1">{it.text}</div>
                        <div className="flex gap-1 items-center">
                          <Badge text={it.owner} color={OWNER_COLORS[it.owner]} />
                          <Badge text={it.p} color={PRIORITY_COLORS[it.p]} />
                          <select value={getStatus(it.id)} onChange={(e) => setItemStatus(it.id, e.target.value)} className="text-[8px] ml-auto px-0.5 rounded bg-transparent font-semibold cursor-pointer outline-none" style={{ border: `1px solid ${STATUS_COLORS[getStatus(it.id)]}`, color: STATUS_COLORS[getStatus(it.id)] }}>
                            <option value="Not Started">NS</option>
                            <option value="In Progress">IP</option>
                            <option value="Done">Done</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* BURNDOWN */}
        {view === "burndown" ? (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[9px] text-slate-500 font-semibold uppercase">Velocity</div>
                <div className="text-lg font-extrabold text-cyan-400">{burndownData.vel.toFixed(1)}<span className="text-[10px] text-slate-500">/day</span></div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[9px] text-slate-500 font-semibold uppercase">Remaining</div>
                <div className="text-lg font-extrabold text-amber-400">{total - doneCount}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[9px] text-slate-500 font-semibold uppercase">Done</div>
                <div className="text-lg font-extrabold text-green-400">{doneCount}</div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 overflow-x-auto">
              {(() => {
                const { ideal, actual, numDays, startDate } = burndownData;
                const W = 500, H = 200, PL = 35, PBt = 20;
                const xS = (x) => (x / numDays) * (W - PL - 10) + PL;
                const yS = (v) => total > 0 ? (v / total) * (H - PL - PBt) : 0;
                const iLine = ideal.map((p, i) => `${i === 0 ? "M" : "L"}${xS(p.x)} ${H - PBt - yS(p.y)}`).join(" ");
                const aLine = actual.map((p, i) => `${i === 0 ? "M" : "L"}${xS(p.x)} ${H - PBt - yS(p.y)}`).join(" ");
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
                    {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                      <g key={f}>
                        <line x1={PL} x2={W - 10} y1={H - PBt - yS(total * f)} y2={H - PBt - yS(total * f)} stroke="#1e293b" strokeWidth={1} />
                        <text x={PL - 3} y={H - PBt - yS(total * f) + 3} textAnchor="end" fill="#475569" fontSize={8}>{Math.round(total * (1 - f))}</text>
                      </g>
                    ))}
                    {Array.from({ length: numDays + 1 }, (_, i) => {
                      const dt = new Date(startDate);
                      dt.setDate(dt.getDate() + i);
                      return <text key={i} x={xS(i)} y={H - 4} textAnchor="middle" fill="#475569" fontSize={8}>{dt.getDate()}</text>;
                    })}
                    <path d={iLine} fill="none" stroke="#334155" strokeWidth={2} strokeDasharray="5 3" />
                    {actual.length > 1 ? <path d={aLine} fill="none" stroke="#06b6d4" strokeWidth={2.5} /> : null}
                    {actual.map((p, i) => <circle key={i} cx={xS(p.x)} cy={H - PBt - yS(p.y)} r={3} fill="#06b6d4" />)}
                    <text x={W - 10} y={12} textAnchor="end" fill="#334155" fontSize={8}>Ideal</text>
                    <text x={W - 10} y={24} textAnchor="end" fill="#06b6d4" fontSize={8}>Actual</text>
                  </svg>
                );
              })()}
            </div>
            <div className="mt-2 text-[10px] text-slate-500 text-center">Remaining tasks go down toward zero by March 28. Check off items to track your pace.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
