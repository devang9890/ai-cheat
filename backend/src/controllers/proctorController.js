import { analyzeFrameWithAI } from "../services/ai.service.js";

export const analyzeFrame = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const aiResult = await analyzeFrameWithAI(image);

    res.json({
      faceStatus: aiResult.face.status,
      faceCount: aiResult.face.face_count,
      headDirection: aiResult.eyes.head_direction,
      lookingAway: aiResult.eyes.looking_away,
      cheatingScore: aiResult.cheating.cheating_score,
      riskLevel: aiResult.cheating.risk_level,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "AI analysis failed" });
  }
};
