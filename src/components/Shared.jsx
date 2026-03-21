import { useTheme } from "../ThemeContext";

export function ProgressBar({ value, height = 6 }) {
  const { theme } = useTheme();
  const color = value === 100 ? "#22c55e" : value > 60 ? theme.accent : "#f59e0b";
  return (
    <div style={{ width: "100%", height, background: theme.border, borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: height / 2, transition: "width 0.5s ease" }} />
    </div>
  );
}

export function Badge({ text, color }) {
  return (
    <span
      className="inline-block px-1.5 rounded font-bold text-white"
      style={{ background: color, fontSize: 10, lineHeight: "18px" }}
    >
      {text}
    </span>
  );
}

export function ProgressRing({ value, size = 56, stroke = 5, color }) {
  const { theme } = useTheme();
  const c = color || (value === 100 ? "#22c55e" : value > 60 ? theme.accent : "#f59e0b");
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.border} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={c} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}
