import express from "express";
import cors from "cors";
import reminderRoutes from "./routers/reminderRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/reminder", reminderRoutes);

export default app;