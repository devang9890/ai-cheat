import { analyzeFrameWithAI } from "../services/aiService.js";
import CheatingLog from "../models/CheatingLog.js";

export const analyzeFrame = async (req, res) => {
  try {
    const { image, tabSwitches = 0, warnings = 0, examTerminated = false } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const aiResult = await analyzeFrameWithAI(image, tabSwitches);

    const log = await CheatingLog.create({
      faceStatus: aiResult.face.status,
      faceCount: aiResult.face.face_count,
      headDirection: aiResult.eyes.head_direction,
      lookingAway: aiResult.eyes.looking_away,
      cheatingScore: aiResult.cheating.cheating_score,
      riskLevel: aiResult.cheating.risk_level,
      tabSwitches,
      warnings,
      examTerminated,
    });

    res.json({
      faceStatus: log.faceStatus,
      faceCount: log.faceCount,
      headDirection: log.headDirection,
      lookingAway: log.lookingAway,
      cheatingScore: log.cheatingScore,
      riskLevel: log.riskLevel,
      tabSwitches: log.tabSwitches,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "AI analysis failed" });
  }
};
