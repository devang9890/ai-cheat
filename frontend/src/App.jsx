import { useState } from "react";
import WebcamFeed from "./components/proctoring/WebcamFeed";
import AdminDashboard from "./pages/admin/AdminDashboard";

function App() {
  const [mode, setMode] = useState("STUDENT"); // STUDENT | ADMIN

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f1117; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        button:focus { outline: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>
        {/* Top navbar */}
        <nav
          style={{
            width: "100%",
            background: "rgba(15,17,23,0.85)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "14px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          {/* Logo & branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              🛡
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", letterSpacing: -0.3 }}>
              ProctorAI
            </span>
            <span
              style={{
                fontSize: 9,
                color: "#64748b",
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                padding: "2px 7px",
                borderRadius: 10,
                letterSpacing: 0.8,
                marginLeft: 6,
              }}
            >
              LIVE
            </span>
          </div>

          {/* Mode switcher */}
          <div style={{ display: "flex", gap: 8 }}>
            {["STUDENT", "ADMIN"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "7px 18px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: mode === m ? "#6366f1" : "rgba(255,255,255,0.06)",
                  color: mode === m ? "#fff" : "#94a3b8",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 0.5,
                  transition: "all 0.2s",
                }}
              >
                {m === "STUDENT" ? "👤 Student" : "🎛 Admin"}
              </button>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main
          style={{
            padding: "32px 40px",
            maxWidth: mode === "STUDENT" ? 520 : 1200,
            margin: "0 auto",
          }}
        >
          {mode === "STUDENT" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
                  Exam Proctoring
                </h1>
                <p style={{ color: "#64748b", fontSize: 12 }}>
                  Your session is being monitored for integrity.
                </p>
              </div>
              <WebcamFeed />
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
                  Admin Dashboard
                </h1>
                <p style={{ color: "#64748b", fontSize: 12 }}>
                  Monitor and review all active proctoring sessions.
                </p>
              </div>
              <AdminDashboard />
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
