import { useState, useCallback } from "react";

const KEY_PREFIX = "summit-";

export function useStore() {
  const [projects, setProjectsState] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY_PREFIX + "projects");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [activeId, setActiveIdState] = useState(() => {
    try {
      return localStorage.getItem(KEY_PREFIX + "active") || null;
    } catch { return null; }
  });

  const [data, setDataState] = useState(() => {
    try {
      const id = localStorage.getItem(KEY_PREFIX + "active");
      if (!id) return null;
      const raw = localStorage.getItem(KEY_PREFIX + "data-" + id);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const setProjects = useCallback((p) => {
    setProjectsState(p);
    try { localStorage.setItem(KEY_PREFIX + "projects", JSON.stringify(p)); } catch {}
  }, []);

  const setActiveId = useCallback((id) => {
    setActiveIdState(id);
    try { localStorage.setItem(KEY_PREFIX + "active", id); } catch {}
  }, []);

  const saveData = useCallback((nd, id) => {
    setDataState(nd);
    const targetId = id || localStorage.getItem(KEY_PREFIX + "active");
    if (targetId) {
      try { localStorage.setItem(KEY_PREFIX + "data-" + targetId, JSON.stringify(nd)); } catch {}
    }
  }, []);

  const loadProject = useCallback((id) => {
    setActiveIdState(id);
    try {
      localStorage.setItem(KEY_PREFIX + "active", id);
      const raw = localStorage.getItem(KEY_PREFIX + "data-" + id);
      const d = raw ? JSON.parse(raw) : { sections: [], checks: {}, notes: {}, statuses: {}, log: [] };
      setDataState(d);
      return d;
    } catch {
      const d = { sections: [], checks: {}, notes: {}, statuses: {}, log: [] };
      setDataState(d);
      return d;
    }
  }, []);

  const deleteProject = useCallback((id) => {
    try { localStorage.removeItem(KEY_PREFIX + "data-" + id); } catch {}
  }, []);

  return { projects, setProjects, activeId, setActiveId, data, saveData, loadProject, deleteProject };
}
