# Formulir Kegiatan Kedinasan Dinamis (Multi-Event Engine) - JeMPROT
### Bidang SMP — Dinas Pendidikan dan Kebudayaan Kabupaten Karanganyar

Aplikasi berbasis web modern dan serverless untuk manajemen kegiatan kedinasan, pendaftaran perwakilan satuan pendidikan (SMP), modul logistik (kaos & atribut), presensi QR Code e-ticket dengan kamera webcam laptop/smartphone, dan generator dokumen administrasi SPJ otomatis.

---

## 🚀 Fitur Unggulan Platform

1. **Portal Pendaftaran Peserta (`index.html`)**:
   - **Multi-Event Cards:** Pilihan kartu kegiatan aktif di beranda awal sebelum membuka formulir.
   - **Formulir Dinamis:** Navigasi kembali ke pilihan kegiatan kapan saja.
   - **Pencarian Satuan Pendidikan:** Autocomplete pencarian SMP se-Kabupaten Karanganyar dengan pembatasan kuota pendaftaran real-time.
   - **E-Ticket Resmi QR Code:** Menerbitkan tiket digital ganda dengan QR Code resolusi tinggi, opsi unduh gambar PNG, dan kirim bukti via WhatsApp.
   - **Branding Resmi JeMPROT:** `DIGITALLY SHAPED BY JeMPROT [BID SMP 2026]`.

2. **Portal Marshal & Panitia (`/marshal/` atau `marshal.html`)**:
   - **Sidebar Menu Interaktif:** Menu navigasi rapi yang dapat dibuka dan ditutup (toggle).
   - **Keamanan Berlapis & Auto-Logout 30 Menit:**
     - Terlindungi PIN Panitia dengan proteksi anti brute-force (kunci 15 menit jika 5x salah input PIN).
     - Tombol keluar (Logout) terpasang di Topbar dan Sidebar.
     - Auto-logout otomatis jika tidak ada aktivitas selama 30 menit (dengan peringatan hitung mundur di menit ke-28).
   - **Presensi Scanner QR Code:** Pemindai native untuk kamera laptop (webcam) maupun kamera smartphone, pemilih kamera device ID, dan scan dari file foto/screenshot.
   - **Manajemen Multi-Kegiatan:** Tambah, edit kuota, saklar modul dinamis, dan buka/tutup form.
   - **Rekap Logistik Kaos:** Matriks ukuran (S/M/L/XL/XXL/XXXL) dan panjang lengan (pendek/hijab).
   - **Monitoring Satuan Pendidikan:** Pantau sekolah yang belum mendaftar dengan tombol pengingat WhatsApp blast.
   - **Generator Dokumen SPJ:** Format Daftar Hadir Resmi SPJ, Tanda Terima Kaos, tanda tangan KPA, PPTK, dan Bendahara.
   - **Asisten AI Gemini:** Analisis cerdas data pendaftaran dan kehadiran.

3. **Backend REST API Google Apps Script (`Code.gs`)**:
   - Arsitektur headless REST/JSON API murni (`doGet` & `doPost`).
   - Terkoneksi ke basis data Google Spreadsheet.
   - Sanitasi anti formula/CSV injection (CWE-1236).

---

## 🌐 Tautan Akses

- **Portal Publik (GitHub Pages):** [https://dikbudkra.github.io/formgiatsmp/](https://dikbudkra.github.io/formgiatsmp/)
- **Portal Panitia (Marshal):** [https://dikbudkra.github.io/formgiatsmp/marshal/](https://dikbudkra.github.io/formgiatsmp/marshal/)

---

*Hak Cipta © 2026 Bidang SMP - Dinas Pendidikan dan Kebudayaan Kabupaten Karanganyar.*
