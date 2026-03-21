import { useState } from "react";
import {
  FileText, Upload, Sparkles, Trash2, ChevronDown, ChevronRight,
  FileSpreadsheet, FileType, File, Clock, Hash, Eye, EyeOff
} from "lucide-react";
import { useTheme } from "../ThemeContext";

const FILE_ICONS = {
  docx: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileType,
  tsv: FileType,
  txt: File,
};

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DocumentHub({ d, save, onUpload }) {
  const { theme } = useTheme();
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const documents = (d.documents || []).slice().sort((a, b) => b.uploadedAt - a.uploadedAt);

  const deleteDoc = (docId) => {
    save({ ...d, documents: (d.documents || []).filter((doc) => doc.id !== docId) });
    setConfirmDelete(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Documents
          </div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>
            {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded
          </div>
        </div>
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-none cursor-pointer font-bold transition-all"
          style={{ fontSize: 12, background: theme.accent, color: "#fff" }}
        >
          <Upload size={14} /> Upload Document
        </button>
      </div>

      {documents.length === 0 ? (
        /* Empty state */
        <div className="py-16 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: theme.accentBg, border: `1px solid ${theme.accent}30` }}
          >
            <FileText size={28} style={{ color: theme.accent }} />
          </div>
          <div className="text-lg font-bold mb-2" style={{ color: theme.text }}>
            No documents yet
          </div>
          <div className="max-w-md mx-auto mb-6" style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.6 }}>
            Upload a document to import tasks. Supported formats: Word (.docx), Excel (.xlsx), CSV, and plain text. Each upload is tracked here with its extracted task count.
          </div>
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-none cursor-pointer font-bold mx-auto"
            style={{ fontSize: 12, background: theme.accent, color: "#fff" }}
          >
            <Upload size={14} /> Upload Your First Document
          </button>

          {/* Feature preview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mt-10">
            {[
              { icon: "📄", title: "Upload & Track", desc: "See all uploaded files with metadata" },
              { icon: "🔍", title: "AI Scanner", desc: "Upload proof, AI marks matching tasks done" },
              { icon: "📎", title: "Attach to Tasks", desc: "Link documents to completed tasks" },
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
        /* Document list */
        <div className="space-y-2">
          {documents.map((doc) => {
            const Icon = FILE_ICONS[doc.type] || FileText;
            const isExpanded = expandedId === doc.id;
            return (
              <div
                key={doc.id}
                className="rounded-xl overflow-hidden"
                style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
              >
                {/* Document header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* File icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: theme.accentBg }}
                  >
                    <Icon size={18} style={{ color: theme.accent }} />
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate" style={{ fontSize: 13, color: theme.text }}>
                      {doc.name}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1" style={{ fontSize: 10, color: theme.textDim }}>
                        <Clock size={10} /> {timeAgo(doc.uploadedAt)}
                      </span>
                      <span style={{ fontSize: 10, color: theme.textDim }}>
                        {formatBytes(doc.size)}
                      </span>
                      <span className="flex items-center gap-1" style={{ fontSize: 10, color: theme.accent }}>
                        <Hash size={10} /> {doc.taskCount} task{doc.taskCount !== 1 ? "s" : ""} extracted
                      </span>
                      {doc.parseMode === "ai" && (
                        <span className="flex items-center gap-1 px-1.5 rounded-full" style={{ fontSize: 9, background: theme.accentBg, color: theme.accent }}>
                          <Sparkles size={9} /> AI Parsed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg border cursor-pointer transition-colors"
                      style={{
                        fontSize: 10, fontWeight: 600,
                        background: isExpanded ? theme.accentBg : "transparent",
                        borderColor: isExpanded ? theme.accent + "40" : theme.border,
                        color: isExpanded ? theme.accent : theme.textMuted,
                      }}
                    >
                      {isExpanded ? <EyeOff size={11} /> : <Eye size={11} />}
                      {isExpanded ? "Hide" : "Preview"}
                    </button>
                    {confirmDelete === doc.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteDoc(doc.id)}
                          className="px-2 py-1.5 rounded-lg border-none text-xs font-bold cursor-pointer"
                          style={{ background: "#ef4444", color: "#fff", fontSize: 10 }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1.5 rounded-lg border-none text-xs cursor-pointer"
                          style={{ background: theme.bgHover, color: theme.textMuted, fontSize: 10 }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(doc.id)}
                        className="p-1.5 rounded-lg border cursor-pointer"
                        style={{ background: "transparent", borderColor: theme.border, color: theme.textDim }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded text preview */}
                {isExpanded && doc.extractedText && (
                  <div style={{ borderTop: `1px solid ${theme.border}` }}>
                    <div className="px-4 py-1.5 flex items-center justify-between" style={{ background: theme.bg }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Extracted Content
                      </span>
                      <span style={{ fontSize: 10, color: theme.textDim }}>
                        {doc.extractedText.split("\n").length} lines
                      </span>
                    </div>
                    <div
                      className="px-4 py-3 overflow-y-auto"
                      style={{
                        maxHeight: 240,
                        background: theme.bg,
                        fontSize: 11,
                        color: theme.textMuted,
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        fontFamily: "monospace",
                      }}
                    >
                      {doc.extractedText}
                    </div>
                  </div>
                )}

                {/* Uploaded date footer */}
                <div className="px-4 py-1.5" style={{ borderTop: `1px solid ${theme.border}`, background: theme.bg }}>
                  <span style={{ fontSize: 10, color: theme.textDim }}>
                    Uploaded {formatDate(doc.uploadedAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
