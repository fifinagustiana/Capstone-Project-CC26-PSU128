import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { predictWithAI } from "../services/aiService.js";
import { getSaranByStatus } from "../utils/statusMapper.js";

export async function createPrediction(req, res) {
    try {
        const {
            balita_id,
            nama,
            jenis_kelamin,
            usia_bulan,
            berat_badan,
            tinggi_badan,
            lingkar_kepala,
            catatan,
        } = req.body;

        if (!nama || !jenis_kelamin || usia_bulan === undefined || !tinggi_badan) {
            return res.status(400).json({
                error: "Nama, jenis kelamin, usia bulan, dan tinggi badan wajib diisi",
            });
        }

        if (Number(usia_bulan) < 0 || Number(usia_bulan) > 60) {
            return res.status(400).json({
                error: "Usia bulan harus berada di rentang 0 sampai 60",
            });
        }

        if (Number(tinggi_badan) <= 0) {
            return res.status(400).json({
                error: "Tinggi badan tidak valid",
            });
        }

        const aiResult = await predictWithAI({
            usia_bulan,
            tinggi_badan,
            jenis_kelamin,
        });

        const id = uuidv4();
        const status = aiResult.status;
        const saran = getSaranByStatus(status);

        const confidence = Math.max(
            ...Object.values(aiResult.probabilitas || {}).map(Number),
            0,
        );

        const result = await pool.query(
            `INSERT INTO predictions
       (id, balita_id, nama, jenis_kelamin, usia_bulan, berat_badan, tinggi_badan,
        lingkar_kepala, status, z_score_tb_u, confidence, probabilitas, saran,
        catatan, ai_response)
       VALUES
       ($1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15)
       RETURNING *`,
            [
                id,
                balita_id || null,
                nama,
                jenis_kelamin,
                Number(usia_bulan),
                berat_badan ? Number(berat_badan) : null,
                Number(tinggi_badan),
                lingkar_kepala ? Number(lingkar_kepala) : null,
                status,
                null,
                confidence || 0.9,
                JSON.stringify(aiResult.probabilitas),
                JSON.stringify(saran),
                catatan || "",
                JSON.stringify(aiResult.ai_response),
            ],
        );

        return res.status(201).json({
            ...result.rows[0],
            rekomendasi_gemini: aiResult.rekomendasi_gemini,
        });
    } catch (error) {
        console.error("Prediction error:", error.message);

        return res.status(500).json({
            error:
                "Gagal melakukan prediksi. Periksa koneksi API AI, endpoint, dan API key.",
            detail: error.message,
        });
    }
}
