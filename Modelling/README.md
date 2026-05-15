# 📚 Dokumentasi API Prediksi Risiko Stunting

Dokumen ini ditujukan bagi tim Frontend dan Backend untuk mengintegrasikan layanan **Prediksi Risiko Stunting Balita**. API ini di-hosting secara mandiri via Hugging Face Spaces dan ditenagai oleh model *Deep Learning* (TensorFlow).

---

## 🔒 1. Autentikasi & Keamanan

API ini dilindungi oleh dua lapis keamanan:
1. **CORS Whitelist**: Pastikan URL aplikasi Anda sudah didaftarkan oleh tim AI ke dalam sistem backend kami. Jika belum, *browser* Anda akan memblokir *request*. **# TIM FEBE(FS) WAJIB KONFIRMASI ALAMAT WEB MEREKA UNTUK DIWHITELIST OLEH TIM AI**
2. **API Key (Wajib)**: Setiap *request* yang dikirim **wajib** menyertakan HTTP Header `X-API-Key`.

- **Header Key**: `X-API-Key`
- **Header Value**: `...` *# TIM FEBE(FS) WAJIB KONFIRMASI KUNCI RAHASIA API KE TIM AI*

---

## 🚀 2. Endpoint Utama

Menerima data metrik balita dan mengembalikan hasil diagnosa status gizi beserta probabilitasnya.

- **URL Endpoint:** `...` *# TIM FEBE(FS) WAJIB KONFIRMASI ALAMAT ENDPOINT KE TIM AI*
- **Method:** `POST`
- **Content-Type:** `application/json`

### Format Request Body (JSON)

API mengharapkan *body request* dengan format JSON mutlak seperti berikut:

```json
{
  "umur_bulan": 12,
  "tinggi_badan_cm": 75.5,
  "jenis_kelamin": "laki-laki"
}
```

**Aturan Tipe Data:**
- `umur_bulan` (Integer): Umur balita dalam bulan (Boleh `0` untuk bayi baru lahir).
- `tinggi_badan_cm` (Float): Tinggi atau panjang badan dalam satuan sentimeter.
- `jenis_kelamin` (String): Harus berisi `"laki-laki"` atau `"perempuan"`.

---

## ✅ 3. Respons Sukses (HTTP 200)

Jika *request* berhasil, API akan mengembalikan hasil pemrosesan JSON berikut:

```json
{
  "status": "success",
  "input_diterima": {
    "umur_bulan": 12,
    "tinggi_badan_cm": 75.5,
    "jenis_kelamin": "laki-laki",
    "growth_efficiency_terhitung": 6.291666666666667
  },
  "hasil_prediksi": {
    "kategori_diagnosa": "normal",
    "class_index": 0,
    "probabilitas": {
      "normal": 0.9854,
      "severely_stunted": 0.0012,
      "stunted": 0.0105,
      "tinggi": 0.0029
    }
  }
}
```
*Catatan: Anda cukup mengambil variabel `hasil_prediksi.kategori_diagnosa` untuk ditampilkan ke User.*

---

## ❌ 4. Respons Error Umum

- **HTTP 403 Forbidden**: Header `X-API-Key` tidak ada atau salah.
- **HTTP 422 Unprocessable Entity**: Format *body JSON* tidak sesuai (misal: mengirimkan *string* huruf ke kolom umur).
- **HTTP 400 Bad Request**: Tipe jenis kelamin di luar `"laki-laki"` atau `"perempuan"`.

---

## 💻 5. Contoh Implementasi Kode

### A. Untuk Tim Frontend (JavaScript / Fetch API)
```javascript
const url = "# KONFIRMASI ALAMAT ENDPOINT KE TIM AI";
const dataBalita = {
    "umur_bulan": 15,
    "tinggi_badan_cm": 78.2,
    "jenis_kelamin": "perempuan"
};

fetch(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-API-Key": "# KONFORMASI KE TIM AI"
    },
    body: JSON.stringify(dataBalita)
})
.then(response => response.json())
.then(result => {
    if(result.status === "success") {
        console.log("Status Gizi:", result.hasil_prediksi.kategori_diagnosa);
    } else {
        console.error("Gagal memproses data");
    }
})
.catch(error => console.error("Error CORS/Jaringan:", error));
```

### B. Untuk Tim Backend (Python / Requests)
```python
import requests

url = "# KONFIRMASI ALAMAT ENDPOINT KE TIM AI"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "# KONFIRMASI KE TIM AI"
}
payload = {
    "umur_bulan": 24,
    "tinggi_badan_cm": 85.0,
    "jenis_kelamin": "laki-laki"
}

response = requests.post(url, json=payload, headers=headers)

if response.status_code == 200:
    data = response.json()
    print("Kategori:", data['hasil_prediksi']['kategori_diagnosa'])
else:
    print("Error:", response.text)
```
