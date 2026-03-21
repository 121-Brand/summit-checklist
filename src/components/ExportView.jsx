import { useState } from "react";
import { Download, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { OWNER_COLORS, PRIORITY_COLORS } from "../data";

export default function ExportView({ d, allItems, total, doneCount, pct }) {
  const { theme } = useTheme();
  const [exporting, setExporting] = useState(null);

  const exportCSV = () => {
    setExporting("csv");
    const headers = ["Task", "Owner", "Priority", "Status", "Section", "Due"];
    const rows = allItems.map(it => [
      '"' + it.text.replace(/"/g, '""') + '"',
      it.owner,
      it.p,
      d.checks[it.id] ? "Done" : (d.statuses?.[it.id] || "Not Started"),
      it.sectionTitle,
      it.due,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "summit-export.csv"; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(null), 1000);
  };

  const exportJSON = () => {
    setExporting("json");
    const data = {
      exportDate: new Date().toISOString(),
      project: { progress: pct, total, done: doneCount },
      sections: d.sections.map(s => ({
        title: s.title, due: s.due,
        items: s.items.map(it => ({
          text: it.text, owner: it.owner, priority: it.p,
          status: d.checks[it.id] ? "Done" : (d.statuses?.[it.id] || "Not Started"),
          notes: d.notes?.[it.id] || null,
        }))
      })),
      context: d.context || {},
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "summit-export.json"; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(null), 1000);
  };

  const printView = () => {
    setExporting("print");
    const w = window.open("", "_blank");
    const sections = d.sections.map(s => {
      const done = s.items.filter(i => d.checks[i.id]).length;
      const items = s.items.map(i => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #eee">
          <span style="font-size:16px">${d.checks[i.id] ? "☑" : "☐"}</span>
          <div style="flex:1">
            <div style="font-size:12px;${d.checks[i.id] ? "text-decoration:line-through;color:#999" : ""}">${i.text}</div>
            <div style="font-size:10px;color:#888;margin-top:2px">${i.owner} · ${i.p}${d.notes?.[i.id] ? " · Note: " + d.notes[i.id] : ""}</div>
          </div>
        </div>
      `).join("");
      return `
        <div style="margin-bottom:24px;break-inside:avoid">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #333">
            <h3 style="margin:0;font-size:14px">${s.title}</h3>
            <span style="font-size:11px;color:#666">${done}/${s.items.length} · Due ${s.due}</span>
          </div>
          ${items}
        </div>
      `;
    }).join("");

    w.document.write(`<!DOCTYPE html><html><head><title>Summit — Print</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:40px auto;color:#1a1a1a;padding:0 24px}
      @media print{body{margin:0}}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:16px;border-bottom:3px solid #000">
        <div><h1 style="margin:0;font-size:22px;letter-spacing:-0.02em">SUMMIT CHECKLIST</h1>
        <div style="color:#666;font-size:12px;margin-top:4px">${d.context?.goal || "Project Checklist"}</div></div>
        <div style="text-align:right"><div style="font-size:28px;font-weight:800">${pct}%</div>
        <div style="font-size:11px;color:#666">${doneCount}/${total} tasks</div></div>
      </div>
      ${sections}
      <div style="margin-top:32px;padding-top:12px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center">
        Exported from Summit · ${new Date().toLocaleDateString()}
      </div></body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); setExporting(null); }, 500);
  };

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Export & Print
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { id: "csv", icon: FileSpreadsheet, title: "Export CSV", desc: "Spreadsheet-ready format with all tasks, owners, statuses", action: exportCSV, color: "#22c55e" },
          { id: "json", icon: FileText, title: "Export JSON", desc: "Full project backup including context, notes, and history", action: exportJSON, color: theme.accent },
          { id: "print", icon: Printer, title: "Print View", desc: "Clean printable checklist — opens in a new tab ready to print", action: printView, color: "#f59e0b" },
        ].map(opt => {
          const Icon = opt.icon;
          return (
            <button key={opt.id} onClick={opt.action} disabled={exporting === opt.id}
              className="p-5 rounded-xl text-left cursor-pointer transition-all"
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, opacity: exporting === opt.id ? 0.6 : 1 }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: opt.color + "18" }}>
                {exporting === opt.id ? <Download size={18} className="animate-bounce" style={{ color: opt.color }} /> : <Icon size={18} style={{ color: opt.color }} />}
              </div>
              <div className="font-bold mb-1" style={{ fontSize: 14, color: theme.text }}>{opt.title}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.5 }}>{opt.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Quick summary */}
      <div className="rounded-xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
        <div className="font-bold mb-3" style={{ fontSize: 12, color: theme.text }}>Export Preview</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Sections", v: d.sections.length },
            { l: "Total Tasks", v: total },
            { l: "Completed", v: doneCount },
            { l: "Documents", v: (d.documents || []).length },
          ].map((s, i) => (
            <div key={i} className="p-2 rounded-lg text-center" style={{ background: theme.bg }}>
              <div style={{ fontSize: 9, color: theme.textDim, fontWeight: 700, textTransform: "uppercase" }}>{s.l}</div>
              <div className="font-extrabold" style={{ fontSize: 18, color: theme.accent }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
