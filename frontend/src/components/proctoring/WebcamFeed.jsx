import { useEffect, useRef, useState } from "react";
import axios from "axios";

const WebcamFeed = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [faceStatus, setFaceStatus] = useState("WAITING");
  const [faceCount, setFaceCount] = useState(0);
  const [headDirection, setHeadDirection] = useState("WAITING");
  const [lookingAway, setLookingAway] = useState(false);

  const [cheatingScore, setCheatingScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState("SAFE");

  const [warnings, setWarnings] = useState(0);
  const [examTerminated, setExamTerminated] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showTabBadge, setShowTabBadge] = useState(false);
  const lastTabEventRef = useRef(0);

  // 🎥 Start webcam
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch(console.error);

    return () => stopMonitoring();
  }, []);

  // 🔎 Tab switch / blur detection
  useEffect(() => {
    const markTabEvent = () => {
      const now = Date.now();
      // Debounce: only count once per second
      if (now - lastTabEventRef.current < 1000) return;
      lastTabEventRef.current = now;
      setTabSwitches((prev) => prev + 1);
      setShowTabBadge(true);
      setTimeout(() => setShowTabBadge(false), 1500);
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
  }, []);

  // 📸 Capture frame from webcam
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

  // 🧠 Send frame to Node.js backend (ONLY ONE API CALL)
  const analyzeFrame = async () => {
    if (examTerminated) return;

    const image = captureFrame();
    if (!image) return;

    try {
      const res = await axios.post(
        "http://localhost:5000/api/proctor/analyze-frame",
        { image, tabSwitches }
      );

      setFaceStatus(res.data.faceStatus);
      setFaceCount(res.data.faceCount);
      setHeadDirection(res.data.headDirection);
      setLookingAway(res.data.lookingAway);
      setCheatingScore(res.data.cheatingScore);
      setRiskLevel(res.data.riskLevel);

      // 🚨 Warning system (3 strikes)
      if (
        res.data.riskLevel === "SUSPICIOUS" ||
        res.data.riskLevel === "HIGH_RISK"
      ) {
        setWarnings((prev) => {
          const next = prev + 1;

          if (next === 1) {
            alert("⚠️ Warning 1: Suspicious activity detected");
          } else if (next === 2) {
            alert("⚠️ Final Warning: Further activity will terminate exam");
          } else if (next >= 3) {
            alert("❌ Exam Terminated due to cheating");
            setExamTerminated(true);
            stopMonitoring();
          }

          return next;
        });
      }
    } catch (err) {
      console.error("Proctoring error:", err.response?.data || err.message);
    }
  };

  // ❌ Auto-terminate after 3 tab switches
  useEffect(() => {
    if (tabSwitches >= 3 && !examTerminated) {
      alert("❌ Exam Terminated due to repeated tab switches");
      setExamTerminated(true);
      stopMonitoring();
    }
  }, [tabSwitches]);

  // ▶️ Start monitoring
  const startMonitoring = () => {
    if (intervalRef.current || examTerminated) return;
    intervalRef.current = setInterval(analyzeFrame, 3000);
  };

  // ⏹ Stop monitoring
  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const riskColor = {
    SAFE: "bg-green-500",
    SUSPICIOUS: "bg-yellow-500",
    HIGH_RISK: "bg-red-500",
  }[riskLevel];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-96 rounded border"
        />
        {showTabBadge && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white text-sm px-2 py-1 rounded shadow">
            ⚠️ Tab switch detected
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-white p-4 rounded shadow w-96 text-center space-y-1">
        <p><b>Face Status:</b> {faceStatus}</p>
        <p><b>Faces Detected:</b> {faceCount}</p>
        <p><b>Head Direction:</b> {headDirection}</p>
        <p><b>Looking Away:</b> {lookingAway ? "⚠️ YES" : "✅ NO"}</p>
        <p><b>Warnings:</b> {warnings} / 3</p>
        <p><b>Tab Switches:</b> {tabSwitches}</p>

        <div className={`mt-3 p-2 rounded text-white ${riskColor}`}>
          <p className="font-bold">Risk Level: {riskLevel}</p>
          <p>Cheating Score: {cheatingScore}</p>
        </div>

        {examTerminated && (
          <p className="text-red-600 font-bold mt-2">
            ❌ Exam Terminated
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={startMonitoring}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Start Monitoring
        </button>

        <button
          onClick={stopMonitoring}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Stop
        </button>
      </div>
    </div>
  );
};

export default WebcamFeed;
