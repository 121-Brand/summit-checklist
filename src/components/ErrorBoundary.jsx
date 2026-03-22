import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Summit Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#e2e8f0", fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24 }}>
          <div style={{ textAlign: "center", maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24, lineHeight: 1.6 }}>
              {this.state.error?.message?.includes("dynamically imported module")
                ? "A new version was deployed. Please refresh the page to load the latest version."
                : "An unexpected error occurred. Try refreshing the page."}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => window.location.reload()}
                style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#06b6d4", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  try {
                    const keys = Object.keys(localStorage).filter(k => k.startsWith("summit-"));
                    keys.forEach(k => localStorage.removeItem(k));
                  } catch {}
                  window.location.reload();
                }}
                style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Reset & Refresh
              </button>
            </div>
            <p style={{ fontSize: 10, color: "#475569", marginTop: 16 }}>
              {this.state.error?.message?.slice(0, 120)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
