import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ss_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const emailNorm = email.trim().toLowerCase();

    // Coba API backend dulu
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailNorm, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const userData = { ...data.user, token: data.token };
        setUser(userData);
        localStorage.setItem('ss_user', JSON.stringify(userData));
        return { success: true };
      }
      const err = await res.json();
      return { success: false, message: err.error || 'Email atau kata sandi salah' };
    } catch {
      // Backend tidak tersedia — cek akun offline di localStorage
      const accounts = JSON.parse(localStorage.getItem('ss_accounts') || '{}');
      const account = accounts[emailNorm];

      if (account && account.password === password) {
        const userData = { id: account.id, nama: account.nama, email: account.email, puskesmas: account.puskesmas, mode: 'offline' };
        setUser(userData);
        localStorage.setItem('ss_user', JSON.stringify(userData));
        return { success: true };
      }

      // Demo account fallback
      if (emailNorm === 'bidan@demo.id' && password === 'demo123') {
        const demoUser = { id: 'demo', nama: 'Aminah', email: emailNorm, puskesmas: 'Puskesmas Sehat', mode: 'demo' };
        setUser(demoUser);
        localStorage.setItem('ss_user', JSON.stringify(demoUser));
        return { success: true };
      }

      return { success: false, message: 'Email atau kata sandi salah' };
    }
  };

  const register = async (data) => {
    const emailNorm = data.email.trim().toLowerCase();

    // Coba API backend dulu
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, email: emailNorm }),
      });
      if (res.ok) {
        // Berhasil — TIDAK auto-login, redirect ke halaman login
        localStorage.setItem('ss_hint_email', emailNorm);
        return { success: true };
      }
      const err = await res.json();
      return { success: false, message: err.error || 'Registrasi gagal' };
    } catch {
      // Backend tidak tersedia — simpan akun ke localStorage
      const accounts = JSON.parse(localStorage.getItem('ss_accounts') || '{}');
      if (accounts[emailNorm]) {
        return { success: false, message: 'Email sudah terdaftar' };
      }
      accounts[emailNorm] = {
        id: `local-${Date.now()}`,
        nama: data.nama,
        email: emailNorm,
        password: data.password,
        puskesmas: data.puskesmas || '',
        mode: 'offline',
      };
      localStorage.setItem('ss_accounts', JSON.stringify(accounts));
      localStorage.setItem('ss_hint_email', emailNorm);
      // Berhasil — TIDAK auto-login
      return { success: true };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ss_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
