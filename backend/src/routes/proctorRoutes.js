import express from "express";
import { analyzeFrame } from "../controllers/proctorController.js";

const router = express.Router();

router.post("/analyze-frame", analyzeFrame);

export default router;
