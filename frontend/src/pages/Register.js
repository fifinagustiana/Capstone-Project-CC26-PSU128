import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', puskesmas: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nama.trim()) { setError('Nama wajib diisi'); return; }
    if (!form.email.trim()) { setError('Email wajib diisi'); return; }
    if (!form.password) { setError('Kata sandi wajib diisi'); return; }
    if (form.password.length < 6) { setError('Kata sandi minimal 6 karakter'); return; }

    setLoading(true);
    setError('');
    const result = await register(form);
    setLoading(false);

    if (result.success) {
      // Tampilkan pesan sukses sebentar, lalu redirect ke login
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message);
    }
  };

  if (success) {
    return (
      <div className="auth-page register-page">
        <div className="register-wrap">
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>Akun berhasil dibuat!</h2>
            <p>Mengalihkan ke halaman masuk...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page register-page">
      <div className="register-wrap">
        <div className="auth-logo" style={{ marginBottom: '28px' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C10 2 4 5.5 4 11a6 6 0 0012 0c0-5.5-6-9-6-9z"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="10" cy="13" r="2" fill="currentColor"/>
          </svg>
          <span>StuntingScan</span>
        </div>

        <h2 className="auth-form-title">Daftar sebagai Bidan</h2>
        <p className="auth-form-sub">Buat akun untuk mulai memantau status gizi balita.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nama lengkap</label>
            <input
              name="nama" value={form.nama} onChange={handleChange}
              placeholder="Bidan Aminah" autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label>Puskesmas / Klinik <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(opsional)</span></label>
            <input
              name="puskesmas" value={form.puskesmas} onChange={handleChange}
              placeholder="Puskesmas Sehat"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="nama@contoh.id" autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Kata sandi</label>
            <div className="password-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                name="password" value={form.password} onChange={handleChange}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-black w-full" disabled={loading}>
            {loading ? <><span className="spinner" />Membuat akun...</> : 'Buat akun'}
          </button>
        </form>

        <p className="auth-switch">
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
