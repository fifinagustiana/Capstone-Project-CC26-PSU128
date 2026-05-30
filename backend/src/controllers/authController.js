import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export async function register(req, res) {
    try {
        const { nama, puskesmas, email, password } = req.body;

        if (!nama || !email || !password) {
            return res.status(400).json({
                error: 'Nama, email, dan password wajib diisi',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Kata sandi minimal 6 karakter',
            });
        }

        const emailNormal = email.trim().toLowerCase();

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [emailNormal]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: 'Email sudah terdaftar',
            });
        }

        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO users (id, nama, puskesmas, email, password)
       VALUES ($1, $2, $3, $4, $5)`,
            [id, nama, puskesmas || '', emailNormal, hashedPassword]
        );

        return res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
        });
    } catch (error) {
        console.error('Register error:', error.message);
        return res.status(500).json({
            error: 'Terjadi kesalahan server saat register',
        });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email dan kata sandi wajib diisi',
            });
        }

        const emailNormal = email.trim().toLowerCase();

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [emailNormal]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Email atau kata sandi salah',
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Email atau kata sandi salah',
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d',
            }
        );

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                puskesmas: user.puskesmas,
            },
        });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({
            error: 'Terjadi kesalahan server saat login',
        });
    }
}