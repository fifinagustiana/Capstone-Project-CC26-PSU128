export function mapStatusFromAI(kategori) {
    const value = String(kategori || '').toLowerCase();

    if (value === 'normal') return 'Normal';
    if (value === 'tinggi') return 'Tinggi';
    if (value === 'stunted') return 'Stunting';
    if (value === 'stunting') return 'Stunting';
    if (value === 'severely_stunted') return 'Severely Stunted';
    if (value === 'severely stunted') return 'Severely Stunted';

    return 'Normal';
}

export function mapGenderToAI(jenisKelamin) {
    const value = String(jenisKelamin || '').toLowerCase();

    if (value === 'laki-laki' || value === 'l' || value === 'male') {
        return 'laki-laki';
    }

    if (value === 'perempuan' || value === 'p' || value === 'female') {
        return 'perempuan';
    }

    return null;
}

export function getSaranByStatus(status) {
    const saran = {
        Normal: [
            'Pertahankan pola makan bergizi seimbang.',
            'Lanjutkan pemantauan pertumbuhan anak secara rutin.',
            'Pastikan anak mendapatkan imunisasi sesuai jadwal.',
            'Kontrol ke Posyandu setiap bulan.',
        ],
        Tinggi: [
            'Pertumbuhan tinggi anak berada di atas rata-rata, tetap pantau secara berkala.',
            'Pastikan asupan gizi tetap seimbang.',
            'Konsultasikan ke tenaga kesehatan jika ada keluhan pertumbuhan.',
        ],
        Stunting: [
            'Segera konsultasikan kondisi anak ke Puskesmas atau ahli gizi.',
            'Tingkatkan asupan protein hewani seperti telur, ikan, ayam, dan daging.',
            'Pantau tinggi badan dan berat badan secara rutin.',
            'Pastikan kebersihan lingkungan dan sanitasi rumah baik.',
        ],
        'Severely Stunted': [
            'Segera rujuk anak ke Puskesmas atau rumah sakit terdekat.',
            'Anak membutuhkan pemeriksaan medis dan intervensi gizi lebih intensif.',
            'Pantau kondisi anak bersama tenaga kesehatan.',
            'Pastikan anak mendapatkan makanan bergizi sesuai arahan ahli gizi.',
        ],
    };

    return saran[status] || saran.Normal;
}