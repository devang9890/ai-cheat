import mongoose from "mongoose";

const cheatingLogSchema = new mongoose.Schema(
  {
    faceStatus: String,
    faceCount: Number,
    headDirection: String,
    lookingAway: Boolean,
    cheatingScore: Number,
    riskLevel: String,
    warnings: Number,
    examTerminated: Boolean,
  },
  { timestamps: true }
);

export default mongoose.model("CheatingLog", cheatingLogSchema);
