from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib
import asyncio
import json
import urllib.request

# Inisialisasi Aplikasi FastAPI
app = FastAPI(
    title="API Prediksi Risiko Stunting",
    description="Layanan REST API mandiri untuk klasifikasi status gizi balita menggunakan model Deep Learning.",
    version="1.0"
)

# Konfigurasi CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.web-perusahaan.com", 
        "http://localhost:3000", 
        "http://localhost",
        "null",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:7860",
        "http://127.0.0.1:7860"
    ], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

# Definisikan Custom Objects
class FocalLoss(tf.keras.losses.Loss):
    def __init__(self, gamma=2.0, alpha=0.25, **kwargs):
        super(FocalLoss, self).__init__(**kwargs)
        self.gamma = gamma
        self.alpha = alpha

    def call(self, y_true, y_pred):
        y_pred = tf.clip_by_value(y_pred, tf.keras.backend.epsilon(), 1.0 - tf.keras.backend.epsilon())
        cross_entropy = -y_true * tf.math.log(y_pred)
        focal_term = self.alpha * tf.math.pow(1.0 - y_pred, self.gamma)
        loss = focal_term * cross_entropy
        return tf.reduce_mean(tf.reduce_sum(loss, axis=-1))

class CustomDenseLayer(tf.keras.layers.Layer):
    def __init__(self, units, activation='relu', **kwargs):
        super(CustomDenseLayer, self).__init__(**kwargs)
        self.units = units
        self.activation = tf.keras.activations.get(activation)

    def build(self, input_shape):
        self.w = self.add_weight(shape=(input_shape[-1], self.units),
                                 initializer='he_normal', trainable=True, name='custom_weight')
        self.b = self.add_weight(shape=(self.units,),
                                 initializer='zeros', trainable=True, name='custom_bias')

    def call(self, inputs):
        output = tf.matmul(inputs, self.w) + self.b
        if self.activation is not None:
            output = self.activation(output)
        return output

    def get_config(self):
        config = super(CustomDenseLayer, self).get_config()
        config.update({'units': self.units, 'activation': tf.keras.activations.serialize(self.activation)})
        return config

# Deklarasi variabel global
preprocessor = None
model = None
label_mapping = {0: "normal", 1: "severely stunted", 2: "stunted", 3: "tinggi"}

# Load model ke memori
@app.on_event("startup")
def load_assets():
    global preprocessor, model
    try:
        print("[INFO] Memuat preprocessor_stunting.pkl...")
        preprocessor = joblib.load('preprocessor_stunting.pkl')
        print("[INFO] Memuat arsitektur menggunakan TFSMLayer...")
        model = tf.keras.layers.TFSMLayer(
            'saved_model/stunting_prediction', 
            call_endpoint='serving_default'
        )
        print("[SUCCESS] Sistem prediksi siap menerima request!")
        # print("[INFO] Memuat stunting_prediction_model.keras...")
        # model = tf.keras.models.load_model(
        #     'stunting_prediction_model.keras',
        #     custom_objects={'CustomDenseLayer': CustomDenseLayer, 'FocalLoss': FocalLoss}
        # )
        # model = tf.keras.models.load_model(
        #     'saved_model',
        #     custom_objects={'CustomDenseLayer': CustomDenseLayer, 'FocalLoss': FocalLoss}
        # )
        print("[SUCCESS] Sistem prediksi siap menerima request!")
    except Exception as e:
        print(f"[ERROR] Gagal memuat arsitektur AI: {e}")

# Validasi tipe data body request JSON
class BalitaData(BaseModel):
    umur_bulan: int
    tinggi_badan_cm: float
    jenis_kelamin: str

# Autentikasi API Key
SECRET_API_KEY = "[ENCRYPTION_KEY]" # Password API Model 
api_key_scheme = APIKeyHeader(name="X-API-Key", auto_error=True)

def verify_api_key(api_key: str = Security(api_key_scheme)):
    if api_key != SECRET_API_KEY:
        raise HTTPException(status_code=403, detail="AKSES DITOLAK: API Key Salah atau Tidak Ditemukan!")
    return api_key

# Konfigurasi Gemini API untuk Rekomendasi
GEMINI_API_KEY = "[ENCRYPTION_KEY]" # API Key Kami
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

