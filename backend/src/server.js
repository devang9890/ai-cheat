import express from "express";
import cors from "cors";
import proctorRoutes from "./routes/proctor.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/proctor", proctorRoutes);

app.get("/health", (_, res) => {
  res.json({ status: "Node backend running 🚀" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
