import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',   exact: true },
  { to: '/data-balita', label: 'Data Balita' },
  { to: '/prediksi',    label: 'Prediksi' },
  { to: '/riwayat',     label: 'Riwayat' },
  { to: '/tentang',     label: 'Tentang' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <NavLink to="/" className="navbar-logo">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C10 2 4 5.5 4 11a6 6 0 0012 0c0-5.5-6-9-6-9z"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="10" cy="13" r="2" fill="currentColor"/>
          </svg>
          <span>StuntingScan</span>
        </NavLink>

        {/* Nav links */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {user && (
            <div className="user-info">
              <div className="user-text">
                <span className="user-puskesmas">{user.puskesmas || 'Puskesmas'}</span>
                <span className="user-nama">{user.nama || 'Bidan'}</span>
              </div>
            </div>
          )}
          <button className="btn-keluar" onClick={handleLogout}>Keluar</button>

          {/* Hamburger */}
          <button className="hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}
    </nav>
  );
}
