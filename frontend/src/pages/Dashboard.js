import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Dashboard.css';
import { apiFetch } from "../config/api";

const MOCK_STATS = { totalPrediksi: 0, bulanIni: 0, normal: 0, stunting: 0, severely: 0, tinggi: 0 };
const MOCK_TREND = [
  { bulan: 'Jan', normal: 0, stunting: 0 },
  { bulan: 'Feb', normal: 0, stunting: 0 },
  { bulan: 'Mar', normal: 0, stunting: 0 },
  { bulan: 'Apr', normal: 0, stunting: 0 },
  { bulan: 'Mei', normal: 0, stunting: 0 },
  { bulan: 'Jun', normal: 0, stunting: 0 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(MOCK_STATS);
  const [recentData, setRecentData] = useState([]);

  useEffect(() => {
    apiFetch('/api/stats').then(r => r.json()).then(d => d && setStats(d)).catch(() => { });
    apiFetch('/api/history?per_page=5').then(r => r.json())
      .then(d => setRecentData(Array.isArray(d?.data) ? d.data : []))
      .catch(() => {
        const local = JSON.parse(localStorage.getItem('stuntingscan_history') || '[]');
        setRecentData(local.slice(0, 5));
      });
  }, []);

  const pieData = [
    { name: 'Normal', value: stats.normal || 0 },
    { name: 'Stunting', value: (stats.stunting || 0) + (stats.severely || 0) },
    { name: 'Lainnya', value: stats.tinggi || 0 },
  ];
  const PIE_COLORS = ['#7C3AED', '#F472B6', '#CBFF4D'];

  const STATUS_STYLE = {
    'Normal': { bg: 'var(--normal-bg)', color: 'var(--normal-text)' },
    'Tinggi': { bg: 'var(--tinggi-bg)', color: 'var(--tinggi-text)' },
    'Stunting': { bg: 'var(--stunting-bg)', color: 'var(--stunting-text)' },
    'Severely Stunted': { bg: 'var(--severe-bg)', color: 'var(--severe-text)' },
  };

  return (
    <div className="dashboard">
      {/* Hero */}
      <div className="db-hero animate-fadeInUp">
        <div className="db-hero-left">
          <div className="db-greeting">► ► ► Selamat datang</div>
          <h1 className="db-title">Halo, {user?.nama?.split(' ')[0] || 'Bidan'}</h1>
          <p className="db-desc">Pantau tumbuh kembang balita secara real-time. Mulai prediksi baru atau tinjau riwayat pemeriksaan terakhir.</p>
          <div className="db-actions">
            <button className="btn-purple" onClick={() => navigate('/prediksi')}>+ Prediksi Baru</button>
            <button className="btn-outline" onClick={() => navigate('/riwayat')}>Lihat Riwayat ↗</button>
          </div>
        </div>
        <div className="db-hero-right">
          <div className="db-total-card">
            <div className="dtc-icon">〜</div>
            <div className="dtc-label">TOTAL PEMERIKSAAN</div>
            <div className="dtc-num">{stats.totalPrediksi}</div>
            <div className="dtc-sub">↑ data tersimpan</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="db-stats animate-fadeInUp delay-1">
        <div className="stat-card" style={{ background: 'var(--severe-bg)' }}>
          <div className="sc-label" style={{ color: 'var(--severe-text)' }}>SEVERELY STUNTED</div>
          <div className="sc-num" style={{ color: 'var(--severe-text)' }}>{stats.severely || 0}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--stunting-bg)' }}>
          <div className="sc-label" style={{ color: 'var(--stunting-text)' }}>STUNTING</div>
          <div className="sc-num" style={{ color: 'var(--stunting-text)' }}>{stats.stunting || 0}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--lime)' }}>
          <div className="sc-label">NORMAL</div>
          <div className="sc-num">{stats.normal || 0}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--tinggi-bg)' }}>
          <div className="sc-label" style={{ color: 'var(--tinggi-text)' }}>TINGGI</div>
          <div className="sc-num" style={{ color: 'var(--tinggi-text)' }}>{stats.tinggi || 0}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="db-charts animate-fadeInUp delay-2">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Tren 6 Bulan</h3>
            <span className="chart-tag">2026</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_TREND} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--black)', border: 'none', borderRadius: 10, color: 'white', fontSize: 12 }} />
              <Bar dataKey="normal" fill="#CBFF4D" radius={[4, 4, 0, 0]} name="Normal" />
              <Bar dataKey="stunting" fill="#C4B5FD" radius={[4, 4, 0, 0]} name="Stunting" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header"><h3>Distribusi</h3></div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend-list">
            {pieData.map((item, i) => (
              <div key={i} className="pll-item">
                <span className="pll-dot" style={{ background: PIE_COLORS[i] }} />
                <span>{item.name}</span>
                <span className="pll-val">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent */}
      <div className="db-recent animate-fadeInUp delay-3">
        <div className="recent-header">
          <h3>Pemeriksaan Terbaru</h3>
          <button className="btn-text" onClick={() => navigate('/riwayat')}>Lihat semua →</button>
        </div>
        {recentData.length === 0 ? (
          <div className="recent-empty">
            <div className="re-icon">✦</div>
            <p>Belum ada data. Mulai dengan prediksi pertama.</p>
            <button className="btn-purple" onClick={() => navigate('/prediksi')}>+ Prediksi Baru</button>
          </div>
        ) : (
          <div className="recent-list">
            {recentData.map((r, i) => (
              <div key={r.id || i} className="recent-item" onClick={() => navigate(`/hasil/${r.id}`, { state: { result: r } })}>
                <div className="ri-avatar">{r.nama?.[0]?.toUpperCase()}</div>
                <div className="ri-info">
                  <div className="ri-nama">{r.nama}</div>
                  <div className="ri-detail">{r.usia_bulan} bln · {new Date(r.tanggal).toLocaleDateString('id-ID')}</div>
                </div>
                <span className="ri-status" style={STATUS_STYLE[r.status] || { bg: 'var(--gray-100)', color: 'var(--gray-500)' }}>
                  {r.status}
                </span>
                <span className="ri-arrow">→</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
