# Data Dictionary

**Deskripsi:** Dataset ini berisi data pertumbuhan balita yang telah melalui proses pembersihan logika medis (audit WHO), feature engineering, dan normalisasi. Data ini siap digunakan sebagai input untuk pelatihan model.

**Jumlah Baris:**
- Awal (sebelum pembersihan): 120,999 baris
- Setelah pembersihan (duplikat, outlier, mismatch): 38,107 baris

**Sumber Data:** Kaggle (https://www.kaggle.com/datasets/rendiputra/stunting-balita-detection-121k-rows)


| Nama Variabel      | Tipe Data          | Peran (Input/Target) | Deskripsi                                      | Rentang / Kategori                  |
|--------------------|--------------------|----------------------|------------------------------------------------|-------------------------------------|
| Umur (bulan)      | Integer / Float   | Fitur (Input Layer) | Usia balita dalam bulan.                       | 0 - 60                             |
| Jenis Kelamin     | Categorical (Object) | Fitur (Input Layer) | Gender balita (diolah via OneHotEncoder).     | laki-laki, perempuan               |
| Tinggi Badan (cm) | Float              | Fitur (Input Layer) | Hasil pengukuran tinggi badan aktual.         | ~40.0 - 130.0                      |
| z_score_who       | Float              | Fitur (Input Layer) | Indikator deviasi pertumbuhan menurut WHO.    | -6.0 s.d 6.0                       |
| growth_efficiency | Float              | Fitur (Input Layer) | Feature engineering: rasio TB terhadap Umur.  | 0.0 - 65.0                         |
| status            | Categorical (String) | Target (Output Layer) | Target klasifikasi status gizi (Acuan WHO).   | normal, stunted, severely stunted, tinggi |

# Penjelasan Teknis Transformasi
Dokumentasi ini mencakup langkah-langkah transformasi data yang diterapkan sebelum data dimasukkan ke dalam model:

**1. Standarisasi** (`StandardScaler`):

Diterapkan pada variabel numerik (`Umur (bulan)`, `Tinggi Badan (cm)`, `growth_efficiency`) untuk menyamakan skala fitur, sehingga tidak ada fitur yang mendominasi bobot model karena perbedaan besaran nilai.

**2. Encoding** (`OneHotEncoder`):

Variabel kategorikal (`Jenis Kelamin`) diubah menjadi format numerik biner (0 atau 1) untuk memungkinkan model AI membaca data non-numerik.

**3. Penanganan Missing Values & Outlier**:

Data dengan `z_score_who` di luar rentang -6 hingga 6 telah disingkirkan guna menghindari bias akibat kesalahan input (human error).

**4. Integritas Data**:

Seluruh target label (`status`) telah melalui proses verifikasi/audit klinis berdasarkan standar WHO `lhfa` (length-for-age).