import mongoose from "mongoose";

const cheatingLogSchema = new mongoose.Schema(
  {
    sessionId: String,
    studentId: String,
    examId: String,

    faceStatus: String,
    faceCount: Number,
    headDirection: String,
    lookingAway: Boolean,

    cheatingScore: Number,
    riskLevel: String,
    tabSwitches: Number,
    warnings: Number,
    examTerminated: Boolean,
  },
  { timestamps: true }
);

export default mongoose.model("CheatingLog", cheatingLogSchema);
