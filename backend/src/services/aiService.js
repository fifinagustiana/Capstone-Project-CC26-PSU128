import axios from "axios";
import dotenv from "dotenv";
import { mapGenderToAI, mapStatusFromAI } from "../utils/statusMapper.js";

dotenv.config();

export async function predictWithAI({
    usia_bulan,
    tinggi_badan,
    jenis_kelamin,
}) {
    const aiGender = mapGenderToAI(jenis_kelamin);

    if (!aiGender) {
        throw new Error("Jenis kelamin harus Laki-laki atau Perempuan");
    }

    if (!process.env.AI_API_URL || !process.env.AI_API_KEY) {
        throw new Error("AI_API_URL atau AI_API_KEY belum diisi di file .env");
    }

    const payload = {
        umur_bulan: Number(usia_bulan),
        tinggi_badan_cm: Number(tinggi_badan),
        jenis_kelamin: aiGender,
    };

    const response = await axios.post(process.env.AI_API_URL, payload, {
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": process.env.AI_API_KEY,
        },
        timeout: 20000,
    });

    const aiData = response.data;

    const kategoriAI = aiData?.hasil_prediksi?.kategori_diagnosa;
    const probabilitas = aiData?.hasil_prediksi?.probabilitas || {};
    const rekomendasiGemini = aiData?.rekomendasi_gemini || null;

    return {
        status: mapStatusFromAI(kategoriAI),
        probabilitas,
        rekomendasi_gemini: rekomendasiGemini,
        ai_response: aiData,
    };
}
