import { useState, useEffect, useRef } from "react";
import {
  Loader2, FileText, Sparkles, Trash2
} from "lucide-react";
import { DEFAULT_SECTIONS, OWNERS, OWNER_COLORS } from "./data";
import { useStore } from "./useStore";
import { extractText, aiParseTasks } from "./docParser";
import { useTheme } from "./ThemeContext";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import TaskList from "./components/TaskList";
import FocusView from "./components/FocusView";
import KanbanBoard from "./components/KanbanBoard";
import BurndownChart from "./components/BurndownChart";
import SettingsPage from "./components/SettingsPage";
import DocumentHub from "./components/DocumentHub";

const uid = () => "t" + Date.now() + Math.random().toString(36).slice(2, 6);

export default function App() {
  const store = useStore();
  const { theme } = useTheme();

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
  const [importSec, setImportSec] = useState("");
  const [importMode, setImportMode] = useState("manual");
  const [importError, setImportError] = useState(null);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiUsage, setAiUsage] = useState(null);

  // Project creation
  const [showNewProj, setShowNewProj] = useState(false);
  const [newProjName, setNewProjName] = useState("");

  // Edit modal
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editPrio, setEditPrio] = useState("");

  const fileRef = useRef(null);
  const sectionRefs = useRef({});

  // ── Init ──
  useEffect(() => {
    if (!store.projects) {
      const id = uid();
      store.setProjects([{ id, name: "Pre-Sales Checklist" }]);
      store.setActiveId(id);
      store.saveData({ sections: DEFAULT_SECTIONS, checks: {}, notes: {}, statuses: {}, log: [] }, id);
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

  // ── Core Actions ──
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

  const goToSection = (secId) => {
    setOpened((prev) => ({ ...prev, [secId]: true }));
    setView("list");
    setScrollTarget(secId);
  };

  const saveEdit = () => {
    if (!editId) return;
    save({ ...d, sections: d.sections.map((s) => ({ ...s, items: s.items.map((i) => i.id === editId ? { ...i, text: editText, owner: editOwner, p: editPrio } : i) })) });
    setEditId(null);
  };

  const editHandlers = {
    start: (item) => { setEditId(item.id); setEditText(item.text); setEditOwner(item.owner); setEditPrio(item.p); },
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

  const doImport = () => {
    if (!importTasks?.length) return;
    const tasks = importTasks.filter((t) => t.include && t.text.trim());
    if (importMode === "ai") {
      const map = {};
      tasks.forEach((t) => { const s = t.section || "Imported"; if (!map[s]) map[s] = []; map[s].push({ id: uid(), text: t.text, owner: t.owner, p: t.p }); });
      let secs = [...d.sections];
      Object.entries(map).forEach(([name, items]) => {
        const existing = secs.find((s) => s.title.toLowerCase() === name.toLowerCase());
        if (existing) secs = secs.map((s) => s.id === existing.id ? { ...s, items: [...s.items, ...items] } : s);
        else secs.push({ id: uid(), title: name, due: "2026-03-28", items });
      });
      save({ ...d, sections: secs });
    } else {
      if (!importSec) return;
      const items = tasks.map((t) => ({ id: uid(), text: t.text, owner: t.owner, p: t.p }));
      save({ ...d, sections: d.sections.map((s) => s.id === importSec ? { ...s, items: [...s.items, ...items] } : s) });
    }
    setShowImport(false); setImportTasks(null); setImportMode("manual");
  };

  const triggerUpload = () => fileRef.current?.click();
  const sidebarWidth = isDesktop ? (sidebarCollapsed ? 56 : 200) : 0;

  const inputStyle = { background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text };

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

        <div className="max-w-4xl mx-auto p-4 sm:p-5">
          {view === "dash" && <Dashboard d={d} allItems={allItems} total={total} doneCount={doneCount} pct={pct} secStats={secStats} goToSection={goToSection} onSetup={() => setView("settings")} onUpload={triggerUpload} />}
          {view === "list" && <TaskList d={d} save={save} secStats={secStats} sectionRefs={sectionRefs} opened={opened} setOpened={setOpened} selected={selected} setSelected={setSelected} toggleCheck={toggleCheck} setItemStatus={setItemStatus} getStatus={getStatus} editHandlers={editHandlers} />}
          {view === "focus" && <FocusView d={d} allItems={allItems} focusPerson={focusPerson} setFocusPerson={setFocusPerson} toggleCheck={toggleCheck} setItemStatus={setItemStatus} getStatus={getStatus} selected={selected} setSelected={setSelected} editHandlers={editHandlers} />}
          {view === "kanban" && <KanbanBoard allItems={allItems} d={d} getStatus={getStatus} setItemStatus={setItemStatus} />}
          {view === "docs" && <DocumentHub onUpload={triggerUpload} />}
          {view === "burndown" && <BurndownChart d={d} total={total} doneCount={doneCount} />}
          {view === "settings" && <SettingsPage d={d} save={save} store={store} onUpload={triggerUpload} onClearProject={clearProject} />}
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Edit Task */}
      {editId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl p-5 w-full max-w-sm" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div className="font-bold mb-3" style={{ fontSize: 14 }}>Edit Task</div>
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className="w-full p-2 text-xs mb-3 rounded-lg outline-none resize-y box-border" style={inputStyle} />
            <div className="flex gap-2 mb-4">
              <select value={editOwner} onChange={(e) => setEditOwner(e.target.value)} className="flex-1 p-2 text-xs rounded-lg outline-none cursor-pointer" style={inputStyle}>{OWNERS.map((o) => <option key={o}>{o}</option>)}</select>
              <select value={editPrio} onChange={(e) => setEditPrio(e.target.value)} className="flex-1 p-2 text-xs rounded-lg outline-none cursor-pointer" style={inputStyle}><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option></select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-lg border-none text-xs cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted }}>Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 rounded-lg border-none text-xs font-bold cursor-pointer" style={{ background: theme.accent, color: "#fff" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* New Project */}
      {showNewProj && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowNewProj(false)}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl p-5 w-full max-w-sm" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowImport(false); setImportTasks(null); setImportMode("manual"); setImportError(null); }}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl p-5 w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
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
                {importMode === "manual" ? (
                  <div className="flex gap-2 mb-3 flex-wrap items-center">
                    <select value={importSec} onChange={(e) => setImportSec(e.target.value)} className="flex-1 p-2 text-xs rounded-lg outline-none cursor-pointer" style={inputStyle}>
                      <option value="">Select section...</option>
                      {d.sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                    <span style={{ fontSize: 10, color: theme.textDim }}>Assign all:</span>
                    {OWNERS.map((o) => <button key={o} onClick={() => setAllImportOwner(o)} className="px-2 py-1 rounded-md text-[10px] font-bold border-none cursor-pointer" style={{ background: OWNER_COLORS[o], color: "#000" }}>{o}</button>)}
                  </div>
                ) : (
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
                            <select value={t.owner} onChange={(e) => updateImportTask(t._id, "owner", e.target.value)} className="px-1 py-0.5 rounded text-[10px] outline-none cursor-pointer" style={inputStyle}>{OWNERS.map((o) => <option key={o}>{o}</option>)}</select>
                            <select value={t.p} onChange={(e) => updateImportTask(t._id, "p", e.target.value)} className="px-1 py-0.5 rounded text-[10px] outline-none cursor-pointer" style={inputStyle}><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option></select>
                            {importMode === "ai" && t.section && <span className="px-1.5 py-0.5 rounded" style={{ fontSize: 9, background: theme.bgHover, color: theme.textMuted }}>{t.section}</span>}
                            <button onClick={() => removeImportTask(t._id)} className="ml-auto bg-transparent border-none cursor-pointer"><Trash2 size={11} color="#ef4444" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowImport(false); setImportTasks(null); setImportError(null); }} className="px-4 py-2 rounded-lg border-none text-xs cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted }}>Cancel</button>
                  <button onClick={doImport} className="px-4 py-2 rounded-lg border-none text-xs font-bold cursor-pointer" style={{ background: (importMode === "ai" || importSec) ? theme.accent : theme.bgHover, color: (importMode === "ai" || importSec) ? "#fff" : theme.textDim }}>Import {importTasks.filter(t => t.include).length} Tasks</button>
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
    </div>
  );
}
