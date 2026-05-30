import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/db.js';

import authRoutes from './routes/authRoutes.js';
import balitaRoutes from './routes/balitaRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
    ],
    credentials: true,
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Backend StuntingScan berjalan',
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/balita', balitaRoutes);
app.use('/api/predict', predictionRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/stats', statsRoutes);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Backend StuntingScan aktif. Gunakan endpoint /api/health');
});

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});