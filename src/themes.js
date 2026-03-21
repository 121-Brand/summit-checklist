// Theme definitions
export const THEMES = {
  midnight: {
    name: "Midnight", description: "Dark blue — the default",
    bg: "#0f172a", bgCard: "#1e293b", bgHover: "#1e293b80", border: "#334155",
    text: "#e2e8f0", textMuted: "#94a3b8", textDim: "#64748b",
    accent: "#06b6d4", accentBg: "rgba(6,182,212,0.1)",
    sidebar: "#0c1222", sidebarBorder: "#1e293b", headerBg: "rgba(15,23,42,0.95)",
  },
  obsidian: {
    name: "Obsidian", description: "Pure dark — easy on the eyes",
    bg: "#0a0a0a", bgCard: "#141414", bgHover: "#1a1a1a", border: "#262626",
    text: "#e5e5e5", textMuted: "#a3a3a3", textDim: "#525252",
    accent: "#a78bfa", accentBg: "rgba(167,139,250,0.1)",
    sidebar: "#0a0a0a", sidebarBorder: "#1a1a1a", headerBg: "rgba(10,10,10,0.95)",
  },
  ocean: {
    name: "Ocean", description: "Deep teal vibes",
    bg: "#042f2e", bgCard: "#083344", bgHover: "#0e4a5a", border: "#155e75",
    text: "#e0f2fe", textMuted: "#7dd3fc", textDim: "#0369a1",
    accent: "#22d3ee", accentBg: "rgba(34,211,238,0.1)",
    sidebar: "#022c22", sidebarBorder: "#064e3b", headerBg: "rgba(4,47,46,0.95)",
  },
  light: {
    name: "Light", description: "Clean white — daytime",
    bg: "#f8fafc", bgCard: "#ffffff", bgHover: "#f1f5f9", border: "#e2e8f0",
    text: "#1e293b", textMuted: "#64748b", textDim: "#94a3b8",
    accent: "#0891b2", accentBg: "rgba(8,145,178,0.1)",
    sidebar: "#ffffff", sidebarBorder: "#e2e8f0", headerBg: "rgba(248,250,252,0.95)",
  },
  ember: {
    name: "Ember", description: "Warm dark — orange accents",
    bg: "#1c1210", bgCard: "#292018", bgHover: "#362a1e", border: "#44352a",
    text: "#fef3c7", textMuted: "#d6a06b", textDim: "#78553a",
    accent: "#f59e0b", accentBg: "rgba(245,158,11,0.1)",
    sidebar: "#161010", sidebarBorder: "#2a1f18", headerBg: "rgba(28,18,16,0.95)",
  },
  forest: {
    name: "Forest", description: "Deep green — nature",
    bg: "#0c1a0f", bgCard: "#152218", bgHover: "#1e2e22", border: "#2d4a33",
    text: "#d1fae5", textMuted: "#6ee7b7", textDim: "#34755a",
    accent: "#10b981", accentBg: "rgba(16,185,129,0.1)",
    sidebar: "#091209", sidebarBorder: "#1a2e1e", headerBg: "rgba(12,26,15,0.95)",
  },
  rose: {
    name: "Rosé", description: "Soft pink — elegant",
    bg: "#1a0f14", bgCard: "#261822", bgHover: "#33202c", border: "#4a2d3e",
    text: "#fce7f3", textMuted: "#f9a8d4", textDim: "#9d4e7a",
    accent: "#ec4899", accentBg: "rgba(236,72,153,0.1)",
    sidebar: "#140b10", sidebarBorder: "#2a1a22", headerBg: "rgba(26,15,20,0.95)",
  },
  nord: {
    name: "Nord", description: "Arctic cool — Scandinavian",
    bg: "#2e3440", bgCard: "#3b4252", bgHover: "#434c5e", border: "#4c566a",
    text: "#eceff4", textMuted: "#d8dee9", textDim: "#7b88a1",
    accent: "#88c0d0", accentBg: "rgba(136,192,208,0.1)",
    sidebar: "#272d38", sidebarBorder: "#3b4252", headerBg: "rgba(46,52,64,0.95)",
  },
  sunset: {
    name: "Sunset", description: "Warm gradient — golden hour",
    bg: "#1a1018", bgCard: "#261a24", bgHover: "#332230", border: "#4a3040",
    text: "#fef2e8", textMuted: "#e8a87c", textDim: "#8b5a3a",
    accent: "#f97316", accentBg: "rgba(249,115,22,0.1)",
    sidebar: "#14090e", sidebarBorder: "#2a1820", headerBg: "rgba(26,16,24,0.95)",
  },
  cream: {
    name: "Cream", description: "Warm white — paper feel",
    bg: "#faf8f3", bgCard: "#ffffff", bgHover: "#f3efe6", border: "#e0dac8",
    text: "#2c2416", textMuted: "#7a6f5c", textDim: "#a89e8a",
    accent: "#b8860b", accentBg: "rgba(184,134,11,0.08)",
    sidebar: "#f5f0e8", sidebarBorder: "#e0dac8", headerBg: "rgba(250,248,243,0.95)",
  },
};

// Generate theme from accent color
export function generateThemeFromAccent(accent, name = "Custom", isDark = true) {
  // Parse hex to RGB
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);
  
  if (isDark) {
    return {
      name, description: "Custom theme",
      bg: "#0d0d12", bgCard: "#16161e", bgHover: "#1e1e28", border: "#2a2a38",
      text: "#e8e8ef", textMuted: "#9898aa", textDim: "#58586a",
      accent, accentBg: `rgba(${r},${g},${b},0.1)`,
      sidebar: "#0a0a10", sidebarBorder: "#1a1a24", headerBg: "rgba(13,13,18,0.95)",
    };
  } else {
    return {
      name, description: "Custom theme",
      bg: "#f8f8fa", bgCard: "#ffffff", bgHover: "#f0f0f4", border: "#e0e0e6",
      text: "#1a1a24", textMuted: "#68687a", textDim: "#9898aa",
      accent, accentBg: `rgba(${r},${g},${b},0.08)`,
      sidebar: "#ffffff", sidebarBorder: "#e0e0e6", headerBg: "rgba(248,248,250,0.95)",
    };
  }
}

export function getTheme(id) {
  // Check for custom theme in localStorage
  if (id === "custom") {
    try {
      const raw = localStorage.getItem("summit-custom-theme");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
  }
  return THEMES[id] || THEMES.midnight;
}

export function saveCustomTheme(theme) {
  try { localStorage.setItem("summit-custom-theme", JSON.stringify(theme)); } catch (e) {}
}

export function loadThemePreference() {
  try { return localStorage.getItem("summit-theme") || "midnight"; } catch(e) { return "midnight"; }
}

export function saveThemePreference(id) {
  try { localStorage.setItem("summit-theme", id); } catch(e) {}
}
