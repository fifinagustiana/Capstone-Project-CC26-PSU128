import pool from '../config/db.js';

export async function getStats(req, res) {
    try {
        const total = await pool.query('SELECT COUNT(*) FROM predictions');
        const normal = await pool.query(`SELECT COUNT(*) FROM predictions WHERE status = 'Normal'`);
        const stunting = await pool.query(`SELECT COUNT(*) FROM predictions WHERE status = 'Stunting'`);
        const severely = await pool.query(`SELECT COUNT(*) FROM predictions WHERE status = 'Severely Stunted'`);
        const tinggi = await pool.query(`SELECT COUNT(*) FROM predictions WHERE status = 'Tinggi'`);

        const bulanIni = await pool.query(`
      SELECT COUNT(*) FROM predictions
      WHERE EXTRACT(MONTH FROM tanggal) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

        return res.json({
            totalPrediksi: Number(total.rows[0].count),
            bulanIni: Number(bulanIni.rows[0].count),
            normal: Number(normal.rows[0].count),
            stunting: Number(stunting.rows[0].count),
            severely: Number(severely.rows[0].count),
            tinggi: Number(tinggi.rows[0].count),
        });
    } catch (error) {
        console.error('Stats error:', error.message);
        return res.status(500).json({
            error: 'Gagal mengambil statistik dashboard',
        });
    }
}