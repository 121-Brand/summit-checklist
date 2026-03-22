import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle2, AlertTriangle, Info, Zap } from "lucide-react";
import { useTheme } from "../ThemeContext";

let toastIdCounter = 0;
let addToastGlobal = null;

// Call from anywhere: showToast("message") or showToast("message", "success")
export function showToast(message, type = "info") {
  if (addToastGlobal) addToastGlobal({ id: ++toastIdCounter, message, type, ts: Date.now() });
}

export default function Toasts() {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 4000);
  }, []);

  useEffect(() => { addToastGlobal = addToast; return () => { addToastGlobal = null; }; }, [addToast]);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = {
    success: { Icon: CheckCircle2, color: "#22c55e" },
    warning: { Icon: AlertTriangle, color: "#f59e0b" },
    error: { Icon: AlertTriangle, color: "#ef4444" },
    info: { Icon: Info, color: theme.accent },
    milestone: { Icon: Zap, color: "#a78bfa" },
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" style={{ maxWidth: 360 }}>
      {toasts.map(t => {
        const { Icon, color } = icons[t.type] || icons.info;
        return (
          <div key={t.id} className="flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg view-enter"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, backdropFilter: "blur(12px)" }}>
            <Icon size={16} style={{ color, shrink: 0 }} />
            <span className="flex-1" style={{ fontSize: 12, color: theme.text, fontWeight: 500 }}>{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="p-0.5 bg-transparent border-none cursor-pointer shrink-0" style={{ color: theme.textDim }}>
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
