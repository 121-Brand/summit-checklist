import { useState } from "react";
import { Clipboard, ArrowRight, Sparkles, Upload, Users, BarChart3 } from "lucide-react";

export default function WelcomeScreen({ onComplete }) {
  const [step, setStep] = useState(0);

  const features = [
    { icon: Upload, title: "Smart Document Import", desc: "Upload Word, Excel, or CSV files — AI extracts and organizes tasks automatically", color: "#06b6d4" },
    { icon: Sparkles, title: "AI-Powered Insights", desc: "Get daily focus recommendations, break tasks into subtasks, find duplicates — all with one click", color: "#a78bfa" },
    { icon: Users, title: "Team Collaboration", desc: "Assign owners, track per-person progress, and see who's behind at a glance", color: "#f59e0b" },
    { icon: BarChart3, title: "Burndown Tracking", desc: "Real-time burndown chart shows velocity and whether you'll hit your deadline", color: "#22c55e" },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a0c14", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 opacity-15" style={{ background: "radial-gradient(circle, #06b6d4, transparent)", filter: "blur(100px)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 opacity-10" style={{ background: "radial-gradient(circle, #a78bfa, transparent)", filter: "blur(80px)" }} />

      <div className="relative z-10 max-w-lg w-full mx-4">
        {step === 0 && (
          <div className="text-center view-enter">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #06b6d4)" }}>
                <Clipboard size={28} color="#0a0c14" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold mb-3" style={{ color: "#f0f0f8", letterSpacing: "-0.03em" }}>SUMMIT</h1>
            <p className="text-lg mb-2" style={{ color: "#94a3b8" }}>AI-powered project checklist</p>
            <p className="mb-10 max-w-sm mx-auto" style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
              Upload documents, let AI organize your tasks, track your team's progress — and ship on time.
            </p>

            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border-none cursor-pointer font-bold mx-auto text-base"
              style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)", color: "#fff" }}
            >
              Get Started <ArrowRight size={18} />
            </button>

            <div className="mt-10 flex items-center justify-center gap-6 flex-wrap">
              {["AI Task Extraction", "5 Views", "Burndown Charts", "Team Tracking"].map((f) => (
                <span key={f} className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#64748b" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#06b6d4" }} />
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="view-enter">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#f0f0f8", letterSpacing: "-0.02em" }}>What you can do</h2>
              <p style={{ color: "#64748b", fontSize: 13 }}>Everything you need to manage a project from start to finish</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "#14161e", border: "1px solid #232636" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: f.color + "18" }}>
                      <Icon size={18} style={{ color: f.color }} />
                    </div>
                    <div className="font-bold mb-1" style={{ fontSize: 13, color: "#e2e8f0" }}>{f.title}</div>
                    <div style={{ fontSize: 11, color: "#7b7e8c", lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onComplete}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-none cursor-pointer font-bold text-base"
              style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)", color: "#fff" }}
            >
              Launch Summit <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1].map((s) => (
            <div key={s} className="rounded-full cursor-pointer" onClick={() => setStep(s)} style={{ width: s === step ? 24 : 8, height: 8, background: s === step ? "#06b6d4" : "#2a2a3a", transition: "all 0.3s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
