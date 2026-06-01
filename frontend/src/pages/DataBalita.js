import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './DataBalita.css';
import { apiFetch } from "../config/api";

const EMPTY_FORM = { nama: '', jenis_kelamin: '', tanggal_lahir: '', nama_ortu: '', no_hp: '', alamat: '', catatan: '' };
const STATUS_STYLE = {
  'Normal': { bg: '#DCFCE7', color: '#166534' },
  'Tinggi': { bg: '#DBEAFE', color: '#1E40AF' },
  'Stunting': { bg: '#FEF9C3', color: '#854D0E' },
  'Severely Stunted': { bg: '#FEE2E2', color: '#991B1B' },
};

function Modal({ show, onClose, children }) {
  const overlayRef = useRef();
  useEffect(() => {
    if (show) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [show]);
  if (!show) return null;
  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="modal-box animate-fadeInUp">
        {children}
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <p>{message}</p>
      <button onClick={onClose}>✕</button>
    </div>
  );
}

export default function DataBalita() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadBalita = () => {
    apiFetch('/api/balita').then(r => r.json())
      .then(d => setList(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []))
      .catch(() => setList(JSON.parse(localStorage.getItem('ss_balita') || '[]')));
  };

  useEffect(() => { loadBalita(); }, []);

  useEffect(() => {
    if (!selected) { setRiwayat([]); return; }
    apiFetch(`/api/history?balita_id=${selected.id}`)
      .then(r => r.json()).then(d => setRiwayat(Array.isArray(d?.data) ? d.data : []))
      .catch(() => {
        const all = JSON.parse(localStorage.getItem('stuntingscan_history') || '[]');
        setRiwayat(all.filter(h => h.balita_id === selected.id));
      });
  }, [selected]);

  const hitungUsia = (tgl) => {
    if (!tgl) return '-';
    const lahir = new Date(tgl), now = new Date();
    const bulan = Math.max(0, (now.getFullYear() - lahir.getFullYear()) * 12 + (now.getMonth() - lahir.getMonth()));
    return `${bulan} bulan`;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(ev => ({ ...ev, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.nama.trim()) e.nama = 'Nama wajib diisi';
    if (!form.jenis_kelamin) e.jenis_kelamin = 'Pilih jenis kelamin';
    if (!form.tanggal_lahir) e.tanggal_lahir = 'Tanggal lahir wajib diisi';
    if (!form.nama_ortu.trim()) e.nama_ortu = 'Nama orang tua wajib diisi';
    if (!form.no_hp.trim()) e.no_hp = 'Nomor HP wajib diisi';
    if (!form.alamat.trim()) e.alamat = 'Alamat wajib diisi';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = await apiFetch('/api/balita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        loadBalita();
        showToast('Data balita berhasil disimpan!');
      } else throw new Error();
    } catch {
      const existing = JSON.parse(localStorage.getItem('ss_balita') || '[]');
      const nb = { ...form, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
      existing.unshift(nb);
      localStorage.setItem('ss_balita', JSON.stringify(existing));
      setList(existing);
      showToast('Data balita berhasil disimpan!');
    }
    setForm(EMPTY_FORM); setErrors({}); setShowModal(false); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data balita ini?')) return;
    try {
      await apiFetch(`/api/balita/${id}`, { method: 'DELETE' });
      loadBalita();
    } catch {
      const existing = JSON.parse(localStorage.getItem('ss_balita') || '[]');
      const updated = existing.filter(b => b.id !== id);
      localStorage.setItem('ss_balita', JSON.stringify(updated));
      setList(updated);
    }
    if (selected?.id === id) setSelected(null);
    showToast('Data balita berhasil dihapus.', 'error');
  };

  const openModal = () => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true); };

  const filtered = list.filter(b =>
    b.nama?.toLowerCase().includes(search.toLowerCase()) ||
    b.nama_ortu?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="data-balita-page">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero */}
      <div className="db-hero animate-fadeInUp">
        <div>
          <div className="dbh-badge">► ► ► Data Balita</div>
          <h1 className="dbh-title">Daftar Balita Binaan</h1>
          <p className="dbh-desc">Kelola data balita yang rutin diperiksa. Data tersimpan dapat dipilih langsung saat membuat prediksi baru.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="db-controls animate-fadeInUp delay-1">
        <div className="search-box">
          <span className="si">⌕</span>
          <input placeholder="Cari nama balita atau orang tua..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn-black" onClick={openModal}>+ Input Data Balita</button>
      </div>

      {/* Balita grid cards */}
      {filtered.length === 0 ? (
        <div className="db-empty animate-fadeInUp delay-2">
          <div className="db-empty-icon">👶</div>
          <h3>Belum ada data balita</h3>
          <p>Tambahkan data balita binaan agar pengisian prediksi rutin lebih cepat.</p>
          <button className="btn-black" onClick={openModal}>+ Input Data Balita</button>
        </div>
      ) : (
        <div className="balita-grid animate-fadeInUp delay-2">
          {filtered.map((b, i) => {
            const isL = b.jenis_kelamin === 'Laki-laki';
            return (
              <div key={b.id} className={`balita-card ${selected?.id === b.id ? 'active' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="bc-top" onClick={() => setSelected(selected?.id === b.id ? null : b)}>
                  <div className="bc-avatar" style={{
                    background: isL ? '#DBEAFE' : '#FCE7F3',
                    color: isL ? '#1E40AF' : '#9D174D',
                  }}>
                    {b.nama?.[0]?.toUpperCase()}
                  </div>
                  <div className="bc-info">
                    <div className="bc-nama">{b.nama}</div>
                    <div className="bc-detail">
                      {isL ? '♂' : '♀'} · {hitungUsia(b.tanggal_lahir)}
                    </div>
                    {b.nama_ortu && <div className="bc-ortu">Ortu: {b.nama_ortu}</div>}
                  </div>
                  <div className="bc-arrow">{selected?.id === b.id ? '▲' : '▼'}</div>
                </div>

                {/* Expanded detail */}
                {selected?.id === b.id && (
                  <div className="bc-detail-panel animate-fadeIn">
                    <div className="bc-detail-grid">
                      {b.tanggal_lahir && <div><span>Tgl Lahir</span><strong>{new Date(b.tanggal_lahir).toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong></div>}
                      {b.no_hp && <div><span>No. HP</span><strong>{b.no_hp}</strong></div>}
                      {b.alamat && <div className="full"><span>Alamat</span><strong>{b.alamat}</strong></div>}
                      {b.catatan && <div className="full"><span>Catatan</span><strong>{b.catatan}</strong></div>}
                    </div>

                    {/* Riwayat */}
                    <div className="bc-riwayat">
                      <div className="bc-rw-title">Riwayat Pengukuran ({riwayat.length})</div>
                      {riwayat.length === 0 ? (
                        <div className="bc-rw-empty">Belum ada riwayat pengukuran.</div>
                      ) : (
                        <div className="bc-rw-list">
                          {riwayat.map((r, i) => {
                            const s = STATUS_STYLE[r.status] || { bg: '#F5F5F4', color: '#78716C' };
                            return (
                              <div key={r.id || i} className="bc-rw-item"
                                onClick={() => navigate(`/hasil/${r.id}`, { state: { result: r } })}>
                                <span className="rw-tgl">{r.tanggal ? new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
                                <span className="rw-tb">{r.tinggi_badan} cm</span>
                                <span className="rw-z" style={{ color: Math.abs(r.z_score_tb_u || 0) > 2 ? '#991B1B' : 'var(--gray-400)' }}>
                                  Z: {r.z_score_tb_u ?? '-'}
                                </span>
                                <span className="rw-status" style={{ background: s.bg, color: s.color }}>{r.status}</span>
                                <span className="rw-arr">→</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="bc-actions">
                      <button className="btn-ukur" onClick={() => navigate(`/prediksi?balita_id=${b.id}`)}>+ Ukur Sekarang</button>
                      <button className="btn-del" onClick={() => handleDelete(b.id)}>Hapus</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      <Modal show={showModal} onClose={() => { setShowModal(false); setErrors({}); }}>
        <div className="modal-header">
          <h3>Input Data Balita</h3>
          <button className="modal-close" onClick={() => { setShowModal(false); setErrors({}); }}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-section-label">Identitas Balita</div>
          <div className="mf-grid">
            <div className={`mf-group full ${errors.nama ? 'has-error' : ''}`}>
              <label>Nama Lengkap <span className="required">*</span></label>
              <input name="nama" value={form.nama} onChange={handleChange} placeholder="Nama balita" />
              {errors.nama && <span className="error-msg">{errors.nama}</span>}
            </div>
            <div className={`mf-group ${errors.jenis_kelamin ? 'has-error' : ''}`}>
              <label>Jenis Kelamin <span className="required">*</span></label>
              <div className="mf-radio">
                {['Laki-laki', 'Perempuan'].map(g => (
                  <button key={g} type="button"
                    className={`mf-radio-btn ${form.jenis_kelamin === g ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, jenis_kelamin: g }))}>
                    {g === 'Laki-laki' ? '♂' : '♀'} {g}
                  </button>
                ))}
              </div>
              {errors.jenis_kelamin && <span className="error-msg">{errors.jenis_kelamin}</span>}
            </div>
            <div className={`mf-group ${errors.tanggal_lahir ? 'has-error' : ''}`}>
              <label>Tanggal Lahir <span className="required">*</span></label>
              <input type="date" name="tanggal_lahir" value={form.tanggal_lahir}
                onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
              {errors.tanggal_lahir && <span className="error-msg">{errors.tanggal_lahir}</span>}
            </div>
          </div>

          <div className="modal-section-label" style={{ marginTop: '16px' }}>Data Orang Tua</div>
          <div className="mf-grid">
            <div className={`mf-group full ${errors.nama_ortu ? 'has-error' : ''}`}>
              <label>Nama Orang Tua <span className="required">*</span></label>
              <input name="nama_ortu" value={form.nama_ortu} onChange={handleChange} placeholder="Nama ibu/ayah" />
              {errors.nama_ortu && <span className="error-msg">{errors.nama_ortu}</span>}
            </div>
            <div className={`mf-group ${errors.no_hp ? 'has-error' : ''}`}>
              <label>Nomor HP <span className="required">*</span></label>
              <input name="no_hp" value={form.no_hp} onChange={handleChange} placeholder="08xx-xxxx-xxxx" />
              {errors.no_hp && <span className="error-msg">{errors.no_hp}</span>}
            </div>
            <div className={`mf-group ${errors.alamat ? 'has-error' : ''}`}>
              <label>Alamat <span className="required">*</span></label>
              <input name="alamat" value={form.alamat} onChange={handleChange} placeholder="Alamat lengkap" />
              {errors.alamat && <span className="error-msg">{errors.alamat}</span>}
            </div>
            <div className="mf-group full">
              <label>Catatan <span className="optional">(opsional)</span></label>
              <textarea name="catatan" value={form.catatan} onChange={handleChange}
                placeholder="Riwayat kesehatan, kondisi khusus, dll." rows={2} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-outline" onClick={() => { setShowModal(false); setErrors({}); }}>Batal</button>
          <button className="btn-black" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" />Menyimpan...</> : 'Simpan Data Balita'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
