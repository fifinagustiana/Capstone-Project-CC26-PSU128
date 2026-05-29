import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    // Pre-fill email jika baru saja daftar
    const hintEmail = localStorage.getItem('ss_hint_email');
    if (hintEmail) {
      setForm(f => ({ ...f, email: hintEmail }));
      setJustRegistered(true);
      localStorage.removeItem('ss_hint_email');
    }
  }, []);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Email dan kata sandi wajib diisi'); return; }
    setLoading(true);
    setError('');
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) navigate('/');
    else setError(result.message);
  };

  return (
    <div className="auth-page">
      {/* LEFT — lime panel */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-logo">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C10 2 4 5.5 4 11a6 6 0 0012 0c0-5.5-6-9-6-9z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="13" r="2" fill="currentColor"/>
            </svg>
            <span>StuntingScan</span>
          </div>
          <div className="auth-left-content">
            <h1 className="auth-left-title">
              Bantu Bidan deteksi stunting lebih dini.
            </h1>
            <p className="auth-left-desc">
              Klasifikasi status gizi otomatis berbasis standar WHO. Cepat, akurat, dan dirancang untuk lapangan.
            </p>
          </div>
          <div className="auth-left-tags">
            <span className="auth-tag dark">Coding Camp 2026</span>
            <span className="auth-tag light">CC26-PSU128</span>
          </div>
        </div>
        <div className="wavy-lines">
          {[1,2,3,4].map(i => <div key={i} className={`wavy-line wavy-${i}`} />)}
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-badge">Masuk Bidan</div>
          <h2 className="auth-form-title">Selamat datang.</h2>
          <p className="auth-form-sub">
            Masuk untuk melanjutkan pemantauan tumbuh kembang balita.
          </p>

          {/* Banner baru daftar */}
          {justRegistered && (
            <div className="registered-banner">
              ✓ Akun berhasil dibuat! Silakan masuk dengan email dan kata sandi Anda.
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="bidan@demo.id"
                autoComplete="email" autoFocus={!justRegistered}
              />
            </div>

            <div className="form-group">
              <label>Kata sandi</label>
              <div className="password-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} placeholder="••••••••"
                  autoComplete="current-password"
                  autoFocus={justRegistered}
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
              {loading ? <><span className="spinner" />Masuk...</> : 'Masuk →'}
            </button>
          </form>

          <div className="demo-hint">
            <span className="demo-label">Akun demo</span>
            <span>Email: bidan@demo.id · Sandi: demo123</span>
          </div>

          <p className="auth-switch">
            Belum punya akun? <Link to="/register">Daftar di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
