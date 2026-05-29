import React from 'react';
import './TentangKami.css';

const TEAM = [
  { nama: 'Fifin Agustiana',    kode: 'CFCC381D6X2517', peran: 'Full-Stack Developer' },
  { nama: 'N. Muhammad Azqi',   kode: 'CFCC390D6Y1147', peran: 'Full-Stack Developer' },
  { nama: 'Dina Surya Susanti', kode: 'CDCC525D6X0084', peran: 'Data Scientist' },
  { nama: 'Anisatu Hasanah',    kode: 'CDCC525D6X0262', peran: 'Data Scientist' },
  { nama: "A'Af Fatihul Ihsan", kode: 'CACC447D6Y0808', peran: 'AI Engineer' },
  { nama: 'Asa Setia Bekti',    kode: 'CACC347D6Y1505', peran: 'AI Engineer' },
];

const STACK = ['React.js', 'Flask', 'TensorFlow', 'PostgreSQL', 'WHO Z-Score', 'Recharts'];

export default function TentangKami() {
  return (
    <div className="tentang-page">
      {/* Hero */}
      <div className="tentang-hero animate-fadeInUp">
        <div className="th-badge">► ► ► Tentang Kami</div>
        <h1 className="th-title">Membantu Bidan<br />menjangkau lebih<br />banyak balita.</h1>
        <p className="th-desc">
          StuntingScan adalah produk Capstone Project Coding Camp 2026 (CC26-PSU128) yang
          dirancang untuk mendukung deteksi dini stunting di Indonesia.
        </p>
      </div>

      {/* Value cards */}
      <div className="value-cards animate-fadeInUp delay-1">
        <div className="value-card" style={{ background: 'var(--lavender-bg)' }}>
          <div className="vc-icon">♡</div>
          <h3>Misi</h3>
          <p>Menurunkan angka stunting nasional dengan teknologi yang mudah diakses tenaga kesehatan.</p>
        </div>
        <div className="value-card" style={{ background: 'var(--lavender)' }}>
          <div className="vc-icon">✦</div>
          <h3>Inovasi</h3>
          <p>Klasifikasi status gizi otomatis berbasis Deep Learning dan standar WHO 2006.</p>
        </div>
        <div className="value-card" style={{ background: 'var(--pink)' }}>
          <div className="vc-icon">◎</div>
          <h3>Komunitas</h3>
          <p>Dirancang bersama Bidan dan tenaga Posyandu untuk solusi yang relevan di lapangan.</p>
        </div>
      </div>

      {/* Team */}
      <div className="team-section animate-fadeInUp delay-2">
        <h2>Tim CC26-PSU128</h2>
        <p className="team-sub">Capstone Project · Coding Camp 2026 powered by DBS Foundation.</p>
        <div className="team-grid">
          {TEAM.map((m, i) => (
            <div key={i} className="team-card" style={{ animationDelay: `${i*0.06}s` }}>
              <div className="tc-avatar">{m.nama[0]}</div>
              <div className="tc-info">
                <div className="tc-nama">{m.nama}</div>
                <div className="tc-peran">{m.peran}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stack */}
      <div className="stack-section animate-fadeInUp delay-3">
        <div className="stack-label">&lt;/&gt;</div>
        <h2>Stack Teknologi</h2>
        <div className="stack-tags">
          {STACK.map((s, i) => (
            <span key={i} className="stack-tag">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
