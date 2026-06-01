# 📊 StuntingScan - Data Analytics & Streamlit Dashboard Core

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fifinagustiana/Capstone-Project-CC26-PSU128/blob/main/DataScientist/Data_Prep_Prediksi_Risiko_Stunting_Balita.ipynb) 

Repositori ini berisi dokumentasi, alur kerja, dan panduan replikasi untuk proses:
- Exploratory Data Analysis (EDA)
- Medical audit berdasarkan Z-score WHO
- Visualisasi interaktif menggunakan Streamlit

Proyek ini fokus menganalisis pertumbuhan balita usia 0-60 bulan dengan standar WHO untuk mendeteksi risiko stunting sejak dini.

---

## Tujuan dan Ruang Lingkup
Analisis ini berpusat pada fitur minimalis yang relevan untuk kesehatan balita:
- `Umur (bulan)`
- `Jenis Kelamin`
- `Tinggi Badan (cm)`
- `z_score_who`
- `status`

Tambahan fitur teknis yang divalidasi di dashboard:
- `growth_efficiency` = `Tinggi Badan (cm)` / `Umur (bulan)`

Klasifikasi `status` yang digunakan:
- `severely stunted`
- `stunted`
- `normal`
- `tinggi`

---

## Struktur File
- `dashboard.py` : aplikasi Streamlit yang memuat data, filter, visualisasi, dan validasi feature engineering.
- `data_balita_who.csv` : dataset input utama.
- `requirements.txt` : definisi dependensi Python.
- `README.md` : dokumentasi replikasi langkah.

---

## Data Input: `data_balita_who.csv`
Dataset ini berasal dari sumber berikut:
- Kaggle: https://www.kaggle.com/datasets/rendiputra/stunting-balita-detection-121k-rows

Kolom yang harus ada:
- `Umur (bulan)` : usia balita dalam bulan.
- `Jenis Kelamin` : nilai `laki-laki` atau `perempuan`.
- `Tinggi Badan (cm)` : panjang/tinggi badan dalam sentimeter.
- `z_score_who` : skor Z WHO untuk perbandingan tinggi badan terhadap usia.
- `status` : label gizi berdasarkan Z-score WHO.

> Catatan: `dashboard.py` sudah mengandalkan kolom `z_score_who` dan `status` dari dataset. Jika data belum berisi `growth_efficiency`, aplikasi akan menghitungnya secara otomatis.

---

## Instalasi Dependensi
Jalankan perintah berikut di terminal pada direktori proyek:

```bash
pip install -r requirements.txt
```

`requirements.txt` saat ini berisi:
- `streamlit==1.38.0`
- `pandas==2.2.2`
- `scipy==1.13.1`
- `matplotlib==3.9.0`
- `seaborn==0.13.2`
- `numpy==1.26.4`

Jika ingin memasang manual, gunakan:

```bash
pip install streamlit pandas numpy matplotlib seaborn scipy
```

---

## Cara Menjalankan Dashboard
Setelah dependensi terpasang, jalankan:

```bash
streamlit run dashboard.py
```

Buka URL yang ditampilkan di terminal, misalnya `http://localhost:8501`.

---

## Langkah Replikasi Praktis
1. Clone repository atau salin folder proyek ke komputer lokal.
2. Masuk ke folder proyek:
   ```bash
   cd "e:/FOLDER ANDA"
   ```
3. Pasang dependensi:
   ```bash
   pip install -r requirements.txt
   ```
4. Pastikan file `data_balita_who.csv` ada di folder yang sama.
5. Jalankan dashboard:
   ```bash
   streamlit run dashboard.py
   ```
6. Buka browser dan lihat hasil visualisasi di alamat yang muncul.

---

## Output yang Diharapkan
Dashboard menampilkan:
- Ringkasan metrik jumlah balita dan prevalensi stunting.
- Grafik distribusi status gizi.
- Tren prevalensi stunting menurut usia.
- Perbandingan Z-score WHO berdasarkan jenis kelamin.
- Validasi teknis feature engineering `growth_efficiency` terhadap `z_score_who`.

---

## Catatan Tambahan
- Jika dataset memiliki kolom `growth_efficiency`, aplikasi tidak perlu menghitung ulang.
- Jika dataset tidak memiliki kolom tersebut, `dashboard.py` membuatnya secara otomatis.
- Pastikan `Jenis Kelamin` menggunakan nilai konsisten agar filter sidebar berfungsi.

---

## Pengembang
Dashboard ini dikembangkan oleh TIM CC26-PSU128.

## Link Streamlit
https://stuntingscan.streamlit.app/
