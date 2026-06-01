import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import balitaRoutes from "./routes/balitaRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

dotenv.config();

const app = express();

const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
    : [];

const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...envOrigins,
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("❌ Blocked by CORS:", origin);
            return callback(null, false);
        },
        credentials: true,
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend StuntingScan aktif. Gunakan endpoint /api/health");
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend StuntingScan berjalan",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/balita", balitaRoutes);
app.use("/api/predict", predictionRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/stats", statsRoutes);

export default app;