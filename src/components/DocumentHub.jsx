import { useState, useRef } from "react";
import {
  FileText, Upload, Sparkles, Trash2,
  FileSpreadsheet, FileType, File, Clock, Hash, Eye, EyeOff,
  Loader2, CheckCircle2, X
} from "lucide-react";
import { useTheme } from "../ThemeContext";
import { extractText } from "../docParser";

const FILE_ICONS = { docx: FileText, xlsx: FileSpreadsheet, xls: FileSpreadsheet, csv: FileType, tsv: FileType, txt: File };
const formatBytes = (b) => !b ? "—" : b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
const formatDate = (ts) => !ts ? "—" : new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " + new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const timeAgo = (ts) => { if (!ts) return ""; const m = Math.floor((Date.now() - ts) / 60000); if (m < 1) return "just now"; if (m < 60) return m + "m ago"; const h = Math.floor(m / 60); if (h < 24) return h + "h ago"; return Math.floor(h / 24) + "d ago"; };

export default function DocumentHub({ d, save, onUpload }) {
  const { theme } = useTheme();
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [scanError, setScanError] = useState(null);
  const scanFileRef = useRef(null);

  const documents = (d.documents || []).slice().sort((a, b) => b.uploadedAt - a.uploadedAt);

  const deleteDoc = (docId) => { save({ ...d, documents: (d.documents || []).filter((doc) => doc.id !== docId) }); setConfirmDelete(null); };

  // AI Completion Scanner
  const handleScanFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setScanning(true); setScanResults(null); setScanError(null);
    try {
      const result = await extractText(f);
      const docText = result.lines.join("\n");

      // Get all unchecked tasks
      const openTasks = [];
      d.sections.forEach((s) => s.items.forEach((it) => {
        if (!d.checks[it.id]) openTasks.push({ id: it.id, text: it.text, section: s.title });
      }));

      if (openTasks.length === 0) { setScanError("No open tasks to match against."); setScanning(false); return; }

      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "completion_scan",
          data: { docText: docText.slice(0, 12000), tasks: openTasks.slice(0, 80) }
        })
      });
      const json = await res.json();
      if (json.result?.matches) {
        setScanResults({ fileName: f.name, matches: json.result.matches, summary: json.result.summary || "" });
      } else {
        setScanError("AI couldn't find matching tasks. " + (json.error || ""));
      }
    } catch (err) {
      setScanError("Scan failed: " + err.message);
    }
    setScanning(false);
    if (scanFileRef.current) scanFileRef.current.value = "";
  };

  const applyMatches = () => {
    if (!scanResults?.matches?.length) return;
    const allItems = [];
    d.sections.forEach((s) => s.items.forEach((it) => allItems.push(it)));
    const nc = { ...d.checks };
    const ns = { ...d.statuses };
    const lg = [...(d.log || [])];
    scanResults.matches.forEach((m) => {
      const task = allItems.find((t) => t.id === m.taskId);
      if (task && !nc[task.id]) {
        nc[task.id] = true;
        ns[task.id] = "Done";
        lg.push({ id: task.id, ts: Date.now() });
      }
    });
    save({ ...d, checks: nc, statuses: ns, log: lg });
    setScanResults(null);
  };

  const inputStyle = { background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text };

  return (
    <div>
      <input ref={scanFileRef} type="file" accept=".csv,.tsv,.txt,.docx,.xlsx,.xls" onChange={handleScanFile} style={{ display: "none" }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Documents</div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>{documents.length} document{documents.length !== 1 ? "s" : ""} uploaded</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scanFileRef.current?.click()}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer font-bold transition-all"
            style={{ fontSize: 12, background: theme.accentBg, borderColor: theme.accent + "30", color: theme.accent, opacity: scanning ? 0.5 : 1 }}
          >
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {scanning ? "Scanning..." : "AI Completion Scanner"}
          </button>
          <button onClick={onUpload} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-none cursor-pointer font-bold" style={{ fontSize: 12, background: theme.accent, color: "#fff" }}>
            <Upload size={14} /> Upload
          </button>
        </div>
      </div>

      {scanError && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: "#ef444415", border: "1px solid #ef444430" }}>
          <span style={{ fontSize: 12, color: "#ef4444" }}>{scanError}</span>
          <button onClick={() => setScanError(null)} className="ml-auto bg-transparent border-none cursor-pointer"><X size={14} color="#ef4444" /></button>
        </div>
      )}

      {/* Scan Results */}
      {scanResults && (
        <div className="mb-5 p-4 rounded-xl" style={{ background: theme.accentBg, border: `1px solid ${theme.accent}30` }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
            <span className="font-bold" style={{ fontSize: 13, color: theme.text }}>
              Found {scanResults.matches.length} completed task{scanResults.matches.length !== 1 ? "s" : ""} in "{scanResults.fileName}"
            </span>
            <button onClick={() => setScanResults(null)} className="ml-auto bg-transparent border-none cursor-pointer"><X size={14} style={{ color: theme.textDim }} /></button>
          </div>
          {scanResults.summary && <div className="mb-3" style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1.5 }}>{scanResults.summary}</div>}
          <div className="mb-3 rounded-lg overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
            {scanResults.matches.map((m, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: i < scanResults.matches.length - 1 ? `1px solid ${theme.border}` : "none", background: theme.bgCard }}>
                <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                <span className="flex-1" style={{ fontSize: 11, color: theme.text }}>{m.taskText || `Task #${m.taskId}`}</span>
                <span style={{ fontSize: 9, color: theme.textDim }}>{m.reason}</span>
              </div>
            ))}
          </div>
          <button onClick={applyMatches} className="w-full py-2.5 rounded-xl border-none font-bold cursor-pointer" style={{ fontSize: 12, background: "#22c55e", color: "#fff" }}>
            Mark {scanResults.matches.length} Tasks as Complete
          </button>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: theme.accentBg, border: `1px solid ${theme.accent}30` }}>
            <FileText size={28} style={{ color: theme.accent }} />
          </div>
          <div className="text-lg font-bold mb-2" style={{ color: theme.text }}>No documents yet</div>
          <div className="max-w-md mx-auto mb-6" style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.6 }}>
            Upload a document to import tasks, or use the AI Completion Scanner to upload proof of work — the AI will automatically match it against your open tasks and mark them done.
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={onUpload} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-none cursor-pointer font-bold" style={{ fontSize: 12, background: theme.accent, color: "#fff" }}>
              <Upload size={14} /> Upload Document
            </button>
            <button onClick={() => scanFileRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border cursor-pointer font-bold" style={{ fontSize: 12, background: "transparent", borderColor: theme.accent + "40", color: theme.accent }}>
              <Sparkles size={14} /> Scan for Completions
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mt-10">
            {[
              { icon: "📄", title: "Upload & Track", desc: "Every import is tracked with metadata" },
              { icon: "🤖", title: "AI Scanner", desc: "Upload proof → AI marks tasks done" },
              { icon: "👁", title: "Preview Content", desc: "See extracted text inline" },
            ].map((f, i) => (
              <div key={i} className="p-3 rounded-xl text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="font-bold mb-0.5" style={{ fontSize: 11, color: theme.text }}>{f.title}</div>
                <div style={{ fontSize: 10, color: theme.textDim }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const Icon = FILE_ICONS[doc.type] || FileText;
            const isExpanded = expandedId === doc.id;
            return (
              <div key={doc.id} className="rounded-xl overflow-hidden transition-all" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: theme.accentBg }}>
                    <Icon size={18} style={{ color: theme.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate" style={{ fontSize: 13, color: theme.text }}>{doc.name}</div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1" style={{ fontSize: 10, color: theme.textDim }}><Clock size={10} /> {timeAgo(doc.uploadedAt)}</span>
                      <span style={{ fontSize: 10, color: theme.textDim }}>{formatBytes(doc.size)}</span>
                      <span className="flex items-center gap-1" style={{ fontSize: 10, color: theme.accent }}><Hash size={10} /> {doc.taskCount} task{doc.taskCount !== 1 ? "s" : ""}</span>
                      {doc.parseMode === "ai" && <span className="flex items-center gap-1 px-1.5 rounded-full" style={{ fontSize: 9, background: theme.accentBg, color: theme.accent }}><Sparkles size={9} /> AI</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setExpandedId(isExpanded ? null : doc.id)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg border cursor-pointer" style={{ fontSize: 10, fontWeight: 600, background: isExpanded ? theme.accentBg : "transparent", borderColor: isExpanded ? theme.accent + "40" : theme.border, color: isExpanded ? theme.accent : theme.textMuted }}>
                      {isExpanded ? <EyeOff size={11} /> : <Eye size={11} />} {isExpanded ? "Hide" : "Preview"}
                    </button>
                    {confirmDelete === doc.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteDoc(doc.id)} className="px-2 py-1.5 rounded-lg border-none text-xs font-bold cursor-pointer" style={{ background: "#ef4444", color: "#fff", fontSize: 10 }}>Confirm</button>
                        <button onClick={() => setConfirmDelete(null)} className="px-2 py-1.5 rounded-lg border-none text-xs cursor-pointer" style={{ background: theme.bgHover, color: theme.textMuted, fontSize: 10 }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(doc.id)} className="p-1.5 rounded-lg border cursor-pointer" style={{ background: "transparent", borderColor: theme.border, color: theme.textDim }}><Trash2 size={12} /></button>
                    )}
                  </div>
                </div>
                {isExpanded && doc.extractedText && (
                  <div style={{ borderTop: `1px solid ${theme.border}` }}>
                    <div className="px-4 py-1.5 flex items-center justify-between" style={{ background: theme.bg }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Extracted Content</span>
                      <span style={{ fontSize: 10, color: theme.textDim }}>{doc.extractedText.split("\n").length} lines</span>
                    </div>
                    <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: 240, background: theme.bg, fontSize: 11, color: theme.textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {doc.extractedText}
                    </div>
                  </div>
                )}
                <div className="px-4 py-1.5" style={{ borderTop: `1px solid ${theme.border}`, background: theme.bg }}>
                  <span style={{ fontSize: 10, color: theme.textDim }}>Uploaded {formatDate(doc.uploadedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
