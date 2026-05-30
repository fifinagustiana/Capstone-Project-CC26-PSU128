import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function getAllBalita(req, res) {
    try {
        const result = await pool.query(
            'SELECT * FROM balita ORDER BY created_at DESC'
        );

        return res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get balita error:', error.message);
        return res.status(500).json({
            error: 'Gagal mengambil data balita',
        });
    }
}

export async function createBalita(req, res) {
    try {
        const {
            nama,
            jenis_kelamin,
            tanggal_lahir,
            nama_ortu,
            no_hp,
            alamat,
            catatan,
        } = req.body;

        if (!nama || !jenis_kelamin || !tanggal_lahir || !nama_ortu || !no_hp || !alamat) {
            return res.status(400).json({
                error: 'Nama, jenis kelamin, tanggal lahir, nama orang tua, no hp, dan alamat wajib diisi',
            });
        }

        const id = uuidv4();

        const result = await pool.query(
            `INSERT INTO balita
       (id, nama, jenis_kelamin, tanggal_lahir, nama_ortu, no_hp, alamat, catatan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [
                id,
                nama,
                jenis_kelamin,
                tanggal_lahir,
                nama_ortu,
                no_hp,
                alamat,
                catatan || '',
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Data balita berhasil disimpan',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Create balita error:', error.message);
        return res.status(500).json({
            error: 'Gagal menyimpan data balita',
        });
    }
}

export async function deleteBalita(req, res) {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM predictions WHERE balita_id = $1', [id]);
        await pool.query('DELETE FROM balita WHERE id = $1', [id]);

        return res.json({
            success: true,
            message: 'Data balita berhasil dihapus',
        });
    } catch (error) {
        console.error('Delete balita error:', error.message);
        return res.status(500).json({
            error: 'Gagal menghapus data balita',
        });
    }
}