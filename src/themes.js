// Theme definitions - each team member can pick their own
export const THEMES = {
  midnight: {
    name: "Midnight",
    description: "Dark blue — the default",
    bg: "#0f172a",
    bgCard: "#1e293b",
    bgHover: "#1e293b80",
    border: "#334155",
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    textDim: "#64748b",
    accent: "#06b6d4",
    accentBg: "rgba(6,182,212,0.1)",
    sidebar: "#0c1222",
    sidebarBorder: "#1e293b",
    headerBg: "rgba(15,23,42,0.95)",
  },
  obsidian: {
    name: "Obsidian",
    description: "Pure dark — easy on the eyes",
    bg: "#0a0a0a",
    bgCard: "#141414",
    bgHover: "#1a1a1a",
    border: "#262626",
    text: "#e5e5e5",
    textMuted: "#a3a3a3",
    textDim: "#525252",
    accent: "#a78bfa",
    accentBg: "rgba(167,139,250,0.1)",
    sidebar: "#0a0a0a",
    sidebarBorder: "#1a1a1a",
    headerBg: "rgba(10,10,10,0.95)",
  },
  ocean: {
    name: "Ocean",
    description: "Deep blue teal vibes",
    bg: "#042f2e",
    bgCard: "#083344",
    bgHover: "#0e4a5a",
    border: "#155e75",
    text: "#e0f2fe",
    textMuted: "#7dd3fc",
    textDim: "#0369a1",
    accent: "#22d3ee",
    accentBg: "rgba(34,211,238,0.1)",
    sidebar: "#022c22",
    sidebarBorder: "#064e3b",
    headerBg: "rgba(4,47,46,0.95)",
  },
  light: {
    name: "Light",
    description: "Clean white — for daytime",
    bg: "#f8fafc",
    bgCard: "#ffffff",
    bgHover: "#f1f5f9",
    border: "#e2e8f0",
    text: "#1e293b",
    textMuted: "#64748b",
    textDim: "#94a3b8",
    accent: "#0891b2",
    accentBg: "rgba(8,145,178,0.1)",
    sidebar: "#ffffff",
    sidebarBorder: "#e2e8f0",
    headerBg: "rgba(248,250,252,0.95)",
  },
  ember: {
    name: "Ember",
    description: "Warm dark — orange accents",
    bg: "#1c1210",
    bgCard: "#292018",
    bgHover: "#362a1e",
    border: "#44352a",
    text: "#fef3c7",
    textMuted: "#d6a06b",
    textDim: "#78553a",
    accent: "#f59e0b",
    accentBg: "rgba(245,158,11,0.1)",
    sidebar: "#161010",
    sidebarBorder: "#2a1f18",
    headerBg: "rgba(28,18,16,0.95)",
  },
};

export function getTheme(id) {
  return THEMES[id] || THEMES.midnight;
}

export function loadThemePreference() {
  try {
    return localStorage.getItem("summit-theme") || "midnight";
  } catch(e) {
    return "midnight";
  }
}

export function saveThemePreference(id) {
  try {
    localStorage.setItem("summit-theme", id);
  } catch(e) {}
}
