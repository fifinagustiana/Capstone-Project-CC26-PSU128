import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Prediksi from './pages/Prediksi';
import DataBalita from './pages/DataBalita';
import Riwayat from './pages/Riwayat';
import HasilPrediksi from './pages/HasilPrediksi';
import TentangKami from './pages/TentangKami';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font-body)',color:'var(--gray-400)'}}>Memuat...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected */}
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index          element={<Dashboard />} />
            <Route path="prediksi"    element={<Prediksi />} />
            <Route path="data-balita" element={<DataBalita />} />
            <Route path="hasil/:id"   element={<HasilPrediksi />} />
            <Route path="riwayat"     element={<Riwayat />} />
            <Route path="tentang"     element={<TentangKami />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
