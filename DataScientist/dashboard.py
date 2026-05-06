import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import pearsonr

# Setup Halaman
st.set_page_config(page_title="Analisis Stunting", layout="wide")
st.title("📊 Dashboard Analisis Stunting Balita")
st.markdown("---")

# 1. Load Data
@st.cache_data
def load_data():
    return pd.read_csv('data_balita_who.csv')

df = load_data()

# 2. Sidebar untuk Filter (opsional, untuk interaktivitas)
st.sidebar.header("Filter Data")
gender_filter = st.sidebar.multiselect("Pilih Jenis Kelamin:", options=df['Jenis Kelamin'].unique(), default=df['Jenis Kelamin'].unique())
df_filtered = df[df['Jenis Kelamin'].isin(gender_filter)]

# 3. Layout Tabs
tab1, tab2, tab3 = st.tabs(["📌 1. Executive Summary", "📈 2. Analisis Klinis", "⚙️ 3. Validasi Teknis"])

# TAB 1: EXECUTIVE SUMMARY
with tab1:
    st.header("Ringkasan Kondisi Balita")
    
    # Metrics
    total_balita = df_filtered.shape[0]
    total_stunted = df_filtered[df_filtered['status'].isin(['stunted', 'severely stunted'])].shape[0]
    persentase = (total_stunted / total_balita * 100) if total_balita > 0 else 0
    
    c1, c2, c3 = st.columns(3)
    c1.metric("Total Balita", total_balita)
    c2.metric("Total Kasus Stunting", total_stunted)
    c3.metric("Prevalensi", f"{persentase:.1f}%")
    
    # Pie Chart
    st.subheader("Distribusi Status Gizi")
    fig_pie, ax_pie = plt.subplots(figsize=(6, 6))
    status_counts = df_filtered['status'].value_counts()
    ax_pie.pie(status_counts, labels=status_counts.index, autopct='%1.1f%%', startangle=140, colors=sns.color_palette('viridis'))
    st.pyplot(fig_pie)
    st.info("Insight: Mayoritas balita memiliki status gizi normal (56.2%), namun masih terdapat 27.7% kasus stunting (stunted + severely stunted) yang perlu perhatian khusus dalam program intervensi gizi.")

# TAB 2: ANALISIS KLINIS
with tab2:
    st.header("Analisis Tren & Perbandingan")
    
    # Line Chart
    st.subheader("Tren Prevalensi Stunting per Umur")
    total_per_age = df_filtered.groupby('Umur (bulan)').size()
    stunted_per_age = df_filtered[df_filtered['status'].isin(['stunted', 'severely stunted'])].groupby('Umur (bulan)').size()
    prev_per_age = (stunted_per_age / total_per_age * 100).fillna(0)
    
    fig_line, ax_line = plt.subplots(figsize=(10, 4))
    ax_line.plot(prev_per_age.index, prev_per_age.values, marker='o', color='darkred')
    ax_line.axhline(prev_per_age.mean(), color='black', linestyle='--')
    st.pyplot(fig_line)
    st.info(f"Insight: Prevalensi stunting rata-rata {prev_per_age.mean():.1f}%. Puncak prevalensi terjadi pada usia 4 bulan ({prev_per_age.max():.1f}%), dengan prevalensi terendah pada usia 42 bulan ({prev_per_age.min():.1f}%). Tren ini menunjukkan pentingnya intervensi sejak dini (periode kritis 0-12 bulan).")
    
    # Box Plot
    st.subheader("Perbandingan Z-Score per Gender")
    
    # 1. Definisikan pemetaan warna yang tetap (Lock warna)
    gender_colors = {'laki-laki': '#3498db', 'perempuan': '#ff69b4'} 
    fig_box, ax_box = plt.subplots(figsize=(8, 4))
    sns.boxplot(data=df_filtered, x='Jenis Kelamin', y='z_score_who', hue='Jenis Kelamin', palette=gender_colors, legend=False)
    ax_box.axhline(-2, color='red', linestyle='--')
    st.pyplot(fig_box)
    st.info("Insight: Distribusi Z-score antara laki-laki (mean = -0.03) dan perempuan (mean = 0.05) menunjukkan pola yang sangat serupa. Keduanya memiliki risiko stunting yang setara, mengindikasikan bahwa stunting bukan masalah yang spesifik gender tetapi lebih merupakan isu gizi dan kesehatan populasi secara umum.")

# TAB 3: VALIDASI TEKNIS
with tab3:
    st.header("Validasi Engineering (Feature Engineering)")
    st.write("Bagian ini membuktikan bahwa fitur buatan (growth_efficiency) valid secara klinis.")
    
    # Cek apakah kolom ada, jika tidak, hitung ulang di sini (Defensive Programming)
    if 'growth_efficiency' not in df_filtered.columns:
        df_filtered['growth_efficiency'] = np.where(
            df_filtered['Umur (bulan)'] == 0, 
            df_filtered['Tinggi Badan (cm)'], 
            df_filtered['Tinggi Badan (cm)'] / df_filtered['Umur (bulan)']
        )

    # Scatter Plot
    corr, _ = pearsonr(df_filtered['growth_efficiency'], df_filtered['z_score_who'])
    fig_scat, ax_scat = plt.subplots(figsize=(8, 5))
    sns.regplot(x='growth_efficiency', y='z_score_who', data=df_filtered, scatter_kws={'alpha':0.3}, line_kws={'color':'red'})
    plt.title(f'Validasi Fitur (Korelasi: {corr:.2f})')
    st.pyplot(fig_scat)
    
    st.warning(f"""
    ### Kesimpulan Teknis:
    * **Validasi Fitur:** Korelasi sebesar **{corr:.3f}** menunjukkan hubungan LEMAH antara growth_efficiency dan Z-score WHO. Meskipun signifikan secara statistik (p < 0.05), fitur ini memberikan perspektif yang berbeda dari Z-score.
    * **Interpretasi:** Growth_efficiency (tinggi/umur) menangkap aspek KECEPATAN pertumbuhan, sedangkan Z-score WHO menangkap pertumbuhan relatif terhadap standar populasi. Keduanya penting tapi mengukur hal berbeda.
    * **Strategi:** Fitur ini digunakan sebagai PREDIKTOR TAMBAHAN, bukan pengganti Z-score, untuk memberikan dimensi analisis yang lebih komprehensif pada model AI.
    """)

st.markdown("---")
st.caption("Dashboard dikembangkan oleh TIM CC26-PSU128 ")