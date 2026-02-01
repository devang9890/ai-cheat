import express from "express";
import { analyzeFrame } from "../controllers/proctorController.js";
import CheatingLog from "../models/CheatingLog.js";

const router = express.Router();

router.post("/analyze-frame", analyzeFrame);

// 📄 Fetch logs by sessionId (timeline)
router.get("/session/:sessionId", async (req, res) => {
	try {
		const logs = await CheatingLog.find({
			sessionId: req.params.sessionId,
		}).sort({ createdAt: 1 });
		res.json(logs);
	} catch (err) {
		res.status(500).json({ message: "Failed to fetch session logs" });
	}
});

export default router;