def call_gemini_api(prompt: str) -> str:
    """Helper fungsi sinkron untuk memanggil Gemini API."""
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    req = urllib.request.Request(
        GEMINI_API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    with urllib.request.urlopen(req, timeout=30) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        try:
            return res_data['candidates'][0]['content']['parts'][0]['text']
        except (KeyError, IndexError) as e:
            raise ValueError(f"Format respon Gemini tidak valid: {str(e)}")

async def generate_recommendation(
    umur_bulan: int,
    tinggi_badan_cm: float,
    jenis_kelamin: str,
    pred_label: str,
    probabilitas: dict
) -> str:
    """Menghasilkan rekomendasi gizi & tindakan kesehatan berbasis Gemini AI."""
    prompt = (
        "Anda adalah dokter anak dan ahli gizi terkemuka. Berikan rekomendasi kesehatan & gizi balita yang ringkas, padat, dan mudah dipahami orang tua.\n"
        "Data Balita:\n"
        f"- Umur: {umur_bulan} bulan\n"
        f"- Tinggi Badan: {tinggi_badan_cm} cm\n"
        f"- Jenis Kelamin: {jenis_kelamin}\n"
        f"- Diagnosa Risiko Stunting: {pred_label}\n"
        f"- Detail Probabilitas: {json.dumps(probabilitas)}\n\n"
        "Tuliskan jawaban Anda maksimal 180 kata dalam format Markdown yang bersih menggunakan struktur berikut:\n\n"
        "### 1. Analisis Kondisi\n"
        "1-2 kalimat mengenai kondisi tinggi badan anak terhadap umurnya.\n\n"
        "### 2. Nutrisi & PMT\n"
        "2-3 poin penting mengenai saran asupan gizi spesifik (protein hewani) dan Makanan Tambahan (PMT) sesuai usianya.\n\n"
        "### 3. Pola Asuh & Sanitasi\n"
        "2-3 poin praktis untuk stimulasi perkembangan anak dan kebersihan lingkungan.\n\n"
        "### 4. Konsultasi Medis\n"
        "1 kalimat penegasan kapan harus ke Puskesmas/Posyandu.\n\n"
        "Ketentuan tambahan:\n"
        "- Jangan gunakan salam pembuka atau penutup yang terlalu bertele-tele.\n"
        "- Jangan memberikan disclaimer panjang atau catatan kaki medis.\n"
        "- Gunakan poin-poin singkat yang langsung bisa dipraktikkan."
    )
    
    try:
        recommendation = await asyncio.to_thread(call_gemini_api, prompt)
        return recommendation
    except Exception as e:
        print(f"[WARNING] Gagal mendapatkan rekomendasi dari Gemini API: {e}")
        return "Rekomendasi AI saat ini tidak dapat dimuat karena gangguan koneksi atau batas kuota terlampaui. Silakan coba beberapa saat lagi atau hubungi dokter anak/puskesmas terdekat untuk pemeriksaan lebih lanjut."

# Route Root (Halaman Utama)
@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "Model AI Prediksi Risiko Stunting Aktif dan Siap Digunakan!"
    }

# 4. Routing API (Endpoint /predict)
@app.post("/predict")
async def predict_stunting(data: BalitaData, api_key: str = Depends(verify_api_key)):
    # Validasi Input
    if data.jenis_kelamin.lower() not in ['laki-laki', 'perempuan']:
        raise HTTPException(status_code=400, detail="Nilai jenis_kelamin harus 'laki-laki' atau 'perempuan'")
    
    # Feature Engineering
    if data.umur_bulan == 0:
        growth_eff = data.tinggi_badan_cm
    else:
        growth_eff = data.tinggi_badan_cm / data.umur_bulan
        
    # Membangun DataFrame
    df_input = pd.DataFrame([{
        'Umur (bulan)': data.umur_bulan,
        'Tinggi Badan (cm)': data.tinggi_badan_cm,
        'growth_efficiency': growth_eff,
        'Jenis Kelamin': data.jenis_kelamin.lower()
    }])
    
    # Transformasi Data
    try:
        X_ready = preprocessor.transform(df_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scaling/encoding: {str(e)}")
    # Eksekusi AI Inference
    # try:
    #     predictions = model.predict(X_ready)
    #     pred_class = np.argmax(predictions, axis=1)[0]
    #     probabilitas = predictions[0].tolist()
    #     pred_label = label_mapping[pred_class]

    # Eksekusi AI Inference via TFSMLayer
    try:
        # TFSMLayer dieksekusi dengan memanggilnya langsung seperti fungsi
        outputs_dict = model(X_ready)
        
        # Ekstrak nilai prediksi dari dictionary
        predictions = list(outputs_dict.values())[0].numpy()
        
        pred_class = np.argmax(predictions, axis=1)[0]
        probabilitas = predictions[0].tolist()
        pred_label = label_mapping[pred_class]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error prediksi Keras: {str(e)}")
        
    # Buat detail probabilitas untuk dikirim ke Gemini dan dikembalikan di response
    prob_detail = {
        "normal": float(probabilitas[0]),
        "severely_stunted": float(probabilitas[1]),
        "stunted": float(probabilitas[2]),
        "tinggi": float(probabilitas[3])
    }

    # Dapatkan rekomendasi menggunakan Gemini AI
    rekomendasi = await generate_recommendation(
        umur_bulan=data.umur_bulan,
        tinggi_badan_cm=data.tinggi_badan_cm,
        jenis_kelamin=data.jenis_kelamin.lower(),
        pred_label=pred_label,
        probabilitas=prob_detail
    )

    # Response Builder
    return {
        "status": "success",
        "input_diterima": {
            "umur_bulan": data.umur_bulan,
            "tinggi_badan_cm": data.tinggi_badan_cm,
            "jenis_kelamin": data.jenis_kelamin.lower(),
            "growth_efficiency_terhitung": growth_eff
        },
        "hasil_prediksi": {
            "kategori_diagnosa": pred_label,
            "class_index": int(pred_class),
            "probabilitas": prob_detail
        },
        "rekomendasi_gemini": rekomendasi
    }
