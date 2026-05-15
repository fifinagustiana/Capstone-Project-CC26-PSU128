from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib

# Inisialisasi Aplikasi FastAPI
app = FastAPI(
    title="API Prediksi Risiko Stunting",
    description="Layanan REST API mandiri untuk klasifikasi status gizi balita menggunakan model Deep Learning.",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    # Keamanan Lapisan 1: Blokir domain asing. Hanya izinkan domain FE milik perusahaan.
    allow_origins=[], # TIM FEBE(FS) WAJIB KONFIRMASI ALAMAT WEB MEREKA UNTUK DIWHITELIST OLEH TIM AI
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Definisikan Custom Objects sesuai arsitektur model
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

# Deklarasi variabel global untuk model dan preprocessor
preprocessor = None
model = None
label_mapping = {0: "normal", 1: "severely stunted", 2: "stunted", 3: "tinggi"}

# 2. Load objek ke memori satu kali saja saat server hidup
@app.on_event("startup")
def load_assets():
    global preprocessor, model
    try:
        print("[INFO] Memuat preprocessor_stunting.pkl...")
        preprocessor = joblib.load('preprocessor_stunting.pkl')
        
        print("[INFO] Memuat stunting_prediction_model.keras...")
        model = tf.keras.models.load_model(
            'stunting_prediction_model.keras',
            custom_objects={'CustomDenseLayer': CustomDenseLayer, 'FocalLoss': FocalLoss}
        )
        print("[SUCCESS] Sistem prediksi siap menerima request!")
    except Exception as e:
        print(f"[ERROR] Gagal memuat arsitektur AI: {e}")

# 3. Validasi tipe data body request JSON
class BalitaData(BaseModel):
    umur_bulan: int
    tinggi_badan_cm: float
    jenis_kelamin: str  # 'laki-laki' atau 'perempuan'

# Autentikasi API Key
SECRET_API_KEY = "" # TIM FEBE(FS) WAJIB KONFIRMASI KUNCI RAHASIA API KE TIM AI
api_key_scheme = APIKeyHeader(name="X-API-Key", auto_error=True)

def verify_api_key(api_key: str = Security(api_key_scheme)):
    if api_key != SECRET_API_KEY:
        raise HTTPException(status_code=403, detail="AKSES DITOLAK: API Key Salah atau Tidak Ditemukan!")
    return api_key

# 4. Routing API (Endpoint /predict)
@app.post("/predict")
def predict_stunting(data: BalitaData, api_key: str = Depends(verify_api_key)):
    # Validasi Input Sederhana
    if data.jenis_kelamin.lower() not in ['laki-laki', 'perempuan']:
        raise HTTPException(status_code=400, detail="Nilai jenis_kelamin harus 'laki-laki' atau 'perempuan'")
    
    # Feature Engineering
    if data.umur_bulan == 0:
        growth_eff = data.tinggi_badan_cm
    else:
        growth_eff = data.tinggi_badan_cm / data.umur_bulan
        
    # Membangun struktur DataFrame persis seperti data latih
    df_input = pd.DataFrame([{
        'Umur (bulan)': data.umur_bulan,
        'Tinggi Badan (cm)': data.tinggi_badan_cm,
        'growth_efficiency': growth_eff,
        'Jenis Kelamin': data.jenis_kelamin.lower()
    }])
    
    # Transformasi Data menggunakan Scikit-Learn Pipeline
    try:
        X_ready = preprocessor.transform(df_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scaling/encoding: {str(e)}")
        
    # Eksekusi AI Inference
    try:
        predictions = model.predict(X_ready)
        pred_class = np.argmax(predictions, axis=1)[0]
        probabilitas = predictions[0].tolist()
        pred_label = label_mapping[pred_class]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error prediksi Keras: {str(e)}")
        
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
            "probabilitas": {
                "normal": float(probabilitas[0]),
                "severely_stunted": float(probabilitas[1]),
                "stunted": float(probabilitas[2]),
                "tinggi": float(probabilitas[3])
            }
        }
    }
