import pool from '../config/db.js';

export async function getHistory(req, res) {
    try {
        const perPage = Number(req.query.per_page) || 50;
        const balitaId = req.query.balita_id;

        let result;

        if (balitaId) {
            result = await pool.query(
                `SELECT * FROM predictions
         WHERE balita_id = $1
         ORDER BY tanggal DESC
         LIMIT $2`,
                [balitaId, perPage]
            );
        } else {
            result = await pool.query(
                `SELECT * FROM predictions
         ORDER BY tanggal DESC
         LIMIT $1`,
                [perPage]
            );
        }

        return res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('History error:', error.message);
        return res.status(500).json({
            error: 'Gagal mengambil riwayat prediksi',
        });
    }
}