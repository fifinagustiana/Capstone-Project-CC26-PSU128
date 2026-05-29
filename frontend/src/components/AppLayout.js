import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './AppLayout.css';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
      <footer className="app-footer">
        <span>StuntingScan · CC26-PSU128 · Coding Camp 2026</span>
      </footer>
    </div>
  );
}
