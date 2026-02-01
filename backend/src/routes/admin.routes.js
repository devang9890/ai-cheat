import express from "express";
import CheatingLog from "../models/CheatingLog.js";

const router = express.Router();

// 🔍 Get all active sessions (latest log per session)
router.get("/sessions", async (req, res) => {
  try {
    const sessions = await CheatingLog.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$sessionId",
          studentId: { $first: "$studentId" },
          examId: { $first: "$examId" },
          riskLevel: { $first: "$riskLevel" },
          cheatingScore: { $first: "$cheatingScore" },
          updatedAt: { $first: "$createdAt" }
        }
      }
    ]);

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📜 Full timeline for a session
router.get("/session/:sessionId", async (req, res) => {
  const logs = await CheatingLog.find({
    sessionId: req.params.sessionId
  }).sort({ createdAt: 1 });

  res.json(logs);
});

export default router;
