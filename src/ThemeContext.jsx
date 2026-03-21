import { createContext, useContext, useState, useEffect } from "react";
import { THEMES, getTheme, loadThemePreference, saveThemePreference } from "./themes";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(loadThemePreference);
  const theme = getTheme(themeId);

  useEffect(() => {
    saveThemePreference(themeId);
    const root = document.documentElement;
    root.style.setProperty("--bg", theme.bg);
    root.style.setProperty("--bg-card", theme.bgCard);
    root.style.setProperty("--bg-hover", theme.bgHover);
    root.style.setProperty("--border", theme.border);
    root.style.setProperty("--text", theme.text);
    root.style.setProperty("--text-muted", theme.textMuted);
    root.style.setProperty("--text-dim", theme.textDim);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-bg", theme.accentBg);
    root.style.setProperty("--sidebar-bg", theme.sidebar);
    root.style.setProperty("--sidebar-border", theme.sidebarBorder);
    root.style.setProperty("--header-bg", theme.headerBg);
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
  }, [themeId, theme]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, theme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
