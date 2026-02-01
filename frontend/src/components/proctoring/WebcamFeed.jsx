import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const WebcamFeed = () => {
  // ─── STATE ───────────────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const tabBadgeTimeoutRef = useRef(null);
  const lastTabEventRef = useRef(0);

  const [sessionId] = useState(uuidv4());
  const [studentId] = useState("student_123"); // Replace with auth context
  const [examId] = useState("exam_456"); // Replace with exam context

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [examTerminated, setExamTerminated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live metrics from backend
  const [metrics, setMetrics] = useState({
    faceStatus: "WAITING",
    faceCount: 0,
    headDirection: "WAITING",
    lookingAway: false,
    cheatingScore: 0,
    riskLevel: "SAFE",
    warnings: 0,
    tabSwitches: 0,
  });

  const [showTabBadge, setShowTabBadge] = useState(false);

  // ─── WEBCAM SETUP ────────────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        setError("Webcam access denied");
        console.error("Webcam error:", err);
      });

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      stopMonitoring();
    };
  }, []);

  // ─── TAB SWITCH DETECTION ────────────────────────────────────────────────
  useEffect(() => {
    const markTabEvent = async () => {
      const now = Date.now();
      // Debounce: only count once per second
      if (now - lastTabEventRef.current < 1000) return;
      lastTabEventRef.current = now;

      setMetrics((prev) => ({
        ...prev,
        tabSwitches: prev.tabSwitches + 1,
      }));

      // Notify backend of tab switch event
      try {
        await axios.post("http://localhost:5000/api/proctor/tab-switch", {
          sessionId,
          studentId,
          examId,
        });
      } catch (err) {
        console.error("Tab switch API error:", err);
      }

      setShowTabBadge(true);
      clearTimeout(tabBadgeTimeoutRef.current);
      tabBadgeTimeoutRef.current = setTimeout(() => setShowTabBadge(false), 1500);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) markTabEvent();
    };

    const handleBlur = () => {
      markTabEvent();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [sessionId, studentId, examId]);

  // ─── AUTO-TERMINATE ON 3 WARNINGS ───────────────────────────────────────
  useEffect(() => {
    if (metrics.warnings >= 3 && !examTerminated) {
      setExamTerminated(true);
      setIsMonitoring(false);
      stopMonitoring();
    }
  }, [metrics.warnings, examTerminated]);

  // ─── AUTO-TERMINATE ON 3 TAB SWITCHES ────────────────────────────────────
  useEffect(() => {
    if (metrics.tabSwitches >= 3 && !examTerminated) {
      setExamTerminated(true);
      setIsMonitoring(false);
      stopMonitoring();
    }
  }, [metrics.tabSwitches, examTerminated]);

  // ─── CAPTURE FRAME ───────────────────────────────────────────────────────
  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.videoWidth === 0) return null;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg");
  };

  // ─── ANALYZE FRAME (BACKEND API) ─────────────────────────────────────────
  const analyzeFrame = useCallback(async () => {
    if (examTerminated) return;

    const image = captureFrame();
    if (!image) return;

    try {
      setIsLoading(true);
      // 🔌 API INTEGRATION POINT:
      // POST /api/proctor/analyze-frame receives image, sessionId, studentId, examId, tabSwitches
      const res = await axios.post(
        "http://localhost:5000/api/proctor/analyze-frame",
        {
          image,
          sessionId,
          studentId,
          examId,
          tabSwitches: metrics.tabSwitches,
        }
      );

      // 📊 Backend returns live metrics
      setMetrics({
        faceStatus: res.data.faceStatus || "WAITING",
        faceCount: res.data.faceCount || 0,
        headDirection: res.data.headDirection || "WAITING",
        lookingAway: res.data.lookingAway || false,
        cheatingScore: res.data.cheatingScore || 0,
        riskLevel: res.data.riskLevel || "SAFE",
        warnings: res.data.warnings || metrics.warnings,
        tabSwitches: res.data.tabSwitches || metrics.tabSwitches,
      });

      // Check for termination signal from backend
      if (res.data.examTerminated) {
        setExamTerminated(true);
        setIsMonitoring(false);
        stopMonitoring();
      }

      setError(null);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Frame analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [examTerminated, metrics.tabSwitches, sessionId, studentId, examId]);

  // ─── START MONITORING ────────────────────────────────────────────────────
  const startMonitoring = useCallback(() => {
    if (intervalRef.current || examTerminated || error) return;
    setIsMonitoring(true);
    // 🔌 API INTEGRATION POINT: Session start event
    axios
      .post("http://localhost:5000/api/proctor/session-start", {
        sessionId,
        studentId,
        examId,
      })
      .catch((err) => console.error("Session start error:", err));

    // Poll backend every 3 seconds
    intervalRef.current = setInterval(analyzeFrame, 3000);
  }, [analyzeFrame, examTerminated, error, sessionId, studentId, examId]);

  // ─── STOP MONITORING ─────────────────────────────────────────────────────
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
    // 🔌 API INTEGRATION POINT: Session stop event
    axios
      .post("http://localhost:5000/api/proctor/session-stop", {
        sessionId,
        studentId,
        examId,
      })
      .catch((err) => console.error("Session stop error:", err));
  }, [sessionId, studentId, examId]);

  // ─── RISK CONFIG ─────────────────────────────────────────────────────────
  const riskConfig = {
    SAFE: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Safe" },
    SUSPICIOUS: { color: "#eab308", bg: "rgba(234,179,8,0.12)", label: "Suspicious" },
    HIGH_RISK: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "High Risk" },
  };
  const risk = riskConfig[metrics.riskLevel] || riskConfig.SAFE;

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      {/* Error banner */}
      {error && (
        <div style={{
          width: 420, background: "rgba(239,68,68,0.15)", border: "1px solid #ef444444",
          borderRadius: 10, padding: "12px 18px", textAlign: "center"
        }}>
          <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>⚠ {error}</div>
        </div>
      )}

      {/* Webcam frame */}
      <div style={{ position: "relative", width: 420 }}>
        <div style={{
          width: 420, height: 280, borderRadius: 12, overflow: "hidden",
          background: "#1a1a2e", border: `2px solid ${risk.color}`,
          boxShadow: `0 0 20px ${risk.color}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.4s, box-shadow 0.4s",
          position: "relative"
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              display: videoRef.current?.srcObject ? "block" : "none"
            }}
          />

          {/* Fallback placeholder */}
          {!videoRef.current?.srcObject && (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #16213e 0%, #0f3460 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              <span style={{ color: "#475569", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>Camera Feed</span>
            </div>
          )}

          {/* Live badge */}
          {isMonitoring && !examTerminated && (
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "4px 10px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444", animation: "pulse 1.5s infinite" }} />
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 600, letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
            </div>
          )}
        </div>

        {/* Tab switch badge */}
        {showTabBadge && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "#eab308", color: "#000", fontSize: 11, fontWeight: 700,
            padding: "4px 10px", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            animation: "slideIn 0.25s ease", fontFamily: "'JetBrains Mono', monospace"
          }}>⚠ Tab Switch
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: 420 }}>
        {[
          { label: "Face Status", value: metrics.faceStatus, icon: "👤" },
          { label: "Faces Detected", value: metrics.faceCount, icon: "👥" },
          { label: "Head Direction", value: metrics.headDirection, icon: "🧭" },
          { label: "Looking Away", value: metrics.lookingAway ? "YES" : "NO", icon: metrics.lookingAway ? "⚠️" : "✅", alert: metrics.lookingAway },
        ].map((m, i) => (
          <div key={i} style={{
            background: m.alert ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${m.alert ? "#ef444433" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 10, padding: "10px 14px", transition: "all 0.3s"
          }}>
            <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{m.label}</div>
            <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{m.icon} {m.value}</div>
          </div>
        ))}
      </div>

      {/* Risk & score bar */}
      <div style={{
        width: 420, borderRadius: 12, padding: "14px 18px",
        background: risk.bg, border: `1px solid ${risk.color}33`,
        display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.4s"
      }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>Risk Level</div>
          <div style={{ color: risk.color, fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{risk.label}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>Cheating Score</div>
          <div style={{ color: risk.color, fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{metrics.cheatingScore}<span style={{ fontSize: 11, color: "#64748b" }}>/100</span></div>
        </div>
      </div>

      {/* Warnings & tab info */}
      <div style={{ width: 420, display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Warnings</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 32, height: 6, borderRadius: 3, background: i < metrics.warnings ? (i === 2 ? "#ef4444" : "#eab308") : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />
            ))}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{metrics.warnings}/3</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Tab Switches</div>
          <div style={{ color: metrics.tabSwitches >= 3 ? "#ef4444" : "#e2e8f0", fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{metrics.tabSwitches}<span style={{ fontSize: 11, color: "#64748b" }}>/3</span></div>
        </div>
      </div>

      {/* Terminated banner */}
      {examTerminated && (
        <div style={{ width: 420, background: "rgba(239,68,68,0.15)", border: "1px solid #ef444444", borderRadius: 10, padding: "12px 18px", textAlign: "center" }}>
          <div style={{ color: "#ef4444", fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>✕ EXAM TERMINATED</div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>This session has been ended due to integrity violations.</div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={startMonitoring}
          disabled={examTerminated || isMonitoring || isLoading}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none", cursor: examTerminated || isMonitoring || isLoading ? "not-allowed" : "pointer",
            background: isMonitoring || examTerminated ? "rgba(34,197,94,0.15)" : "#22c55e",
            color: isMonitoring || examTerminated ? "#22c55e" : "#fff",
            fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s",
            opacity: examTerminated ? 0.4 : 1
          }}
        >
          ▶ {isMonitoring ? "Monitoring..." : "Start Monitoring"}
        </button>
        <button
          onClick={stopMonitoring}
          disabled={!isMonitoring}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none", cursor: !isMonitoring ? "not-allowed" : "pointer",
            background: "rgba(239,68,68,0.15)", color: "#ef4444",
            fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s",
            opacity: !isMonitoring ? 0.5 : 1
          }}
        >
          ■ Stop
        </button>
      </div>

      {/* Session info */}
      <div style={{ width: 420, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8 }}>
        <div style={{ color: "#64748b", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>SESSION ID</div>
        <div style={{ color: "#94a3b8", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginTop: 2, wordBreak: "break-all" }}>{sessionId}</div>
      </div>
    </div>
  );
};

export default WebcamFeed;
