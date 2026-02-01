import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const AdminDashboard = () => {
  // ─── STATE ───────────────────────────────────────────────────────────────
  const [view, setView] = useState("list"); // "list" or "detail"
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("startedAt"); // startedAt, cheatingScore, risk

  // ─── FETCH SESSIONS ──────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      // 🔌 API INTEGRATION POINT:
      // GET /api/admin/sessions returns all sessions
      const res = await axios.get("http://localhost:5000/api/admin/sessions");
      setSessions(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch sessions error:", err);
      setError("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSessions();
    // Refresh every 5 seconds
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // ─── FETCH SESSION DETAIL & LOGS ─────────────────────────────────────────
  const fetchSessionDetail = useCallback(async (sessionId) => {
    try {
      setIsLoading(true);
      // 🔌 API INTEGRATION POINT:
      // GET /api/admin/session/:id returns session metadata
      const sessionRes = await axios.get(
        `http://localhost:5000/api/admin/session/${sessionId}`
      );
      setSelectedSession(sessionRes.data);

      // 🔌 API INTEGRATION POINT:
      // GET /api/proctor/session/:sessionId returns ordered timeline logs
      const logsRes = await axios.get(
        `http://localhost:5000/api/proctor/session/${sessionId}`
      );
      setSessionLogs(logsRes.data || []);

      setError(null);
    } catch (err) {
      console.error("Fetch session detail error:", err);
      setError("Failed to load session details");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── HANDLE SESSION SELECTION ────────────────────────────────────────────
  const handleSelectSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    setView("detail");
    fetchSessionDetail(sessionId);
  };

  // ─── HANDLE BACK ─────────────────────────────────────────────────────────
  const handleBack = () => {
    setView("list");
    setSelectedSessionId(null);
    setSelectedSession(null);
    setSessionLogs([]);
  };

  // ─── ADMIN ACTIONS ───────────────────────────────────────────────────────
  const terminateSession = async (sessionId) => {
    try {
      // 🔌 API INTEGRATION POINT: Terminate session
      await axios.post(`http://localhost:5000/api/admin/session/${sessionId}/terminate`);
      fetchSessions();
      if (selectedSessionId === sessionId) {
        fetchSessionDetail(sessionId);
      }
    } catch (err) {
      console.error("Terminate error:", err);
    }
  };

  const flagSession = async (sessionId) => {
    try {
      // 🔌 API INTEGRATION POINT: Flag session for review
      await axios.post(`http://localhost:5000/api/admin/session/${sessionId}/flag`);
      fetchSessions();
      if (selectedSessionId === sessionId) {
        fetchSessionDetail(sessionId);
      }
    } catch (err) {
      console.error("Flag error:", err);
    }
  };

  const downloadReport = (sessionId) => {
    // 🔌 API INTEGRATION POINT: Generate PDF
    window.open(
      `http://localhost:5000/api/admin/session/${sessionId}/report`,
      "_blank"
    );
  };

  // ─── FILTER & SEARCH ─────────────────────────────────────────────────────
  const filters = ["ALL", "ACTIVE", "SUSPICIOUS", "HIGH_RISK", "TERMINATED", "COMPLETED"];

  const filteredSessions = sessions
    .filter((s) => {
      if (filter === "ALL") return true;
      if (filter === "TERMINATED") return s.status === "TERMINATED";
      if (filter === "COMPLETED") return s.status === "COMPLETED";
      if (filter === "ACTIVE") return s.status === "ACTIVE" && s.riskLevel === "SAFE";
      if (filter === "SUSPICIOUS") return s.riskLevel === "SUSPICIOUS";
      if (filter === "HIGH_RISK") return s.riskLevel === "HIGH_RISK";
      return false;
    })
    .filter((s) =>
      s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.examName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sessionId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "startedAt")
        return new Date(b.startedAt) - new Date(a.startedAt);
      if (sortBy === "cheatingScore") return b.cheatingScore - a.cheatingScore;
      if (sortBy === "risk") {
        const riskOrder = { HIGH_RISK: 0, SUSPICIOUS: 1, SAFE: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      return 0;
    });

  // ─── SUMMARY STATS ───────────────────────────────────────────────────────
  const stats = {
    total: sessions.length,
    active: sessions.filter((s) => s.status === "ACTIVE").length,
    highRisk: sessions.filter((s) => s.riskLevel === "HIGH_RISK").length,
    terminated: sessions.filter((s) => s.status === "TERMINATED").length,
  };

  // ─── COLOR CONFIGS ───────────────────────────────────────────────────────
  const riskColor = {
    SAFE: { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    SUSPICIOUS: { color: "#eab308", bg: "rgba(234,179,8,0.12)" },
    HIGH_RISK: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  };

  const statusColor = {
    ACTIVE: "#22c55e",
    TERMINATED: "#ef4444",
    COMPLETED: "#3b82f6",
  };

  // ─── RENDER: SESSIONS LIST ──────────────────────────────────────────────
  if (view === "list") {
    return (
      <div>
        {/* Error banner */}
        {error && (
          <div style={{
            marginBottom: 16, background: "rgba(239,68,68,0.15)", border: "1px solid #ef444444",
            borderRadius: 10, padding: "12px 18px"
          }}>
            <div style={{ color: "#ef4444", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>⚠ {error}</div>
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Sessions", value: stats.total, color: "#6366f1", icon: "📋" },
            { label: "Active", value: stats.active, color: "#22c55e", icon: "▶" },
            { label: "High Risk", value: stats.highRisk, color: "#ef4444", icon: "⚠" },
            { label: "Terminated", value: stats.terminated, color: "#f97316", icon: "✕" },
          ].map((c, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "16px 18px", borderLeft: `3px solid ${c.color}`
            }}>
              <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "'JetBrains Mono', monospace" }}>{c.label}</div>
              <div style={{ color: "#e2e8f0", fontSize: 26, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{c.icon} {c.value}</div>
            </div>
          ))}
        </div>

        {/* Search & sort controls */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by student, exam, or session ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1, minWidth: 200,
              padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)", color: "#e2e8f0", fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace", outline: "none"
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)", color: "#e2e8f0", fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace", outline: "none"
            }}
          >
            <option value="startedAt">Sort: Latest</option>
            <option value="cheatingScore">Sort: Cheating Score</option>
            <option value="risk">Sort: Risk Level</option>
          </select>
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 14px", borderRadius: 20, border: filter === f ? "none" : "1px solid rgba(255,255,255,0.1)",
                background: filter === f ? "#6366f1" : "transparent", color: filter === f ? "#fff" : "#94a3b8",
                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                transition: "all 0.2s", letterSpacing: 0.5
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sessions table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
          {isLoading && (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              Loading sessions...
            </div>
          )}

          {!isLoading && filteredSessions.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No sessions found
            </div>
          )}

          {!isLoading && filteredSessions.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Student", "Exam", "Started", "Status", "Risk", "Score", "Warnings", "Tab Switches", "Action"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left", padding: "12px 16px", color: "#64748b", fontSize: 10,
                        textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s, i) => (
                  <tr
                    key={s.sessionId}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)"}
                  >
                    <td style={{ padding: "12px 16px", color: "#e2e8f0", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }} onClick={() => handleSelectSession(s.sessionId)}>{s.studentName}</td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} onClick={() => handleSelectSession(s.sessionId)}>{s.examName}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} onClick={() => handleSelectSession(s.sessionId)}>{new Date(s.startedAt).toLocaleString()}</td>
                    <td style={{ padding: "12px 16px" }} onClick={() => handleSelectSession(s.sessionId)}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: (statusColor[s.status] || "#666") + "22", color: statusColor[s.status] || "#666", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>{s.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }} onClick={() => handleSelectSession(s.sessionId)}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: riskColor[s.riskLevel].color, boxShadow: `0 0 5px ${riskColor[s.riskLevel].color}` }} />
                        <span style={{ color: riskColor[s.riskLevel].color, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{s.riskLevel}</span>
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }} onClick={() => handleSelectSession(s.sessionId)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                          <div style={{ width: `${s.cheatingScore}%`, height: "100%", borderRadius: 3, background: riskColor[s.riskLevel].color, transition: "width 0.4s" }} />
                        </div>
                        <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{s.cheatingScore}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} onClick={() => handleSelectSession(s.sessionId)}>{s.warnings || 0}/3</td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} onClick={() => handleSelectSession(s.sessionId)}>{s.tabSwitches || 0}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSession(s.sessionId);
                        }}
                        style={{
                          padding: "4px 10px", borderRadius: 6, border: "1px solid #6366f1", background: "transparent",
                          color: "#6366f1", fontSize: 10, fontWeight: 600, cursor: "pointer",
                          fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s"
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ─── RENDER: SESSION DETAIL ─────────────────────────────────────────────
  if (view === "detail" && selectedSession) {
    const risk = riskColor[selectedSession.riskLevel] || riskColor.SAFE;
    const status = statusColor[selectedSession.status] || "#666";

    return (
      <div>
        {/* Back button */}
        <button
          onClick={handleBack}
          style={{
            background: "none", border: "none", color: "#6366f1", cursor: "pointer",
            fontSize: 13, fontFamily: "'JetBrains Mono', monospace", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 6
          }}
        >
          ← Back to Sessions
        </button>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Left – session info */}
          <div style={{ flex: 1 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{selectedSession.studentName}</div>
                  <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{selectedSession.examName}</div>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: status + "22", color: status, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>{selectedSession.status}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Session ID", value: selectedSession.sessionId },
                  { label: "Student ID", value: selectedSession.studentId || "—" },
                  { label: "Exam ID", value: selectedSession.examId || "—" },
                  { label: "Started", value: new Date(selectedSession.startedAt).toLocaleString() },
                  { label: "Warnings", value: `${selectedSession.warnings || 0}/3` },
                  { label: "Tab Switches", value: selectedSession.tabSwitches || 0 },
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "'JetBrains Mono', monospace" }}>{item.label}</div>
                    <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", marginTop: 3, wordBreak: "break-all" }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Risk & score */}
              <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                <div style={{ flex: 1, background: risk.bg, border: `1px solid ${risk.color}33`, borderRadius: 10, padding: "14px 18px" }}>
                  <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "'JetBrains Mono', monospace" }}>Risk Level</div>
                  <div style={{ color: risk.color, fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>{selectedSession.riskLevel}</div>
                </div>
                <div style={{ flex: 1, background: risk.bg, border: `1px solid ${risk.color}33`, borderRadius: 10, padding: "14px 18px" }}>
                  <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "'JetBrains Mono', monospace" }}>Cheating Score</div>
                  <div style={{ color: risk.color, fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>{selectedSession.cheatingScore}<span style={{ fontSize: 12, color: "#64748b" }}>/100</span></div>
                </div>
              </div>

              {/* Admin actions */}
              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button
                  onClick={() => terminateSession(selectedSessionId)}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent",
                    color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s"
                  }}
                >
                  ✕ Terminate Session
                </button>
                <button
                  onClick={() => flagSession(selectedSessionId)}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #eab308", background: "transparent",
                    color: "#eab308", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s"
                  }}
                >
                  🚩 Flag Session
                </button>
                <button
                  onClick={() => downloadReport(selectedSessionId)}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #22c55e", background: "transparent",
                    color: "#22c55e", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s"
                  }}
                >
                  📥 Download Report
                </button>
              </div>
            </div>
          </div>

          {/* Right – incident timeline */}
          <div style={{ width: 320 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, maxHeight: "600px", overflowY: "auto" }}>
              <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>Incident Timeline</div>

              {isLoading && (
                <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: "center", padding: "20px 0" }}>
                  Loading logs...
                </div>
              )}

              {!isLoading && sessionLogs.length === 0 && (
                <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: "center", padding: "30px 0" }}>
                  No incidents recorded
                </div>
              )}

              {!isLoading && sessionLogs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {sessionLogs
                    .filter((log) => log.riskLevel === "SUSPICIOUS" || log.riskLevel === "HIGH_RISK" || log.warnings > 0)
                    .map((log, i, filtered) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: log.riskLevel === "HIGH_RISK" ? "#ef4444" : log.riskLevel === "SUSPICIOUS" ? "#eab308" : "#22c55e",
                            boxShadow: `0 0 6px ${log.riskLevel === "HIGH_RISK" ? "#ef4444" : log.riskLevel === "SUSPICIOUS" ? "#eab308" : "#22c55e"}`,
                            marginTop: 3
                          }} />
                          {i < filtered.length - 1 && <div style={{ width: 2, height: 36, background: "rgba(255,255,255,0.1)" }} />}
                        </div>
                        <div style={{ paddingBottom: i < filtered.length - 1 ? 24 : 0 }}>
                          <div style={{ color: "#cbd5e1", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                            {log.riskLevel} - {log.faceStatus} • {log.headDirection}
                          </div>
                          <div style={{ color: "#475569", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AdminDashboard;
