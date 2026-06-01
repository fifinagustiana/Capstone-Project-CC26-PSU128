import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./HasilPrediksi.css";

const STATUS_CFG = {
  Normal: {
    color: "#166534",
    bg: "#DCFCE7",
    border: "#BBF7D0",
    icon: "✓",
    label: "Normal",
  },
  Tinggi: {
    color: "#1E40AF",
    bg: "#DBEAFE",
    border: "#BFDBFE",
    icon: "↑",
    label: "Tinggi",
  },
  Stunting: {
    color: "#854D0E",
    bg: "#FEF9C3",
    border: "#FEF08A",
    icon: "⚠",
    label: "Stunting",
  },
  "Severely Stunted": {
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#FECACA",
    icon: "!",
    label: "Severely Stunted",
  },
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      <span>{type === "success" ? "✓" : "ℹ"}</span>
      <p>{message}</p>
      <button onClick={onClose}>✕</button>
    </div>
  );
}

export default function HasilPrediksi() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;

  const [saran, setSaran] = useState(null);
  const [loadingSaran, setLoadingSaran] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  useEffect(() => {
    if (!result) return;
    generateSaran();
  }, []);

  const parseGeminiRecommendation = (text) => {
    if (!text) return null;

    const cleanText = text
      .replace(/\r/g, "")
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .trim();

    const lines = cleanText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const getSectionLines = (startKeywords, endKeywords = []) => {
      let isCapturing = false;
      const sectionLines = [];

      for (const line of lines) {
        const lowerLine = line.toLowerCase();

        const isStart = startKeywords.some((keyword) =>
          lowerLine.includes(keyword.toLowerCase())
        );

        const isEnd = endKeywords.some((keyword) =>
          lowerLine.includes(keyword.toLowerCase())
        );

        if (isStart) {
          isCapturing = true;
          continue;
        }

        if (isCapturing && isEnd) {
          break;
        }

        if (isCapturing) {
          sectionLines.push(line);
        }
      }

      return sectionLines;
    };

    const toList = (sectionLines) => {
      return sectionLines
        .map((item) =>
          item
            .replace(/^[-*•]\s*/, "")
            .replace(/^\d+\.\s*/, "")
            .replace(/^["']|["']$/g, "")
            .trim()
        )
        .filter(Boolean);
    };

    const analisisLines = getSectionLines(
      ["Analisis Kondisi"],
      ["Nutrisi", "PMT"]
    );

    const nutrisiLines = getSectionLines(
      ["Nutrisi", "PMT"],
      ["Pola Asuh", "Sanitasi"]
    );

    const polaAsuhLines = getSectionLines(
      ["Pola Asuh", "Sanitasi"],
      ["Konsultasi", "Medis"]
    );

    const konsultasiLines = getSectionLines(
      ["Konsultasi", "Medis"],
      []
    );

    return {
      analisis:
        analisisLines.join(" ") ||
        `Anak dengan tinggi ${result.tinggi_badan} cm pada usia ${result.usia_bulan} bulan menunjukkan status ${result.status} berdasarkan hasil prediksi.`,
      nutrisi: toList(nutrisiLines),
      pola_asuh: toList(polaAsuhLines),
      konsultasi:
        konsultasiLines.join(" ") ||
        "Lakukan kunjungan rutin setiap bulan ke Puskesmas atau Posyandu untuk pemantauan tumbuh kembang.",
    };
  };

  const generateSaran = () => {
    setLoadingSaran(true);

    const rekomendasiText =
      result.rekomendasi_gemini || result.ai_response?.rekomendasi_gemini;

    if (rekomendasiText) {
      const parsedSaran = parseGeminiRecommendation(rekomendasiText);
      setSaran(parsedSaran);
      setLoadingSaran(false);
      return;
    }

    setSaran({
      analisis: `Anak dengan tinggi ${result.tinggi_badan} cm pada usia ${result.usia_bulan} bulan menunjukkan status ${result.status} berdasarkan hasil prediksi.`,
      nutrisi: result.saran || [
        "Prioritaskan makanan bergizi seimbang.",
        "Berikan protein hewani sesuai usia anak.",
        "Pantau pertumbuhan anak secara rutin.",
      ],
      pola_asuh: [
        "Ajak anak bermain interaktif dan membaca buku cerita setiap hari.",
        "Terapkan cuci tangan pakai sabun dan jaga sanitasi rumah.",
      ],
      konsultasi:
        "Lakukan kunjungan rutin setiap bulan ke Puskesmas atau Posyandu untuk pemantauan tumbuh kembang.",
    });

    setLoadingSaran(false);
  };

  if (!result) {
    return (
      <div className="hasil-empty">
        <div className="he-icon">◌</div>
        <h2>Data tidak ditemukan</h2>
        <p>Silakan lakukan prediksi terlebih dahulu.</p>
        <button className="btn-black" onClick={() => navigate("/prediksi")}>
          Mulai Prediksi
        </button>
      </div>
    );
  }

  const cfg = STATUS_CFG[result.status] || STATUS_CFG["Normal"];
  const confidence = Math.round((result.confidence || 0.9) * 100);
  const zScore = result.z_score_tb_u ?? 0;
  const gaugePercent = Math.min(Math.max(((zScore + 4) / 8) * 100, 2), 98);

  const handleSave = () => {
    const hist = JSON.parse(
      localStorage.getItem("stuntingscan_history") || "[]",
    );
    if (!hist.find((h) => h.id === result.id)) {
      hist.unshift({ ...result, saved_at: new Date().toISOString() });
      localStorage.setItem(
        "stuntingscan_history",
        JSON.stringify(hist.slice(0, 100)),
      );
    }
    showToast("Data berhasil disimpan ke riwayat!");
  };

  const handlePrint = () => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const namaFile = `${result.nama.replace(/\s+/g, "_")}_${timestamp}`;
    const originalTitle = document.title;
    document.title = namaFile;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="hasil-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {result.mode === "demo" && (
        <div className="demo-bar animate-fadeInUp">
          Mode Demo — Backend AI belum terhubung. Hasil menggunakan rule-based
          WHO fallback.
        </div>
      )}

      {/* Header */}
      <div className="hasil-header animate-fadeInUp">
        <div>
          <p className="hasil-breadcrumb">Hasil Prediksi</p>
          <h1 className="hasil-title">{result.nama}</h1>
          <p className="hasil-sub">
            {result.jenis_kelamin} · {result.usia_bulan} bulan ·{" "}
            {new Date(result.tanggal).toLocaleDateString("id-ID", {
              dateStyle: "long",
            })}
          </p>
        </div>
        <div className="hasil-actions">
          <button className="btn-outline" onClick={handlePrint}>
            ⊟ Cetak
          </button>
          <button className="btn-outline" onClick={handleSave}>
            ↓ Simpan
          </button>
          <button className="btn-black" onClick={() => navigate("/prediksi")}>
            + Prediksi Baru
          </button>
        </div>
      </div>

      {/* Status + Confidence */}
      <div className="hasil-grid animate-fadeInUp delay-1">
        <div
          className="status-card"
          style={{ background: cfg.bg, borderColor: cfg.border }}
        >
          <div className="sc-top">
            <div
              className="sc-icon"
              style={{ color: cfg.color, borderColor: cfg.border }}
            >
              {cfg.icon}
            </div>
            <div>
              <p className="sc-tag" style={{ color: cfg.color }}>
                Status Gizi
              </p>
              <h2 className="sc-status" style={{ color: cfg.color }}>
                {cfg.label}
              </h2>
            </div>
          </div>
          <div className="sc-metrics">
            <div className="metric">
              <span>Berat Badan</span>
              <strong>{result.berat_badan ?? "-"} kg</strong>
            </div>
            <div className="metric">
              <span>Tinggi Badan</span>
              <strong>{result.tinggi_badan} cm</strong>
            </div>
            {result.lingkar_kepala && (
              <div className="metric">
                <span>Lingkar Kepala</span>
                <strong>{result.lingkar_kepala} cm</strong>
              </div>
            )}
            <div className="metric">
              <span>Z-Score TB/U</span>
              <strong
                style={{
                  color: Math.abs(zScore) > 2 ? cfg.color : "var(--black)",
                }}
              >
                {zScore > 0 ? "+" : ""}
                {zScore}
              </strong>
            </div>
          </div>
        </div>

        <div className="confidence-card">
          <h3>Kepercayaan Model</h3>
          <div className="conf-circle">
            <svg viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--gray-200)"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={cfg.color}
                strokeWidth="6"
                strokeDasharray={`${confidence * 2.136} 213.6`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <div className="conf-num" style={{ color: cfg.color }}>
              {confidence}%
            </div>
          </div>
          <div className="zscore-section">
            <p className="zscore-label">
              Z-Score TB/U: <strong>{zScore}</strong>
            </p>
            <div className="gauge-bar">
              <div className="gauge-zones">
                <div style={{ flex: 1, background: "#FEE2E2" }} />
                <div style={{ flex: 1, background: "#FEF9C3" }} />
                <div style={{ flex: 2, background: "#DCFCE7" }} />
                <div style={{ flex: 1, background: "#DBEAFE" }} />
              </div>
              <div
                className="gauge-marker"
                style={{ left: `${gaugePercent}%` }}
              />
            </div>
            <div className="gauge-labels">
              <span>-4</span>
              <span>-2</span>
              <span>0</span>
              <span>+2</span>
              <span>+4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Saran AI — 4 card */}
      <div className="saran-ai-section animate-fadeInUp delay-2">
        <div className="sai-header">
          <span className="sai-icon">✦</span>
          <h3>Rekomendasi Gizi & Kesehatan (Gemini AI)</h3>
          <span className="sai-badge">Bertenaga Gemini 2.5 Flash</span>
        </div>

        {loadingSaran ? (
          <div className="sai-loading">
            <div className="spinner-dark" />
            <span>Membuat rekomendasi personal...</span>
          </div>
        ) : saran ? (
          <div className="sai-cards">
            {/* Card 1 - Analisis Kondisi */}
            <div className="sai-card" style={{ borderLeftColor: "#854D0E" }}>
              <div className="sai-card-title">
                <span>🩺</span> Analisis Kondisi
              </div>
              <p className="sai-card-text">{saran.analisis}</p>
            </div>

            {/* Card 2 - Nutrisi */}
            <div className="sai-card" style={{ borderLeftColor: "#166534" }}>
              <div className="sai-card-title">
                <span>🍎</span> Nutrisi & Makanan Tambahan
              </div>
              <ul className="sai-card-list">
                {(saran.nutrisi || []).map((item, i) => {
                  const parts = item.split(":");
                  return (
                    <li key={i}>
                      {parts.length > 1 ? (
                        <>
                          <strong>{parts[0]}:</strong>
                          {parts.slice(1).join(":")}
                        </>
                      ) : (
                        item
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Card 3 - Pola Asuh */}
            <div className="sai-card" style={{ borderLeftColor: "#1E40AF" }}>
              <div className="sai-card-title">
                <span>🏠</span> Pola Asuh & Sanitasi
              </div>
              <ul className="sai-card-list">
                {(saran.pola_asuh || []).map((item, i) => {
                  const parts = item.split(":");
                  return (
                    <li key={i}>
                      {parts.length > 1 ? (
                        <>
                          <strong>{parts[0]}:</strong>
                          {parts.slice(1).join(":")}
                        </>
                      ) : (
                        item
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Card 4 - Konsultasi */}
            <div className="sai-card" style={{ borderLeftColor: "#991B1B" }}>
              <div className="sai-card-title">
                <span>📋</span> Rujukan & Konsultasi Medis
              </div>
              <p className="sai-card-text">{saran.konsultasi}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Referensi WHO */}
      <div className="ref-card animate-fadeInUp delay-3">
        <h3>Standar WHO Z-Score TB/U</h3>
        <div className="ref-rows">
          {[
            {
              range: "< -3",
              status: "Severely Stunted",
              bg: "#FEE2E2",
              color: "#991B1B",
            },
            {
              range: "-3 s/d -2",
              status: "Stunting",
              bg: "#FEF9C3",
              color: "#854D0E",
            },
            {
              range: "-2 s/d +2",
              status: "Normal",
              bg: "#DCFCE7",
              color: "#166534",
            },
            {
              range: "+2 s/d +4",
              status: "Tinggi",
              bg: "#DBEAFE",
              color: "#1E40AF",
            },
          ].map((row, i) => (
            <div
              key={i}
              className={`ref-row ${result.status === row.status ? "current" : ""}`}
            >
              <span className="ref-range">{row.range}</span>
              <span className="ref-dot" style={{ background: row.color }} />
              <span className="ref-status" style={{ color: row.color }}>
                {row.status}
              </span>
              {result.status === row.status && (
                <span className="ref-current-badge">← Saat ini</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="hasil-bottom animate-fadeInUp delay-4">
        <button className="btn-outline" onClick={() => navigate("/riwayat")}>
          Lihat Riwayat
        </button>
        <button className="btn-black" onClick={() => navigate("/prediksi")}>
          + Prediksi Balita Lain
        </button>
      </div>
    </div>
  );
}
