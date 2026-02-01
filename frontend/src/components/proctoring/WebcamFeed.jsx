import { useEffect, useRef, useState } from "react";
import axios from "axios";

const WebcamFeed = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [faceStatus, setFaceStatus] = useState("Waiting...");
  const [faceCount, setFaceCount] = useState(0);
  const [headDirection, setHeadDirection] = useState("Waiting...");
  const [lookingAway, setLookingAway] = useState(false);

  // Start webcam
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Webcam access error:", err);
      });

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
    const base64Image = captureFrame();
    if (!base64Image) return;

    try {
      // Face detection
      const faceRes = await axios.post(
        "http://127.0.0.1:8000/api/face/detect-face",
        { image: base64Image }
      );

      setFaceStatus(faceRes.data.status);
      setFaceCount(faceRes.data.face_count);

      // Eye / head tracking
      const eyeRes = await axios.post(
        "http://127.0.0.1:8000/api/eyes/detect-eyes",
        { image: base64Image }
      );

      setHeadDirection(eyeRes.data.head_direction);
      setLookingAway(eyeRes.data.looking_away);
    } catch (err) {
      console.error("AI error:", err.response?.data || err.message);
    }
  };

  const startMonitoring = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      analyzeFrame();
    }, 3000); // every 3 seconds
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-96 rounded border"
      />

      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-white p-4 rounded shadow w-96 text-center">
        <p><strong>Face Status:</strong> {faceStatus}</p>
        <p><strong>Faces Detected:</strong> {faceCount}</p>
        <p><strong>Head Direction:</strong> {headDirection}</p>
        <p>
          <strong>Looking Away:</strong>{" "}
          {lookingAway ? "⚠️ YES" : "✅ NO"}
        </p>
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
