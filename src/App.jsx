import { useState, useEffect, useRef } from "react";
import {
  Loader2, FileText, Sparkles, Trash2, Link as LinkIcon, Calendar as CalIcon
} from "lucide-react";
import { getOwners, getOwnerColors, PRIORITY_COLORS } from "./helpers";
import { useStore } from "./useStore";
import { extractText, aiParseTasks } from "./docParser";
import { useTheme } from "./ThemeContext";
import { showToast } from "./components/Toasts";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import TaskList from "./components/TaskList";
import FocusView from "./components/FocusView";
import KanbanBoard from "./components/KanbanBoard";
import BurndownChart from "./components/BurndownChart";
import SettingsPage from "./components/SettingsPage";
import WelcomeScreen from "./components/WelcomeScreen";
import TeamDashboard from "./components/TeamDashboard";
import DeadlineAlerts from "./components/DeadlineAlerts";
import CalendarView from "./components/CalendarView";
import Toasts from "./components/Toasts";

const uid = () => "t" + Date.now() + Math.random().toString(36).slice(2, 6);

export default function App() {
  const store = useStore();
  const { theme } = useTheme();

  const [onboarded, setOnboarded] = useState(() => {
    try { return localStorage.getItem("summit-onboarded") === "true"; } catch { return false; }
  });
  const [view, setView] = useState("dash");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [opened, setOpened] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [scrollTarget, setScrollTarget] = useState(null);
  const [focusPerson, setFocusPerson] = useState("All");

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importTasks, setImportTasks] = useState(null);
  const [importMode, setImportMode] = useState("manual");
  const [importError, setImportError] = useState(null);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiUsage, setAiUsage] = useState(null);
  const [importFileMeta, setImportFileMeta] = useState(null); // {name, size, type}

  // Project creation
  const [showNewProj, setShowNewProj] = useState(false);
  const [newProjName, setNewProjName] = useState("");

  // Edit modal
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editPrio, setEditPrio] = useState("");
  const [editBlockedBy, setEditBlockedBy] = useState([]);
  const [editDue, setEditDue] = useState("");
  const [decomposing, setDecomposing] = useState(false);
  const [subtasks, setSubtasks] = useState(null);

  const fileRef = useRef(null);
  const sectionRefs = useRef({});

  // ── Load shared project from URL ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("project");
    if (encoded) {
      fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decode", encoded })
      })
        .then(r => r.json())
        .then(json => {
          if (json.data) {
            const id = uid();
            const name = json.data.context?.goal?.slice(0, 40) || "Shared Project";
            const projects = store.projects ? [...store.projects, { id, name }] : [{ id, name }];
            store.setProjects(projects);
            store.setActiveId(id);
            const projectData = {
              sections: json.data.sections || [],
              checks: json.data.checks || {},
              statuses: json.data.statuses || {},
              notes: json.data.notes || {},
              context: json.data.context || {},
              log: [], documents: [],
            };
            store.saveData(projectData, id);
            setOnboarded(true);
            try { localStorage.setItem("summit-onboarded", "true"); } catch {}
            window.history.replaceState({}, "", window.location.pathname);
          }
        })
        .catch(() => {});
    }
  }, []);

  // ── Init ──
  useEffect(() => {
    if (!store.projects) {
      const id = uid();
      store.setProjects([{ id, name: "My Project" }]);
      store.setActiveId(id);
      store.saveData({ sections: [], checks: {}, notes: {}, statuses: {}, log: [], context: {}, documents: [] }, id);
    } else if (store.projects.length && !store.data) {
      store.loadProject(store.projects[0].id);
    }
  }, []);

  useEffect(() => { setMobileSidebarOpen(false); }, [view]);

  useEffect(() => {
    if (scrollTarget && view === "list" && sectionRefs.current[scrollTarget]) {
      setTimeout(() => {
        sectionRefs.current[scrollTarget]?.scrollIntoView({ behavior: "smooth", block: "start" });
        setScrollTarget(null);
      }, 100);
    }
  }, [scrollTarget, view, opened]);

  // Responsive sidebar
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 640 : true);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const d = store.data;
  if (!d) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: theme.bg, color: theme.text, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="text-center">
          <div className="text-2xl font-extrabold tracking-tight">SUMMIT</div>
          <div style={{ color: theme.textMuted, marginTop: 4, fontSize: 13 }}>Loading...</div>
        </div>
      </div>
    );
  }

  const save = (nd) => store.saveData(nd);

  // ── Computed ──
  const owners = getOwners(d);
  const ownerColors = getOwnerColors(d);
  const allItems = [];
  d.sections.forEach((s) => s.items.forEach((it) => allItems.push({ ...it, sectionId: s.id, sectionTitle: s.title, due: it.due || s.due })));
  const total = allItems.length;
  const doneCount = allItems.filter((i) => d.checks[i.id]).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const getStatus = (id) => d.checks[id] ? "Done" : (d.statuses?.[id] || "Not Started");
  const secStats = (s) => {
    const done = s.items.filter((i) => d.checks[i.id]).length;
    return { total: s.items.length, done, pct: s.items.length ? Math.round((done / s.items.length) * 100) : 0 };
  };

  // ── Core Actions ──
  const toggleCheck = (id) => {
    const nc = { ...d.checks, [id]: !d.checks[id] };
    const lg = [...(d.log || [])];
    if (!d.checks[id]) {
      lg.push({ id, ts: Date.now() });
      const newDone = allItems.filter(i => nc[i.id]).length;
      const newPct = total > 0 ? Math.round((newDone / total) * 100) : 0;
      if (newPct >= 100) showToast("🎉 All tasks complete!", "milestone");
      else if (newPct >= 75 && pct < 75) showToast("75% done — almost there!", "milestone");
      else if (newPct >= 50 && pct < 50) showToast("Halfway there! 50% complete", "milestone");
      else if (newPct >= 25 && pct < 25) showToast("25% down — great start!", "milestone");
    }
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

  const goToSection = (secId) => {
    setOpened((prev) => ({ ...prev, [secId]: true }));
    setView("list");
    setScrollTarget(secId);
  };

  const saveEdit = () => {
    if (!editId) return;
    save({ ...d, sections: d.sections.map((s) => ({ ...s, items: s.items.map((i) => i.id === editId ? { ...i, text: editText, owner: editOwner, p: editPrio, due: editDue || undefined, blockedBy: editBlockedBy.length ? editBlockedBy : undefined } : i) })) });
    setEditId(null);
  };

  const editHandlers = {
    start: (item) => { setEditId(item.id); setEditText(item.text); setEditOwner(item.owner); setEditPrio(item.p); setEditDue(item.due || ""); setEditBlockedBy(item.blockedBy || []); setSubtasks(null); },
  };

  const decomposeTask = async () => {
    setDecomposing(true); setSubtasks(null);
    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decompose",
          data: { task: { text: editText, owner: editOwner, p: editPrio }, context: d.context || {} }
        })
      });
      const json = await res.json();
      if (json.result?.subtasks) setSubtasks(json.result.subtasks);
    } catch (e) { console.error(e); }
    setDecomposing(false);
  };

  const addSubtasks = () => {
    if (!subtasks?.length || !editId) return;
    // Find which section the parent task is in
    const sec = d.sections.find((s) => s.items.some((i) => i.id === editId));
    if (!sec) return;
    const parentIdx = sec.items.findIndex((i) => i.id === editId);
    const newItems = subtasks.map((st) => ({ id: uid(), text: st.text, owner: st.owner || editOwner, p: st.priority || editPrio }));
    const updatedItems = [...sec.items];
    updatedItems.splice(parentIdx + 1, 0, ...newItems);
    save({ ...d, sections: d.sections.map((s) => s.id === sec.id ? { ...s, items: updatedItems } : s) });
    setEditId(null); setSubtasks(null);
  };

  const createProject = () => {
    if (!newProjName.trim()) return;
    const id = uid();
    store.setProjects([...store.projects, { id, name: newProjName.trim() }]);
    const nd = { sections: [], checks: {}, notes: {}, statuses: {}, log: [], context: {} };
    store.saveData(nd, id);
    store.setActiveId(id);
    store.saveData(nd, id);
    setNewProjName(""); setShowNewProj(false);
  };

  const clearProject = () => {
    if (!window.confirm("Clear all tasks and start fresh?")) return;
    save({ ...d, sections: [], checks: {}, notes: {}, statuses: {}, log: [] });
  };

  // ── File Import ──
  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImportError(null); setImportMode("manual");
    // Save file metadata for document tracking
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    setImportFileMeta({ name: f.name, size: f.size, type: ext });
    try {
      const result = await extractText(f);
      setImportTasks(result.lines.map((line, i) => ({ _id: i, text: line, owner: "Chase", p: "HIGH", section: "", include: true })));
      setShowImport(true);
    } catch (err) {
      setImportError("Could not read file: " + err.message);
      setImportTasks([]); setShowImport(true);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAiParse = async () => {
    if (!importTasks?.length) return;
    setAiParsing(true); setImportError(null); setAiUsage(null);
    try {
      const rawText = importTasks.map((t) => t.text).join("\n");
      const projectContext = {
        goal: d.context?.goal || "complete project checklist",
        description: d.context?.description || "",
        priorityStrategy: d.context?.priorityStrategy || "",
        team: d.context?.team || OWNERS.map(o => ({ name: o, role: "" })),
        deadline: d.context?.deadline || "2026-03-28",
        sections: d.sections.map(s => s.title),
      };
      const result = await aiParseTasks(rawText, projectContext);
      if (result.tasks?.length) {
        setImportTasks(result.tasks.map((t, i) => ({ _id: i, text: t.text, owner: t.owner || "Chase", p: t.priority || "HIGH", section: t.section || "Imported", include: true })));
        setImportMode("ai");
        if (result.usage) setAiUsage(result.usage);
      } else {
        setImportError("AI could not extract any tasks.");
      }
    } catch (err) {
      setImportError("AI parsing failed: " + err.message);
    }
    setAiParsing(false);
  };

  const updateImportTask = (id, field, value) => setImportTasks((prev) => prev.map((t) => t._id === id ? { ...t, [field]: value } : t));
  const removeImportTask = (id) => setImportTasks((prev) => prev.filter((t) => t._id !== id));
  const setAllImportOwner = (owner) => setImportTasks((prev) => prev.map((t) => ({ ...t, owner })));
  const setAllImportSection = (section) => setImportTasks((prev) => prev.map((t) => ({ ...t, section })));

  const doImport = () => {
    if (!importTasks?.length) return;
    const tasks = importTasks.filter((t) => t.include && t.text.trim());
    if (!tasks.length) return;
    // Check that every task has a section assigned
    if (tasks.some((t) => !t.section)) return;
    const taskCount = tasks.length;
    let newData = { ...d };

    // Both manual and AI modes: group tasks by their per-task section
    const map = {};
    tasks.forEach((t) => { const s = t.section || "Imported"; if (!map[s]) map[s] = []; map[s].push({ id: uid(), text: t.text, owner: t.owner, p: t.p }); });
    let secs = [...d.sections];
    Object.entries(map).forEach(([name, items]) => {
      // Match by section ID first (manual mode stores IDs), then by name (AI mode stores names)
      const byId = secs.find((s) => s.id === name);
      const byName = !byId ? secs.find((s) => s.title.toLowerCase() === name.toLowerCase()) : null;
      const existing = byId || byName;
      if (existing) secs = secs.map((s) => s.id === existing.id ? { ...s, items: [...s.items, ...items] } : s);
      else secs.push({ id: uid(), title: name, due: "2026-03-28", items });
    });
    newData = { ...newData, sections: secs };

    // Save document record
    if (importFileMeta) {
      const doc = {
        id: "doc_" + Date.now() + Math.random().toString(36).slice(2, 6),
        name: importFileMeta.name,
        size: importFileMeta.size,
        type: importFileMeta.type,
        uploadedAt: Date.now(),
        taskCount,
        parseMode: importMode,
        extractedText: tasks.map((t) => t.text).join("\n"),
      };
      newData = { ...newData, documents: [...(newData.documents || []), doc] };
    }

    save(newData);
    setShowImport(false); setImportTasks(null); setImportMode("manual"); setImportFileMeta(null);
  };

  const triggerUpload = () => fileRef.current?.click();
  const sidebarWidth = isDesktop ? (sidebarCollapsed ? 56 : 200) : 0;

  const inputStyle = { background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text };

  if (!onboarded) {
    return <WelcomeScreen onComplete={() => { setOnboarded(true); try { localStorage.setItem("summit-onboarded", "true"); } catch {} }} />;
  }

  return (
    <div className="min-h-screen" style={{ background: theme.bg, color: theme.text, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.docx,.xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />

      {/* Desktop sidebar */}
      {isDesktop && (
        <Sidebar view={view} setView={setView} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} pct={pct} />
      )}

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && !isDesktop && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar view={view} setView={setView} collapsed={false} setCollapsed={() => {}} pct={pct} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="transition-all duration-300" style={{ marginLeft: sidebarWidth }}>
        <Header
          store={store} pct={pct}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onUpload={triggerUpload}
          onNewProject={() => setShowNewProj(true)}
        />

        <div key={view} className={`mx-auto p-4 sm:p-5 view-enter ${view === "kanban" || view === "team" || view === "calendar" ? "max-w-6xl" : "max-w-4xl"}`}>
          {view === "dash" && <><DeadlineAlerts d={d} allItems={allItems} /><Dashboard d={d} save={save} allItems={allItems} total={total} doneCount={doneCount} pct={pct} secStats={secStats} goToSection={goToSection} onSetup={() => setView("settings")} onUpload={triggerUpload} /></>}
          {view === "list" && <TaskList d={d} save={save} secStats={secStats} sectionRefs={sectionRefs} opened={opened} setOpened={setOpened} selected={selected} setSelected={setSelected} toggleCheck={toggleCheck} setItemStatus={setItemStatus} getStatus={getStatus} editHandlers={editHandlers} />}
          {view === "focus" && <FocusView d={d} allItems={allItems} focusPerson={focusPerson} setFocusPerson={setFocusPerson} toggleCheck={toggleCheck} setItemStatus={setItemStatus} getStatus={getStatus} selected={selected} setSelected={setSelected} editHandlers={editHandlers} />}
          {view === "kanban" && <KanbanBoard allItems={allItems} d={d} getStatus={getStatus} setItemStatus={setItemStatus} />}
          {view === "calendar" && <CalendarView d={d} allItems={allItems} getStatus={getStatus} setItemStatus={setItemStatus} goToSection={goToSection} />}
          {view === "team" && <TeamDashboard d={d} allItems={allItems} total={total} doneCount={doneCount} />}
          {view === "burndown" && <BurndownChart d={d} total={total} doneCount={doneCount} />}
          {view === "settings" && <SettingsPage d={d} save={save} store={store} onUpload={triggerUpload} onClearProject={clearProject} allItems={allItems} total={total} doneCount={doneCount} pct={pct} />}
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Edit Task */}
      {editId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setEditId(null); setSubtasks(null); }}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl p-5 w-full max-w-md modal-enter" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div className="font-bold mb-3" style={{ fontSize: 14 }}>Edit Task</div>
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className="w-full p-2 text-xs mb-3 rounded-lg outline-none resize-y box-border" style={inputStyle} />
            <div className="flex gap-2 mb-3">
              <select value={editOwner} onChange={(e) => setEditOwner(e.target.value)} className="flex-1 p-2 text-xs rounded-lg outline-none cursor-pointer" style={inputStyle}>{owners.map((o) => <option key={o}>{o}</option>)}</select>
              <select value={editPrio} onChange={(e) => setEditPrio(e.target.value)} className="flex-1 p-2 text-xs rounded-lg outline-none cursor-pointer" style={inputStyle}><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option></select>
              <div className="flex items-center gap-1" style={{ flex: 1 }}>
                <CalIcon size={12} style={{ color: theme.textDim, shrink: 0 }} />
                <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className="w-full p-2 text-xs rounded-lg outline-none" style={inputStyle} />
              </div>
            </div>

            {/* Dependencies */}
            <div className="mb-3 p-2.5 rounded-lg" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <LinkIcon size={11} style={{ color: theme.textDim }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Blocked By</span>
              </div>
              {editBlockedBy.length > 0 && (
                <div className="space-y-1 mb-2">
                  {editBlockedBy.map(depId => {
                    const depTask = allItems.find(i => i.id === depId);
                    return depTask ? (
                      <div key={depId} className="flex items-center gap-2 py-1 px-2 rounded" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                        <span className="flex-1 truncate" style={{ fontSize: 10, color: d.checks[depId] ? "#22c55e" : theme.text }}>{depTask.text}</span>
                        {d.checks[depId] && <span style={{ fontSize: 8, color: "#22c55e", fontWeight: 700 }}>DONE</span>}
                        <button onClick={() => setEditBlockedBy(prev => prev.filter(id => id !== depId))} className="bg-transparent border-none cursor-pointer p-0"><Trash2 size={10} color="#ef4444" /></button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              <select
                value="" onChange={(e) => { if (e.target.value && !editBlockedBy.includes(e.target.value)) setEditBlockedBy(prev => [...prev, e.target.value]); e.target.selectedIndex = 0; }}
                className="w-full p-1.5 text-[10px] rounded-lg outline-none cursor-pointer"
                style={inputStyle}
              >
                <option value="">+ Add dependency...</option>
                {allItems.filter(i => i.id !== editId && !editBlockedBy.includes(i.id)).slice(0, 50).map(i => (
                  <option key={i.id} value={i.id}>{i.text.slice(0, 60)}</option>
                ))}
              </select>
            </div>

            {/* AI Decompose */}
            <button
              onClick={decomposeTask}
              disabled={decomposing}
              className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 rounded-lg border cursor-pointer font-semibold"
              style={{ fontSize: 11, background: theme.accentBg, borderColor: theme.accent + "30", color: theme.accent, opacity: decomposing ? 0.6 : 1 }}
            >
              {decomposing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {decomposing ? "Breaking down..." : "Break Into Subtasks"}
            </button>

            {subtasks && subtasks.length > 0 && (
              <div className="mb-3 p-3 rounded-lg" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <div className="font-semibold mb-2" style={{ fontSize: 10, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  AI generated {subtasks.length} subtasks
                </div>
                {subtasks.map((st, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5 pb-1.5" style={{ borderBottom: i < subtasks.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                    <span className="font-bold shrink-0 mt-0.5" style={{ fontSize: 10, color: theme.accent }}>{i + 1}</span>
                    <div style={{ fontSize: 11, color: theme.text, lineHeight: 1.4 }}>{st.text}</div>
                  </div>
                ))}
                <button
                  onClick={addSubtasks}
                  className="w-full mt-2 py-2 rounded-lg border-none font-bold cursor-pointer"
                  style={{ fontSize: 11, background: theme.accent, color: "#fff" }}
                >
                  Add {subtasks.length} Subtasks Below This Task
                </button>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setEditId(null); setSubtasks(null); }} className="px-4 py-2 rounded-lg border-none text-xs cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted }}>Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 rounded-lg border-none text-xs font-bold cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* New Project */}
      {showNewProj && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowNewProj(false)}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl p-5 w-full max-w-sm modal-enter" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div className="font-bold mb-3" style={{ fontSize: 14 }}>New Project</div>
            <input value={newProjName} onChange={(e) => setNewProjName(e.target.value)} placeholder="Project name..." className="w-full p-2.5 text-xs rounded-lg outline-none mb-4 box-border" style={inputStyle} autoFocus onKeyDown={(e) => e.key === "Enter" && createProject()} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewProj(false)} className="px-4 py-2 rounded-lg border-none text-xs cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted }}>Cancel</button>
              <button onClick={createProject} className="px-4 py-2 rounded-lg border-none text-xs font-bold cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Import */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowImport(false); setImportTasks(null); setImportMode("manual"); setImportError(null); setImportFileMeta(null); }}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl p-5 w-full max-w-2xl max-h-[85vh] overflow-auto modal-enter" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} style={{ color: theme.accent }} />
              <div className="font-bold" style={{ fontSize: 14 }}>Import Tasks</div>
              <span className="ml-auto" style={{ fontSize: 11, color: theme.textMuted }}>{importTasks ? importTasks.filter(t => t.include).length + " tasks" : ""}</span>
            </div>

            {importError && <div className="mb-3 p-2.5 rounded-lg text-xs" style={{ background: "#ef444415", border: "1px solid #ef444430", color: "#ef4444" }}>{importError}</div>}

            <div className="flex gap-1.5 mb-4">
              <button onClick={() => setImportMode("manual")} className="flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold border-none cursor-pointer" style={{ background: importMode === "manual" ? theme.bgHover : "transparent", color: importMode === "manual" ? theme.text : theme.textDim }}>Manual Import</button>
              <button onClick={() => { if (importMode !== "ai") handleAiParse(); }} className="flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold border-none cursor-pointer flex items-center justify-center gap-1.5" style={{ background: importMode === "ai" ? theme.accentBg : "transparent", color: importMode === "ai" ? theme.accent : theme.textDim }}>
                {aiParsing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} AI Parse
              </button>
            </div>

            {aiParsing ? (
              <div className="py-10 text-center">
                <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: theme.accent }} />
                <div style={{ fontSize: 12, color: theme.textMuted }}>AI is analyzing your document...</div>
              </div>
            ) : importTasks?.length ? (
              <div>
                {/* Bulk assign controls */}
                <div className="flex gap-2 mb-3 flex-wrap items-center">
                  <span style={{ fontSize: 10, fontWeight: 600, color: theme.textDim }}>Set all:</span>
                  <select onChange={(e) => { if (e.target.value) { setAllImportSection(e.target.value); e.target.selectedIndex = 0; } }} defaultValue="" className="p-1.5 text-[10px] rounded-lg outline-none cursor-pointer" style={inputStyle}>
                    <option value="" disabled>Section...</option>
                    {d.sections.map((s) => <option key={s.id} value={importMode === "ai" ? s.title : s.id}>{s.title}</option>)}
                  </select>
                  {OWNERS.map((o) => <button key={o} onClick={() => setAllImportOwner(o)} className="px-2 py-1 rounded-md text-[10px] font-bold border-none cursor-pointer" style={{ background: OWNER_COLORS[o], color: "#000" }}>{o}</button>)}
                </div>

                {importMode === "ai" && (
                  <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8 }}>AI organized {importTasks.filter(t => t.include).length} tasks into {[...new Set(importTasks.map(t => t.section))].length} sections.</div>
                )}

                <div className="max-h-96 overflow-y-auto mb-4 rounded-lg" style={{ border: `1px solid ${theme.border}` }}>
                  {importTasks.map((t) => (
                    <div key={t._id} style={{ padding: "8px 10px", borderBottom: `1px solid ${theme.border}`, opacity: t.include ? 1 : 0.3 }}>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" checked={t.include} onChange={() => updateImportTask(t._id, "include", !t.include)} className="mt-1 cursor-pointer" />
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 11, color: theme.text, lineHeight: 1.5 }}>{t.text}</div>
                          <div className="flex gap-1 mt-1 items-center flex-wrap">
                            <select value={t.section || ""} onChange={(e) => updateImportTask(t._id, "section", e.target.value)} className="px-1 py-0.5 rounded text-[10px] outline-none cursor-pointer" style={{ ...inputStyle, borderColor: !t.section ? "#f59e0b" : theme.border }}>
                              <option value="">Section...</option>
                              {d.sections.map((s) => <option key={s.id} value={importMode === "ai" ? s.title : s.id}>{s.title}</option>)}
                              {importMode === "ai" && t.section && !d.sections.find(s => s.title.toLowerCase() === t.section.toLowerCase()) && (
                                <option value={t.section}>{t.section} (new)</option>
                              )}
                            </select>
                            <select value={t.owner} onChange={(e) => updateImportTask(t._id, "owner", e.target.value)} className="px-1 py-0.5 rounded text-[10px] outline-none cursor-pointer" style={inputStyle}>{OWNERS.map((o) => <option key={o}>{o}</option>)}</select>
                            <select value={t.p} onChange={(e) => updateImportTask(t._id, "p", e.target.value)} className="px-1 py-0.5 rounded text-[10px] outline-none cursor-pointer" style={inputStyle}><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option></select>
                            <button onClick={() => removeImportTask(t._id)} className="ml-auto bg-transparent border-none cursor-pointer"><Trash2 size={11} color="#ef4444" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end items-center">
                  {importTasks.filter(t => t.include && !t.section).length > 0 && (
                    <span style={{ fontSize: 10, color: "#f59e0b", marginRight: "auto" }}>⚠ {importTasks.filter(t => t.include && !t.section).length} task(s) need a section</span>
                  )}
                  <button onClick={() => { setShowImport(false); setImportTasks(null); setImportError(null); setImportFileMeta(null); }} className="px-4 py-2 rounded-lg border-none text-xs cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted }}>Cancel</button>
                  <button onClick={doImport} disabled={importTasks.filter(t => t.include).some(t => !t.section)} className="px-4 py-2 rounded-lg border-none text-xs font-bold cursor-pointer" style={{ background: importTasks.filter(t => t.include).every(t => t.section) ? theme.accent : theme.bgHover, color: importTasks.filter(t => t.include).every(t => t.section) ? "#fff" : theme.textDim, opacity: importTasks.filter(t => t.include).some(t => !t.section) ? 0.6 : 1 }}>Import {importTasks.filter(t => t.include).length} Tasks</button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center" style={{ fontSize: 12, color: theme.textDim }}>No tasks found in document</div>
            )}

            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.border}`, fontSize: 10, color: theme.textDim }}>
              Supports: .csv, .txt, .docx (Word), .xlsx (Excel)
              {aiUsage && <span style={{ color: theme.accent, marginLeft: 8 }}>AI used {aiUsage.input_tokens + aiUsage.output_tokens} tokens (~${((aiUsage.input_tokens * 0.8 + aiUsage.output_tokens * 4) / 1000000).toFixed(4)})</span>}
            </div>
          </div>
        </div>
      )}
      <Toasts />
    </div>
  );
}
