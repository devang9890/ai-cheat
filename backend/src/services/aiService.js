import axios from "axios";

const AI_BASE_URL = "http://127.0.0.1:8000";

export const analyzeFrameWithAI = async (image) => {
  // Face detection
  const faceRes = await axios.post(
    `${AI_BASE_URL}/api/face/detect-face`,
    { image }
  );

  // Eye tracking
  const eyeRes = await axios.post(
    `${AI_BASE_URL}/api/eyes/detect-eyes`,
    { image }
  );

  // Cheating score
  const scoreRes = await axios.post(
    `${AI_BASE_URL}/api/cheating/update-score`,
    {
      face_count: faceRes.data.face_count,
      looking_away: eyeRes.data.looking_away,
    }
  );

  return {
    face: faceRes.data,
    eyes: eyeRes.data,
    cheating: scoreRes.data,
  };
};
