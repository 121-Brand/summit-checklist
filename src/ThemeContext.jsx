import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { THEMES, getTheme, loadThemePreference, saveThemePreference, saveCustomTheme, generateThemeFromAccent } from "./themes";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState(loadThemePreference);
  const [customTheme, setCustomThemeState] = useState(() => {
    try { const r = localStorage.getItem("summit-custom-theme"); return r ? JSON.parse(r) : null; } catch { return null; }
  });

  const theme = themeId === "custom" && customTheme ? customTheme : getTheme(themeId);

  const setThemeId = useCallback((id) => {
    setThemeIdState(id);
    saveThemePreference(id);
  }, []);

  const setCustomTheme = useCallback((t) => {
    setCustomThemeState(t);
    saveCustomTheme(t);
    setThemeIdState("custom");
    saveThemePreference("custom");
  }, []);

  const createCustomFromAccent = useCallback((accent, name, isDark) => {
    const t = generateThemeFromAccent(accent, name, isDark);
    setCustomTheme(t);
  }, [setCustomTheme]);

  useEffect(() => {
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
  }, [themeId, theme, customTheme]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, theme, themes: THEMES, customTheme, setCustomTheme, createCustomFromAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
