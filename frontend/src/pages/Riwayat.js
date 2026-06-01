import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Riwayat.css';
import { apiFetch } from "../config/api";

const STATUS_STYLE = {
  'Normal': { bg: '#DCFCE7', color: '#166534' },
  'Tinggi': { bg: '#DBEAFE', color: '#1E40AF' },
  'Stunting': { bg: '#FEF9C3', color: '#854D0E' },
  'Severely Stunted': { bg: '#FEE2E2', color: '#991B1B' },
};

export default function Riwayat() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({}); // { namaBalita: bool }

  useEffect(() => {
    apiFetch('/api/history?per_page=200')
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d?.data) ? d.data : []); setLoading(false); })
      .catch(() => {
        const local = JSON.parse(localStorage.getItem('stuntingscan_history') || '[]');
        setData(local);
        setLoading(false);
      });
  }, []);

  const filters = ['Semua', 'Normal', 'Tinggi', 'Stunting', 'Severely Stunted'];

  // Filter data
  const filtered = data.filter(item => {
    const matchFilter = filter === 'Semua' || item.status === filter;
    const matchSearch = item.nama?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Group by nama balita
  const grouped = filtered.reduce((acc, item) => {
    const key = item.balita_id || item.nama; // group by balita_id kalau ada, fallback ke nama
    if (!acc[key]) {
      acc[key] = {
        nama: item.nama,
        jenis_kelamin: item.jenis_kelamin,
        balita_id: item.balita_id,
        riwayat: [],
      };
    }
    acc[key].riwayat.push(item);
    return acc;
  }, {});

  const groupedList = Object.values(grouped).sort((a, b) => {
    // Sort by tanggal terbaru dari masing-masing grup
    const latestA = new Date(a.riwayat[0]?.tanggal || 0);
    const latestB = new Date(b.riwayat[0]?.tanggal || 0);
    return latestB - latestA;
  });

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="riwayat-page">
      {/* Hero */}
      <div className="riwayat-hero animate-fadeInUp">
        <div className="rh-badge">► ► ► Riwayat</div>
        <h1 className="rh-title">Riwayat Pemeriksaan</h1>
        <p className="rh-desc">Semua hasil prediksi yang pernah dilakukan tersimpan di sini.</p>
      </div>

      {/* Controls */}
      <div className="riwayat-controls animate-fadeInUp delay-1">
        <div className="search-box">
          <span className="si">⌕</span>
          <input placeholder="Cari nama balita..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn-purple" onClick={() => navigate('/prediksi')}>+ Prediksi Baru</button>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs animate-fadeInUp delay-2">
        {filters.map(f => (
          <button key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* Ringkasan */}
      {!loading && groupedList.length > 0 && (
        <div className="riwayat-summary animate-fadeInUp delay-2">
          <span>📋 {groupedList.length} balita</span>
          <span>·</span>
          <span>🔍 {filtered.length} total pemeriksaan</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="riwayat-loading">
          <div className="spinner-dark" />
          <span>Memuat data...</span>
        </div>
      ) : groupedList.length === 0 ? (
        <div className="riwayat-empty animate-fadeInUp delay-3">
          <div className="re-icon">✦</div>
          <h3>{search || filter !== 'Semua' ? 'Tidak ada hasil' : 'Belum ada data prediksi.'}</h3>
          <p>{search || filter !== 'Semua' ? 'Coba ubah kata kunci atau filter.' : ''}</p>
        </div>
      ) : (
        <div className="riwayat-grouped animate-fadeInUp delay-3">
          {groupedList.map((group, gi) => {
            const isL = group.jenis_kelamin === 'Laki-laki';
            const key = group.balita_id || group.nama;
            const isOpen = expanded[key];
            const latest = group.riwayat[0];
            const latestStyle = STATUS_STYLE[latest?.status] || { bg: '#F5F5F4', color: '#78716C' };

            return (
              <div key={key} className="riwayat-group" style={{ animationDelay: `${gi * 0.05}s` }}>
                {/* Group header — klik untuk expand */}
                <div className="rg-header" onClick={() => toggleExpand(key)}>
                  <div className="rg-avatar" style={{
                    background: isL ? '#DBEAFE' : '#FCE7F3',
                    color: isL ? '#1E40AF' : '#9D174D',
                  }}>
                    {group.nama?.[0]?.toUpperCase()}
                  </div>
                  <div className="rg-info">
                    <div className="rg-nama">{group.nama}</div>
                    <div className="rg-meta">
                      {isL ? '♂' : '♀'} ·
                      <span className="rg-count">{group.riwayat.length}x pemeriksaan</span>
                      · Terakhir: {latest?.tanggal ? new Date(latest.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </div>
                  </div>
                  <div className="rg-right">
                    <span className="rg-status" style={{ background: latestStyle.bg, color: latestStyle.color }}>
                      {latest?.status}
                    </span>
                    <span className="rg-arrow">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Riwayat rows */}
                {isOpen && (
                  <div className="rg-detail animate-fadeIn">
                    <div className="rg-detail-header">
                      <span>Tanggal</span>
                      <span>Usia</span>
                      <span>TB</span>
                      <span>BB</span>
                      <span>Z-Score</span>
                      <span>Status</span>
                      <span></span>
                    </div>
                    {group.riwayat.map((r, i) => {
                      const s = STATUS_STYLE[r.status] || { bg: '#F5F5F4', color: '#78716C' };
                      return (
                        <div key={r.id || i} className="rg-row"
                          onClick={() => navigate(`/hasil/${r.id}`, { state: { result: r } })}>
                          <span className="rg-tgl">
                            {r.tanggal ? new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                          <span>{r.usia_bulan} bln</span>
                          <span className="rg-bold">{r.tinggi_badan} cm</span>
                          <span>{r.berat_badan ? `${r.berat_badan} kg` : '-'}</span>
                          <span className="rg-z" style={{ color: Math.abs(r.z_score_tb_u || 0) > 2 ? '#991B1B' : 'var(--gray-500)' }}>
                            {r.z_score_tb_u ?? '-'}
                          </span>
                          <span>
                            <span className="rg-status-pill" style={{ background: s.bg, color: s.color }}>
                              {r.status}
                            </span>
                          </span>
                          <span className="rg-detail-arrow">→</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
