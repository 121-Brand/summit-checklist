import { useState } from "react";
import { Share2, Copy, Check, Link, Users, Loader2, RefreshCw, Globe, Lock, X } from "lucide-react";
import { useTheme } from "../ThemeContext";

export default function ShareInvite({ d, save, store }) {
  const { theme } = useTheme();
  const [sharing, setSharing] = useState(false);
  const [shareLink, setShareLink] = useState(d.shareId ? window.location.origin + "?share=" + d.shareId : null);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [canEdit, setCanEdit] = useState(d.sharePermissions?.canEdit ?? true);

  const createShare = async () => {
    setSharing(true); setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", data: d, permissions: { canEdit } })
      });
      const json = await res.json();
      if (json.shareId) {
        const link = window.location.origin + "?share=" + json.shareId;
        setShareLink(link);
        save({ ...d, shareId: json.shareId, sharePermissions: { canEdit } });
      } else {
        setError(json.error || "Failed to create share link");
      }
    } catch (e) { setError("Failed: " + e.message); }
    setSharing(false);
  };

  const updateShare = async () => {
    if (!d.shareId) return;
    setSyncing(true); setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", shareId: d.shareId, data: d, permissions: { canEdit } })
      });
      const json = await res.json();
      if (!json.shareId) setError(json.error || "Failed to sync");
    } catch (e) { setError("Sync failed: " + e.message); }
    setSyncing(false);
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
  };

  const revokeShare = () => {
    save({ ...d, shareId: null, sharePermissions: null });
    setShareLink(null);
  };

  const inputStyle = { background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text };

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        Share & Invite
      </div>
      <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 20 }}>
        Share your project with teammates via a link. Anyone with the link can view (and optionally edit) the project.
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: "#ef444412", border: "1px solid #ef444430" }}>
          <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto bg-transparent border-none cursor-pointer"><X size={14} color="#ef4444" /></button>
        </div>
      )}

      {/* Share status card */}
      <div className="rounded-xl p-5 mb-6" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
        {shareLink ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#22c55e18" }}>
                <Globe size={16} style={{ color: "#22c55e" }} />
              </div>
              <div>
                <div className="font-bold" style={{ fontSize: 13, color: theme.text }}>Project is shared</div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>Anyone with the link can {canEdit ? "view and edit" : "view"}</div>
              </div>
            </div>

            {/* Link display */}
            <div className="flex gap-2 mb-4">
              <input value={shareLink} readOnly className="flex-1 px-3 py-2 text-xs rounded-lg outline-none font-mono" style={inputStyle} />
              <button onClick={copyLink} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-none cursor-pointer font-semibold" style={{ fontSize: 12, background: copied ? "#22c55e" : theme.accent, color: "#fff" }}>
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>

            {/* Permission toggle */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>Permissions:</span>
              <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <button onClick={() => setCanEdit(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-md border-none cursor-pointer" style={{ fontSize: 11, fontWeight: 600, background: canEdit ? theme.accent : "transparent", color: canEdit ? "#fff" : theme.textDim }}>
                  <Users size={11} /> Can Edit
                </button>
                <button onClick={() => setCanEdit(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-md border-none cursor-pointer" style={{ fontSize: 11, fontWeight: 600, background: !canEdit ? theme.accent : "transparent", color: !canEdit ? "#fff" : theme.textDim }}>
                  <Lock size={11} /> View Only
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={updateShare} disabled={syncing} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-none cursor-pointer font-semibold" style={{ fontSize: 12, background: theme.accent, color: "#fff", opacity: syncing ? 0.6 : 1 }}>
                {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {syncing ? "Syncing..." : "Sync Latest Changes"}
              </button>
              <button onClick={revokeShare} className="px-4 py-2.5 rounded-lg border cursor-pointer font-semibold" style={{ fontSize: 12, background: "transparent", borderColor: "#ef444440", color: "#ef4444" }}>
                Revoke
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: theme.accentBg, border: `1px solid ${theme.accent}30` }}>
              <Share2 size={24} style={{ color: theme.accent }} />
            </div>
            <div className="text-lg font-bold mb-2" style={{ color: theme.text }}>Share this project</div>
            <div className="max-w-sm mx-auto mb-6" style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.6 }}>
              Generate a link that anyone can use to view or edit your project. Changes can be synced back.
            </div>

            {/* Permission choice */}
            <div className="flex gap-3 justify-center mb-6">
              <button onClick={() => setCanEdit(true)} className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer" style={{ background: canEdit ? theme.accentBg : theme.bg, border: `2px solid ${canEdit ? theme.accent : theme.border}`, color: canEdit ? theme.accent : theme.textMuted }}>
                <Users size={16} /> <div className="text-left"><div className="font-bold" style={{ fontSize: 12 }}>Can Edit</div><div style={{ fontSize: 10 }}>Full access to modify</div></div>
              </button>
              <button onClick={() => setCanEdit(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer" style={{ background: !canEdit ? theme.accentBg : theme.bg, border: `2px solid ${!canEdit ? theme.accent : theme.border}`, color: !canEdit ? theme.accent : theme.textMuted }}>
                <Lock size={16} /> <div className="text-left"><div className="font-bold" style={{ fontSize: 12 }}>View Only</div><div style={{ fontSize: 10 }}>Read-only access</div></div>
              </button>
            </div>

            <button onClick={createShare} disabled={sharing} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-none cursor-pointer font-bold mx-auto" style={{ fontSize: 13, background: theme.accent, color: "#fff", opacity: sharing ? 0.6 : 1 }}>
              {sharing ? <Loader2 size={16} className="animate-spin" /> : <Link size={16} />}
              {sharing ? "Generating..." : "Generate Share Link"}
            </button>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { n: "1", title: "Generate Link", desc: "Create a unique URL for your project" },
          { n: "2", title: "Share with Team", desc: "Send the link to anyone you want to collaborate with" },
          { n: "3", title: "Sync Changes", desc: "Hit sync to push your latest updates to the shared link" },
        ].map((s) => (
          <div key={s.n} className="p-3 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-extrabold mb-2" style={{ fontSize: 11, background: theme.accentBg, color: theme.accent }}>{s.n}</div>
            <div className="font-bold mb-0.5" style={{ fontSize: 12, color: theme.text }}>{s.title}</div>
            <div style={{ fontSize: 10, color: theme.textDim, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
