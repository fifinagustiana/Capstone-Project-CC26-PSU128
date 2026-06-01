import { apiFetch } from "../config/api";
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import "./Prediksi.css";

const WHO_HFA = {
  0: { L: { mean: 49.9, sd: 1.89 }, P: { mean: 49.1, sd: 1.86 } },
  3: { L: { mean: 61.4, sd: 2.31 }, P: { mean: 59.8, sd: 2.26 } },
  6: { L: { mean: 67.6, sd: 2.42 }, P: { mean: 65.7, sd: 2.41 } },
  9: { L: { mean: 72.0, sd: 2.54 }, P: { mean: 70.1, sd: 2.55 } },
  12: { L: { mean: 75.7, sd: 2.65 }, P: { mean: 74.0, sd: 2.69 } },
  18: { L: { mean: 82.3, sd: 2.88 }, P: { mean: 80.7, sd: 2.93 } },
  24: { L: { mean: 87.8, sd: 3.09 }, P: { mean: 86.4, sd: 3.17 } },
  36: { L: { mean: 96.1, sd: 3.48 }, P: { mean: 95.1, sd: 3.55 } },
  48: { L: { mean: 103.3, sd: 3.73 }, P: { mean: 102.7, sd: 3.81 } },
  60: { L: { mean: 110.0, sd: 4.0 }, P: { mean: 109.4, sd: 4.08 } },
};
function interpolate(usia, gk) {
  const keys = Object.keys(WHO_HFA)
    .map(Number)
    .sort((a, b) => a - b);
  const lo = Math.max(...keys.filter((k) => k <= usia)),
    hi = Math.min(...keys.filter((k) => k >= usia));
  if (lo === hi) return WHO_HFA[lo][gk];
  const t = (usia - lo) / (hi - lo);
  return {
    mean:
      WHO_HFA[lo][gk].mean + t * (WHO_HFA[hi][gk].mean - WHO_HFA[lo][gk].mean),
    sd: WHO_HFA[lo][gk].sd + t * (WHO_HFA[hi][gk].sd - WHO_HFA[lo][gk].sd),
  };
}
const SARAN = {
  Normal: [
    "Pertahankan pola makan seimbang",
    "Lanjutkan ASI/MPASI sesuai usia",
    "Rutin kontrol ke Posyandu tiap bulan",
    "Pastikan imunisasi lengkap",
  ],
  Tinggi: [
    "Tinggi di atas rata-rata, pantau terus",
    "Pastikan gizi tetap seimbang",
    "Konsultasi dokter anak untuk pemantauan lanjut",
  ],
  Stunting: [
    "Segera konsultasi dokter atau ahli gizi",
    "Tingkatkan protein hewani: telur, ikan, daging",
    "Berikan suplemen zat besi dan zinc",
    "Pantau tinggi badan tiap 2 minggu",
  ],
  "Severely Stunted": [
    "SEGERA rujuk ke Puskesmas/RS terdekat",
    "Intervensi gizi intensif diperlukan",
    "Pemeriksaan medis menyeluruh",
    "Konsultasi dokter spesialis anak",
  ],
};

