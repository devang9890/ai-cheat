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

  const analyzeFrame = async () => {
    if (examTerminated) return;

    const image = captureFrame();
    if (!image) return;

    try {
      // 👤 Face detection
      const faceRes = await axios.post(
        "http://127.0.0.1:8000/api/face/detect-face",
        { image }
      );

      setFaceStatus(faceRes.data.status);
      setFaceCount(faceRes.data.face_count);

      // 👀 Eye / head tracking
      const eyeRes = await axios.post(
        "http://127.0.0.1:8000/api/eyes/detect-eyes",
        { image }
      );

      setHeadDirection(eyeRes.data.head_direction);
      setLookingAway(eyeRes.data.looking_away);

      // 🧠 Cheating score
      const scoreRes = await axios.post(
        "http://127.0.0.1:8000/api/cheating/update-score",
        {
          face_count: faceRes.data.face_count,
          looking_away: eyeRes.data.looking_away,
        }
      );

      setCheatingScore(scoreRes.data.cheating_score);
      setRiskLevel(scoreRes.data.risk_level);

      // 🚨 Warning system (3 strikes)
      if (
        scoreRes.data.risk_level === "SUSPICIOUS" ||
        scoreRes.data.risk_level === "HIGH_RISK"
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
      console.error("AI error:", err.response?.data || err.message);
    }
  };

  const startMonitoring = () => {
    if (intervalRef.current || examTerminated) return;
    intervalRef.current = setInterval(analyzeFrame, 3000);
  };

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
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-96 rounded border"
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-white p-4 rounded shadow w-96 text-center space-y-1">
        <p><b>Face Status:</b> {faceStatus}</p>
        <p><b>Faces Detected:</b> {faceCount}</p>
        <p><b>Head Direction:</b> {headDirection}</p>
        <p><b>Looking Away:</b> {lookingAway ? "⚠️ YES" : "✅ NO"}</p>
        <p><b>Warnings:</b> {warnings} / 3</p>

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
