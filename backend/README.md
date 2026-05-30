# StuntingScan Backend API

Backend untuk aplikasi **StuntingScan**. Backend ini dibangun menggunakan **Node.js + Express.js** dan menggunakan **PostgreSQL** sebagai database. Backend juga terintegrasi dengan **API Model AI** dari tim AI untuk melakukan prediksi risiko stunting.

## 1. Fungsi Backend

Backend bertugas untuk:

1. Menyediakan RESTful API untuk frontend React.
2. Mengelola register dan login user.
3. Menyimpan data balita ke PostgreSQL.
4. Mengirim data prediksi ke API AI.
5. Menyimpan hasil prediksi ke database.
6. Menampilkan riwayat prediksi.
7. Menampilkan statistik dashboard.

Alur sistem:

Frontend React -
Backend Express.js -
API AI Stunting -
PostgreSQL -
Frontend React