export default function Prediksi() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const balitaIdParam = searchParams.get("balita_id");

  const [mode, setMode] = useState("pilih");
  const [daftar, setDaftar] = useState([]);
  const [selectedBalita, setSelectedBalita] = useState(null);
  const [form, setForm] = useState({
    balita_id: balitaIdParam || "",
    nama: "",
    jenis_kelamin: "Laki-laki",
    usia_bulan: "",
    berat_badan: "",
    tinggi_badan: "",
    lingkar_kepala: "",
    catatan: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/api/balita")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.data) ? d.data : [];
        setDaftar(list);
        if (balitaIdParam) {
          const f = list.find((b) => b.id === balitaIdParam);
          if (f) setSelectedBalita(f);
        }
      })
      .catch(() => {
        const local = JSON.parse(localStorage.getItem("ss_balita") || "[]");
        setDaftar(local);
        if (balitaIdParam) {
          const f = local.find((b) => b.id === balitaIdParam);
          if (f) setSelectedBalita(f);
        }
      });
  }, [balitaIdParam]);

  const hitungUsia = (tgl) => {
    if (!tgl) return null;
    const l = new Date(tgl),
      n = new Date();
    return Math.max(
      0,
      Math.min(
        60,
        (n.getFullYear() - l.getFullYear()) * 12 +
        (n.getMonth() - l.getMonth()),
      ),
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((ev) => ({ ...ev, [name]: undefined }));
    if (name === "balita_id")
      setSelectedBalita(daftar.find((b) => b.id === value) || null);
  };

  const validate = () => {
    const e = {};
    if (mode === "pilih" && !form.balita_id)
      e.balita_id = "Pilih balita terlebih dahulu";
    if (mode === "cepat") {
      if (!form.nama.trim()) e.nama = "Nama wajib diisi";
      if (!form.usia_bulan || form.usia_bulan < 0 || form.usia_bulan > 60)
        e.usia_bulan = "Usia 0–60 bulan";
    }
    if (!form.tinggi_badan || form.tinggi_badan < 30 || form.tinggi_badan > 130)
      e.tinggi_badan = "Tinggi 30–130 cm";
    if (!form.berat_badan || form.berat_badan < 0.5 || form.berat_badan > 30)
      e.berat_badan = "Berat 0.5–30 kg";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    let nama, jenis_kelamin, usia_bulan;
    if (mode === "pilih" && selectedBalita) {
      nama = selectedBalita.nama;
      jenis_kelamin = selectedBalita.jenis_kelamin;
      usia_bulan = hitungUsia(selectedBalita.tanggal_lahir) ?? 0;
    } else {
      nama = form.nama;
      jenis_kelamin = form.jenis_kelamin;
      usia_bulan = parseFloat(form.usia_bulan);
    }
    const payload = {
      nama,
      jenis_kelamin,
      usia_bulan,
      berat_badan: parseFloat(form.berat_badan),
      tinggi_badan: parseFloat(form.tinggi_badan),
      lingkar_kepala: form.lingkar_kepala
        ? parseFloat(form.lingkar_kepala)
        : null,
      balita_id: mode === "pilih" ? form.balita_id : null,
      catatan: form.catatan,
    };
    try {
      const res = await apiFetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Prediksi backend gagal:", data);
        alert(data.error || data.detail || "Prediksi gagal dari backend");
        setLoading(false);
        return;
      }

      navigate(`/hasil/${data.id}`, { state: { result: data } });
      setLoading(false);
      return;
    } catch (error) {
      console.error("Tidak bisa terhubung ke backend:", error);
      alert("Tidak bisa terhubung ke backend. Cek backend atau API AI.");
      setLoading(false);
      return;
    }
    // Fallback
    const gk = jenis_kelamin === "Laki-laki" ? "L" : "P";
    const ref = interpolate(usia_bulan, gk);
    const z = ((parseFloat(form.tinggi_badan) - ref.mean) / ref.sd).toFixed(2);
    let status, confidence;
    if (z < -3) {
      status = "Severely Stunted";
      confidence = 0.92;
    } else if (z < -2) {
      status = "Stunting";
      confidence = 0.88;
    } else if (z > 2) {
      status = "Tinggi";
      confidence = 0.87;
    } else {
      status = "Normal";
      confidence = 0.94;
    }
    const mock = {
      id: `demo-${Date.now()}`,
      ...payload,
      status,
      z_score_tb_u: parseFloat(z),
      confidence,
      saran: SARAN[status],
      tanggal: new Date().toISOString(),
      mode: "demo",
    };
    const hist = JSON.parse(
      localStorage.getItem("stuntingscan_history") || "[]",
    );
    hist.unshift(mock);
    localStorage.setItem(
      "stuntingscan_history",
      JSON.stringify(hist.slice(0, 100)),
    );
    navigate(`/hasil/${mock.id}`, { state: { result: mock } });
    setLoading(false);
  };

  const usiaTampil =
    mode === "pilih" && selectedBalita
      ? hitungUsia(selectedBalita.tanggal_lahir)
      : mode === "cepat" && form.usia_bulan
        ? parseInt(form.usia_bulan)
        : null;

  return (
    <div className="prediksi-page">
      <div className="prediksi-hero animate-fadeInUp">
        <div className="ph-badge">► ► ► Prediksi Baru</div>
        <h1 className="ph-title">Input Data Balita</h1>
        <p className="ph-desc">
          Pilih balita dari data tersimpan untuk pengisian cepat, atau gunakan
          mode cepat untuk input manual tanpa menyimpan identitas.
        </p>
      </div>
      <div className="prediksi-layout animate-fadeInUp delay-1">
        <div className="prediksi-left">
          {/* Mode toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === "pilih" ? "active" : ""}`}
              onClick={() => setMode("pilih")}
            >
              <span className="mode-btn-icon">☺</span>
              <div>
                <div className="mode-btn-title">Pilih Balita Tersimpan</div>
                <div className="mode-btn-sub">
                  Cocok untuk balita binaan yang rutin ke posyandu.
                </div>
              </div>
            </button>
            <button
              className={`mode-btn ${mode === "cepat" ? "active" : ""}`}
              onClick={() => setMode("cepat")}
            >
              <span className="mode-btn-icon">⚡</span>
              <div>
                <div className="mode-btn-title">Input Cepat</div>
                <div className="mode-btn-sub">
                  Langsung isi data tanpa menyimpan identitas balita.
                </div>
              </div>
            </button>
          </div>

          {/* Identitas */}
          <div className="form-section">
            {mode === "pilih" ? (
              <>
                <div className="section-heading">
                  <span className="section-icon lime">☺</span>
                  <span>Pilih Balita</span>
                </div>
                <div
                  className={`form-group ${errors.balita_id ? "has-error" : ""}`}
                >
                  {daftar.length === 0 ? (
                    <div className="no-balita-hint">
                      Belum ada data tersimpan.{" "}
                      <Link to="/data-balita">Tambah sekarang</Link>
                    </div>
                  ) : (
                    <select
                      name="balita_id"
                      value={form.balita_id}
                      onChange={handleChange}
                    >
                      <option value="">-- Pilih balita --</option>
                      {daftar.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nama} (
                          {b.jenis_kelamin === "Laki-laki" ? "♂" : "♀"} ·{" "}
                          {hitungUsia(b.tanggal_lahir)} bln)
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.balita_id && (
                    <span className="error-msg">{errors.balita_id}</span>
                  )}
                </div>
                {selectedBalita && (
                  <div className="selected-balita-card">
                    <div className="sbc-avatar">
                      {selectedBalita.nama?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="sbc-nama">{selectedBalita.nama}</div>
                      <div className="sbc-detail">
                        {selectedBalita.jenis_kelamin} ·{" "}
                        {hitungUsia(selectedBalita.tanggal_lahir)} bulan
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="section-heading">
                  <span className="section-icon lavender">☺</span>
                  <span>Identitas</span>
                </div>
                <div className="form-group-grid">
                  <div
                    className={`form-group full ${errors.nama ? "has-error" : ""}`}
                  >
                    <label>
                      Nama Lengkap Balita <span className="required">*</span>
                    </label>
                    <input
                      name="nama"
                      value={form.nama}
                      onChange={handleChange}
                      placeholder="Contoh: Aisyah Putri"
                    />
                    {errors.nama && (
                      <span className="error-msg">{errors.nama}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>
                      Jenis Kelamin <span className="required">*</span>
                    </label>
                    <div className="gender-toggle">
                      <button
                        type="button"
                        className={`gender-btn ${form.jenis_kelamin === "Laki-laki" ? "active" : ""}`}
                        onClick={() =>
                          setForm((f) => ({ ...f, jenis_kelamin: "Laki-laki" }))
                        }
                      >
                        Laki-laki
                      </button>
                      <button
                        type="button"
                        className={`gender-btn ${form.jenis_kelamin === "Perempuan" ? "active" : ""}`}
                        onClick={() =>
                          setForm((f) => ({ ...f, jenis_kelamin: "Perempuan" }))
                        }
                      >
                        Perempuan
                      </button>
                    </div>
                  </div>
                  <div
                    className={`form-group ${errors.usia_bulan ? "has-error" : ""}`}
                  >
                    <label>
                      Usia (bulan) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      name="usia_bulan"
                      value={form.usia_bulan}
                      onChange={handleChange}
                      placeholder="0–60"
                      min="0"
                      max="60"
                    />
                    {errors.usia_bulan && (
                      <span className="error-msg">{errors.usia_bulan}</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Antropometri */}
          <div className="form-section">
            <div className="section-heading">
              <span className="section-icon purple">✎</span>
              <span>Antropometri</span>
            </div>
            <div className="antro-grid">
              <div
                className={`antro-field ${errors.berat_badan ? "has-error" : ""}`}
              >
                <div className="antro-label">
                  Berat Badan (kg) <span className="required">*</span>
                  <span className="antro-range">0.5 – 30</span>
                </div>
                <div className="antro-input-wrap">
                  <span className="antro-icon">⊜</span>
                  <input
                    type="number"
                    name="berat_badan"
                    value={form.berat_badan}
                    onChange={handleChange}
                    placeholder="contoh: 9.5"
                    min="0.5"
                    max="30"
                    step="0.1"
                  />
                </div>
                {errors.berat_badan && (
                  <span className="error-msg">{errors.berat_badan}</span>
                )}
              </div>
              <div
                className={`antro-field ${errors.tinggi_badan ? "has-error" : ""}`}
              >
                <div className="antro-label">
                  Tinggi Badan (cm) <span className="required">*</span>
                  <span className="antro-range">30 – 130</span>
                </div>
                <div className="antro-input-wrap">
                  <span className="antro-icon">↕</span>
                  <input
                    type="number"
                    name="tinggi_badan"
                    value={form.tinggi_badan}
                    onChange={handleChange}
                    placeholder="contoh: 75"
                    min="30"
                    max="130"
                    step="0.1"
                  />
                </div>
                {errors.tinggi_badan && (
                  <span className="error-msg">{errors.tinggi_badan}</span>
                )}
              </div>
              <div className="antro-field">
                <div className="antro-label">
                  Lingkar Kepala (cm) <span className="optional">opsional</span>
                  <span className="antro-range">30 – 55</span>
                </div>
                <div className="antro-input-wrap">
                  <span className="antro-icon">◯</span>
                  <input
                    type="number"
                    name="lingkar_kepala"
                    value={form.lingkar_kepala}
                    onChange={handleChange}
                    placeholder="contoh: 45"
                    min="30"
                    max="55"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: "14px" }}>
              <label>
                Catatan <span className="optional">(opsional)</span>
              </label>
              <textarea
                name="catatan"
                value={form.catatan}
                onChange={handleChange}
                placeholder="Riwayat sakit, ASI eksklusif, dsb."
                rows={3}
              />
            </div>
          </div>

          <button
            className="btn-black submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Menganalisis...
              </>
            ) : (
              "Jalankan Prediksi →"
            )}
          </button>
        </div>

        {/* Right panel */}
        <div className="prediksi-right">
          <div className="panduan-card">
            <div className="panduan-badge">Panduan</div>
            <h3>Pengukuran Akurat</h3>
            <ul className="panduan-list">
              <li>Timbang berat badan tanpa pakaian tebal.</li>
              <li>
                Tinggi badan: <strong>berbaring</strong> untuk usia &lt;2 tahun,{" "}
                <strong>berdiri</strong> untuk usia ≥2 tahun.
              </li>
              <li>Lingkar kepala diukur di lingkar terbesar (di atas alis).</li>
              <li>Hasil mengikuti standar Z-Score WHO 2006.</li>
            </ul>
          </div>
          <div className="tahukah-card">
            <h3>Tahukah Anda?</h3>
            <p>
              Stunting dapat dicegah pada 1.000 hari pertama kehidupan dengan
              asupan gizi seimbang dan pemantauan rutin.
            </p>
          </div>
          {usiaTampil !== null && (
            <div className="usia-card">
              <span>Usia terdeteksi</span>
              <strong>{usiaTampil} bulan</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
