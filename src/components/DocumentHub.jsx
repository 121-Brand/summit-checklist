import { FileText, Upload, Sparkles } from "lucide-react";
import { useTheme } from "../ThemeContext";

export default function DocumentHub({ onUpload }) {
  const { theme } = useTheme();

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Documents
      </div>

      <div className="py-16 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: theme.accentBg, border: `1px solid ${theme.accent}30` }}
        >
          <FileText size={28} style={{ color: theme.accent }} />
        </div>
        <div className="text-lg font-bold mb-2" style={{ color: theme.text }}>
          Document Hub
        </div>
        <div className="max-w-md mx-auto mb-6" style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.6 }}>
          Upload documents, track what's been parsed, and attach files as proof of completion. Coming in Phase 2.
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-none cursor-pointer font-bold"
            style={{ fontSize: 12, background: theme.accent, color: "#fff" }}
          >
            <Upload size={14} /> Upload Document
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border cursor-pointer font-bold opacity-50"
            style={{ fontSize: 12, background: "transparent", borderColor: theme.border, color: theme.textMuted }}
            disabled
          >
            <Sparkles size={14} /> AI Completion Scanner
          </button>
        </div>

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
    </div>
  );
}
