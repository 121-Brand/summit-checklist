// Dynamic team members pulled from project context
const DEFAULT_OWNERS = ["You", "Spencer", "Chase", "Levi"];
const DEFAULT_COLORS = { You: "#f59e0b", Spencer: "#818cf8", Chase: "#22d3ee", Levi: "#34d399" };

// Auto-generate colors for any team member name
const COLOR_POOL = [
  "#f59e0b", "#818cf8", "#22d3ee", "#34d399", "#ec4899",
  "#f97316", "#84cc16", "#6366f1", "#14b8a6", "#e879f9",
  "#fb923c", "#38bdf8", "#a3e635", "#c084fc", "#2dd4bf",
];

function nameToColor(name, idx) {
  if (DEFAULT_COLORS[name]) return DEFAULT_COLORS[name];
  // Deterministic color from name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLOR_POOL[Math.abs(hash + idx) % COLOR_POOL.length];
}

export function getOwners(d) {
  const team = d?.context?.team;
  if (team && team.length > 0) {
    return team.map(m => m.name).filter(n => n.trim());
  }
  return DEFAULT_OWNERS;
}

export function getOwnerColors(d) {
  const owners = getOwners(d);
  const colors = {};
  owners.forEach((name, i) => { colors[name] = nameToColor(name, i); });
  return colors;
}

export function getTaskDue(item, sectionDue) {
  return item.due || sectionDue;
}

export const PRIORITY_COLORS = {
  CRITICAL: "#ef4444",
  HIGH: "#f59e0b",
  MEDIUM: "#22c55e",
};

export const STATUS_COLORS = {
  "Not Started": "#64748b",
  "In Progress": "#f59e0b",
  Done: "#22c55e",
};
