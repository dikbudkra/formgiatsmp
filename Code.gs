/**
 * =========================================================================
 * PLATFORM FORMULIR KEGIATAN KEDINASAN DINAMIS (MULTI-EVENT ENGINE)
 * DINAS PENDIDIKAN DAN KEBUDAYAAN KABUPATEN KARANGANYAR
 * =========================================================================
 * File: Code.gs
 * Backend Google Apps Script yang mendukung berbagai macam kegiatan:
 * - Pengaturan Dinamis: Judul Kegiatan, Subjudul, Status Form (Buka/Tutup)
 * - Modul ON/OFF: Kaos, Panjang Lengan, Gender (L/P), Kontak Darurat, Riwayat Kesehatan
 * - Pengaturan Kuota Peserta per Satuan Pendidikan (1, 2, 3, atau Bebas)
 * - Pop-up Pengumuman Informasi Awal (ON/OFF + Judul & Isi Pesan)
 * - Database Adaptif: Kolom Nama Kegiatan & Panjang Lengan otomatis terintegrasi
 * - Dashboard Logistik, Rekap Ukuran Kaos, Laporan Sekolah Belum Daftar & Ekspor Data
 */

// ID Spreadsheet Google Database
const SPREADSHEET_ID = "17OxbZ2Je54HT3wIN-s_XbehVe6JE5L-UrSikTFQ8cDo";

// Nama-nama Sheet Database
const SHEET_PESERTA = "Data_Peserta";
const SHEET_LOGIN_PANITIA = "Login_Panitia";
const SHEET_MASTER = "Master_SMP";
const SHEET_CONFIG = "Config";
const FOLDER_SPJ_ID = "1Rhc_GVXNtFA8wPzkgerLCztrXQeML037";
const SHEET_TEMPLATE_SPJ = "Master_Template_SPJ";
const SHEET_MASTER_KEGIATAN = "Master_Kegiatan";


// Default Akun Panitia
const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PIN = "L@wu1234%"; // Default Password Panitia

// Pengaturan Default Platform Multi-Kegiatan
const DEFAULT_APP_SETTINGS = {
  NAMA_KEGIATAN: "PENDAFTARAN KEGIATAN KEDINASAN",
  SUB_KEGIATAN: "Bidang SMP - Dinas Pendidikan dan Kebudayaan Kabupaten Karanganyar",
  STATUS_FORM: "TUTUP",             // BUKA / TUTUP (TUTUP jika belum ada kegiatan dibuat)
  KUOTA_PER_SEKOLAH: "1",          // 1, 2, 3, bebas
  MODUL_KAOS: "OFF",                // ON / OFF
  MODUL_LENGAN: "OFF",              // ON / OFF (Hanya jika Kaos ON)
  MODUL_GENDER: "ON",              // ON / OFF
  MODUL_KONTAK_DARURAT: "OFF",      // ON / OFF
  MODUL_KESEHATAN: "OFF",           // ON / OFF
  MODUL_ETICKET_PRESENSI: "ON",    // ON / OFF (E-Ticket QR Code & Scanner Presensi Kamera HP)
  MODUL_POPUP_INFO: "OFF",         // ON / OFF
  POPUP_INFO_JUDUL: "Pengumuman",
  POPUP_INFO_PESAN: "Selamat datang di formulir pendaftaran kegiatan resmi Dinas Pendidikan dan Kebudayaan Kabupaten Karanganyar.",
  TANGGAL_PELAKSANAAN: "-",
  LOKASI_KEGIATAN: "-",
  ADMIN_PIN: "L@wu1234%"
};

// Master Daftar Sekolah Bawaan Karanganyar
const DEFAULT_SMP_KARANGANYAR = [
  { npsn: "20312064", nama: "SMP NEGERI 1 KARANGANYAR", status: "Negeri", kecamatan: "Karanganyar" },
  { npsn: "20312065", nama: "SMP NEGERI 2 KARANGANYAR", status: "Negeri", kecamatan: "Karanganyar" },
  { npsn: "20312066", nama: "SMP NEGERI 3 KARANGANYAR", status: "Negeri", kecamatan: "Karanganyar" },
  { npsn: "20312067", nama: "SMP NEGERI 4 KARANGANYAR", status: "Negeri", kecamatan: "Karanganyar" },
  { npsn: "20312068", nama: "SMP NEGERI 5 KARANGANYAR", status: "Negeri", kecamatan: "Karanganyar" },
  { npsn: "20312069", nama: "SMP NEGERI 1 JATEN", status: "Negeri", kecamatan: "Jaten" },
  { npsn: "20312070", nama: "SMP NEGERI 2 JATEN", status: "Negeri", kecamatan: "Jaten" },
  { npsn: "20312071", nama: "SMP NEGERI 1 COLOMADU", status: "Negeri", kecamatan: "Colomadu" },
  { npsn: "20312072", nama: "SMP NEGERI 2 COLOMADU", status: "Negeri", kecamatan: "Colomadu" },
  { npsn: "20312073", nama: "SMP NEGERI 3 COLOMADU", status: "Negeri", kecamatan: "Colomadu" },
  { npsn: "20312074", nama: "SMP NEGERI 1 GONDANGREJO", status: "Negeri", kecamatan: "Gondangrejo" },
  { npsn: "20312075", nama: "SMP NEGERI 2 GONDANGREJO", status: "Negeri", kecamatan: "Gondangrejo" },
  { npsn: "20312076", nama: "SMP NEGERI 1 KEBAKKRAMAT", status: "Negeri", kecamatan: "Kebakkramat" },
  { npsn: "20312077", nama: "SMP NEGERI 2 KEBAKKRAMAT", status: "Negeri", kecamatan: "Kebakkramat" },
  { npsn: "20312078", nama: "SMP NEGERI 3 KEBAKKRAMAT", status: "Negeri", kecamatan: "Kebakkramat" },
  { npsn: "20312079", nama: "SMP NEGERI 1 TASIKMADU", status: "Negeri", kecamatan: "Tasikmadu" },
  { npsn: "20312080", nama: "SMP NEGERI 2 TASIKMADU", status: "Negeri", kecamatan: "Tasikmadu" },
  { npsn: "20312081", nama: "SMP NEGERI 1 MATESIH", status: "Negeri", kecamatan: "Matesih" },
  { npsn: "20312082", nama: "SMP NEGERI 2 MATESIH", status: "Negeri", kecamatan: "Matesih" },
  { npsn: "20312083", nama: "SMP NEGERI 1 KARANGPANDAN", status: "Negeri", kecamatan: "Karangpandan" },
  { npsn: "20312084", nama: "SMP NEGERI 2 KARANGPANDAN", status: "Negeri", kecamatan: "Karangpandan" },
  { npsn: "20312085", nama: "SMP NEGERI 1 NGARGOYOSO", status: "Negeri", kecamatan: "Ngargoyoso" },
  { npsn: "20312086", nama: "SMP NEGERI 2 NGARGOYOSO", status: "Negeri", kecamatan: "Ngargoyoso" },
  { npsn: "20312087", nama: "SMP NEGERI 1 TAWANGMANGU", status: "Negeri", kecamatan: "Tawangmangu" },
  { npsn: "20312088", nama: "SMP NEGERI 2 TAWANGMANGU", status: "Negeri", kecamatan: "Tawangmangu" },
  { npsn: "20312089", nama: "SMP NEGERI 1 JUMAPOLO", status: "Negeri", kecamatan: "Jumapolo" },
  { npsn: "20312090", nama: "SMP NEGERI 2 JUMAPOLO", status: "Negeri", kecamatan: "Jumapolo" },
  { npsn: "20312091", nama: "SMP NEGERI 3 JUMAPOLO", status: "Negeri", kecamatan: "Jumapolo" },
  { npsn: "20312092", nama: "SMP NEGERI 1 JUMANTONO", status: "Negeri", kecamatan: "Jumantono" },
  { npsn: "20312093", nama: "SMP NEGERI 2 JUMANTONO", status: "Negeri", kecamatan: "Jumantono" },
  { npsn: "20312094", nama: "SMP NEGERI 1 JATIPURO", status: "Negeri", kecamatan: "Jatipuro" },
  { npsn: "20312095", nama: "SMP NEGERI 2 JATIPURO", status: "Negeri", kecamatan: "Jatipuro" },
  { npsn: "20312096", nama: "SMP NEGERI 3 JATIPURO", status: "Negeri", kecamatan: "Jatipuro" },
  { npsn: "20312097", nama: "SMP NEGERI 1 JATIYOSO", status: "Negeri", kecamatan: "Jatiyoso" },
  { npsn: "20312098", nama: "SMP NEGERI 2 JATIYOSO", status: "Negeri", kecamatan: "Jatiyoso" },
  { npsn: "20312099", nama: "SMP NEGERI 1 KERJO", status: "Negeri", kecamatan: "Kerjo" },
  { npsn: "20312100", nama: "SMP NEGERI 2 KERJO", status: "Negeri", kecamatan: "Kerjo" },
  { npsn: "20312101", nama: "SMP NEGERI 1 JENAWI", status: "Negeri", kecamatan: "Jenawi" },
  { npsn: "20312102", nama: "SMP NEGERI 2 JENAWI", status: "Negeri", kecamatan: "Jenawi" },
  { npsn: "20312103", nama: "SMP NEGERI 1 MOJOGEDANG", status: "Negeri", kecamatan: "Mojogedang" },
  { npsn: "20312104", nama: "SMP NEGERI 2 MOJOGEDANG", status: "Negeri", kecamatan: "Mojogedang" },
  { npsn: "20312105", nama: "SMP NEGERI 3 MOJOGEDANG", status: "Negeri", kecamatan: "Mojogedang" },
  { npsn: "20312106", nama: "SMP MUHAMMADIYAH 1 KARANGANYAR", status: "Swasta", kecamatan: "Karanganyar" },
  { npsn: "20312107", nama: "SMP MUHAMMADIYAH 2 KARANGANYAR", status: "Swasta", kecamatan: "Karanganyar" },
  { npsn: "20312108", nama: "SMP MUHAMMADIYAH 3 KARANGANYAR", status: "Swasta", kecamatan: "Karanganyar" },
  { npsn: "20312109", nama: "SMP MUHAMMADIYAH 4 KARANGANYAR", status: "Swasta", kecamatan: "Karanganyar" },
  { npsn: "20312110", nama: "SMP MUHAMMADIYAH 7 COLOMADU", status: "Swasta", kecamatan: "Colomadu" },
  { npsn: "20312111", nama: "SMP MUHAMMADIYAH 9 GONDANGREJO", status: "Swasta", kecamatan: "Gondangrejo" },
  { npsn: "70035571", nama: "SMP AL AMAANAH MATESIH", status: "Swasta", kecamatan: "Matesih" }
];

/**
 * Helper untuk mendapatkan objek Spreadsheet
 */
function getSpreadsheet_() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    // Abaikan jika standalone
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * --------------------------------------------------------------------------
 * 1. INISIALISASI & SETUP DATABASE (Multi-Event Engine)
 * --------------------------------------------------------------------------
 */

/**
 * =========================================================================
 * FUNGSI SETUP / MIGRASI DATABASE MULTI-KEGIATAN
 * PANDUAN PENGGUNAAN MAS BOS:
 * 1. Buka Google Apps Script editor.
 * 2. Di toolbar atas, pilih fungsi "JALANKAN_SETUP_DATABASE_MULTI_KEGIATAN".
 * 3. Klik tombol "Run" / "Jalankan".
 * 4. Buka Log Eksekusi untuk melihat status migrasi database.
 * =========================================================================
 */
function JALANKAN_SETUP_DATABASE_MULTI_KEGIATAN() {
  const ss = getSpreadsheet_();
  Logger.log("=== MEMULAI SETUP DATABASE MULTI-KEGIATAN DISDIKBUD KARANGANYAR ===");
  Logger.log("Spreadsheet: " + ss.getName() + " (" + ss.getUrl() + ")");

  // 1. Setup Sheet Master_Kegiatan
  const headersKegiatan = [
    "ID Kegiatan",
    "Nama Kegiatan",
    "Sub Kegiatan",
    "Status Form",
    "Kuota Per Sekolah",
    "Modul Kaos",
    "Modul Lengan",
    "Modul Gender",
    "Modul Kontak Darurat",
    "Modul Kesehatan",
    "Modul ETicket Presensi",
    "Tanggal Pelaksanaan",
    "Lokasi Kegiatan",
    "Waktu Dibuat"
  ];

  let sheetKegiatan = ss.getSheetByName(SHEET_MASTER_KEGIATAN);
  if (!sheetKegiatan) {
    sheetKegiatan = ss.insertSheet(SHEET_MASTER_KEGIATAN);
    sheetKegiatan.appendRow(headersKegiatan);
    Logger.log("✨ Sheet 'Master_Kegiatan' baru saja dibuat!");
  } else {
    Logger.log("ℹ️ Sheet 'Master_Kegiatan' sudah ada, memeriksa kolom...");
  }

  // Format Header Master_Kegiatan
  try {
    sheetKegiatan.getRange(1, 1, 1, headersKegiatan.length)
      .setBackground("#1e3a8a")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheetKegiatan.setFrozenRows(1);
  } catch (eFmt) {}

  // Periksa data kegiatan di Master_Kegiatan (Tidak melakukan auto-seed agar jika kosong tetap kosong)
  const kegiatanData = sheetKegiatan.getDataRange().getValues();
  Logger.log(`ℹ️ Sheet 'Master_Kegiatan' saat ini berisi ${Math.max(0, kegiatanData.length - 1)} kegiatan.`);

  // 2. Setup & Migrasi Sheet Data_Peserta (22 Kolom Komprehensif)
  const headers22 = [
    "Timestamp",
    "ID Registrasi",
    "Nama Kegiatan",
    "Nama Satuan Pendidikan",
    "NPSN",
    "Status Sekolah",
    "Kecamatan",
    "Nama Lengkap & Gelar",
    "Status Kepegawaian",
    "NIP",
    "Golongan",
    "Pangkat",
    "Jabatan / Peran",
    "Jenis Kelamin",
    "Ukuran Kaos",
    "Panjang Lengan",
    "No. WhatsApp",
    "Riwayat Penyakit / Alergi",
    "Nama Kontak Darurat",
    "No. HP Kontak Darurat",
    "Status Kehadiran",
    "Waktu Hadir"
  ];

  let sheetPeserta = ss.getSheetByName(SHEET_PESERTA);
  if (!sheetPeserta) {
    sheetPeserta = ss.insertSheet(SHEET_PESERTA);
    sheetPeserta.appendRow(headers22);
    Logger.log("✨ Sheet 'Data_Peserta' baru saja dibuat dengan 22 kolom!");
  } else {
    if (sheetPeserta.getLastRow() === 0) {
      sheetPeserta.appendRow(headers22);
      Logger.log("✨ Header 'Data_Peserta' baru saja ditambahkan!");
    } else {
      const headerCur = sheetPeserta.getRange(1, 1, 1, Math.max(sheetPeserta.getLastColumn(), 1)).getValues()[0];
      const headerNames = headerCur.map(h => String(h).trim().toLowerCase());

      // Pastikan ada kolom "Nama Kegiatan" di kolom C (index 3)
      if (!headerNames.includes("nama kegiatan")) {
        sheetPeserta.insertColumnBefore(3);
        sheetPeserta.getRange(1, 3).setValue("Nama Kegiatan");
        Logger.log("✅ Kolom 'Nama Kegiatan' berhasil disisipkan ke Kolom 3 Data_Peserta!");
      }

      // Pastikan ada kolom "Panjang Lengan"
      if (!headerNames.includes("panjang lengan")) {
        const lastCol = sheetPeserta.getLastColumn();
        sheetPeserta.getRange(1, lastCol + 1).setValue("Panjang Lengan");
        Logger.log("✅ Kolom 'Panjang Lengan' berhasil ditambahkan!");
      }

      // Pastikan ada kolom "Status Kehadiran" & "Waktu Hadir" untuk Presensi
      if (!headerNames.some(h => h.includes("kehadiran"))) {
        const lastCol = sheetPeserta.getLastColumn();
        sheetPeserta.getRange(1, lastCol + 1).setValue("Status Kehadiran");
        sheetPeserta.getRange(1, lastCol + 2).setValue("Waktu Hadir");
        Logger.log("✅ Kolom 'Status Kehadiran' dan 'Waktu Hadir' berhasil ditambahkan!");
      }
    }
  }

  // Format Header Data_Peserta
  try {
    sheetPeserta.getRange(1, 1, 1, Math.max(sheetPeserta.getLastColumn(), 22))
      .setBackground("#0f172a")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheetPeserta.setFrozenRows(1);
  } catch (eFmt) {}

  // 3. Jalankan pemeliharaan tabel lainnya (Config, Login_Panitia, Template_SPJ)
  ensureDatabaseReady_();

  Logger.log("\n=======================================================");
  Logger.log("🎉 DATABASE SPREADSHEET 100% SIAP UNTUK 2 ATAU LEBIH KEGIATAN!");
  Logger.log("=======================================================");
  
  return "Database berhasil disiapkan! Silakan cek sheet Master_Kegiatan dan Data_Peserta di Google Sheets.";
}

function ensureDatabaseReady_() {
  const ss = getSpreadsheet_();

  // 1. Sheet Config (Penyimpanan Key-Value Dinamis)
  let sheetConfig = ss.getSheetByName(SHEET_CONFIG);
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEET_CONFIG);
    sheetConfig.appendRow(["Key", "Value", "Keterangan"]);
  }

  // Cek apakah key default sudah terisi di Config
  const existingConfig = sheetConfig.getDataRange().getValues();
  const existingKeys = new Set();
  for (let i = 1; i < existingConfig.length; i++) {
    existingKeys.add(String(existingConfig[i][0]).trim());
  }

  Object.keys(DEFAULT_APP_SETTINGS).forEach(k => {
    if (!existingKeys.has(k)) {
      sheetConfig.appendRow([k, DEFAULT_APP_SETTINGS[k], "Pengaturan " + k]);
    }
  });

  // 2. Sheet Login_Panitia
  let sheetLogin = ss.getSheetByName(SHEET_LOGIN_PANITIA);
  if (!sheetLogin) {
    sheetLogin = ss.insertSheet(SHEET_LOGIN_PANITIA);
    sheetLogin.appendRow(["Username", "PIN / Password", "Nama Panitia", "Role / Peran", "Status", "Terakhir Login"]);
    sheetLogin.appendRow([DEFAULT_ADMIN_USER, "'" + DEFAULT_ADMIN_PIN, "Panitia Kegiatan", "Superadmin", "Aktif", "-"]);
  }

  // 3. Sheet Data_Peserta (22 Kolom Komprehensif)
  const headers22 = [
    "Timestamp",
    "ID Registrasi",
    "Nama Kegiatan",
    "Nama Satuan Pendidikan",
    "NPSN",
    "Status Sekolah",
    "Kecamatan",
    "Nama Lengkap & Gelar",
    "Status Kepegawaian",
    "NIP",
    "Golongan",
    "Pangkat",
    "Jabatan / Peran",
    "Jenis Kelamin",
    "Ukuran Kaos",
    "Panjang Lengan",
    "No. WhatsApp",
    "Riwayat Penyakit / Alergi",
    "Nama Kontak Darurat",
    "No. HP Kontak Darurat",
    "Status Kehadiran",
    "Waktu Hadir"
  ];

  let sheetPeserta = ss.getSheetByName(SHEET_PESERTA);
  if (!sheetPeserta) {
    sheetPeserta = ss.insertSheet(SHEET_PESERTA);
    sheetPeserta.appendRow(headers22);
  } else {
    // Migrasi otomatis header Data_Peserta
    if (sheetPeserta.getLastRow() === 0) {
      sheetPeserta.appendRow(headers22);
    } else {
      const headerCur = sheetPeserta.getRange(1, 1, 1, Math.max(sheetPeserta.getLastColumn(), 1)).getValues()[0];
      const headerNames = headerCur.map(h => String(h).trim().toLowerCase());
      if (!headerNames.includes("nama kegiatan")) {
        sheetPeserta.insertColumnBefore(3);
        sheetPeserta.getRange(1, 3).setValue("Nama Kegiatan");
      }
      if (!headerNames.includes("panjang lengan")) {
        sheetPeserta.insertColumnAfter(15);
        sheetPeserta.getRange(1, 16).setValue("Panjang Lengan");
      }
      if (!headerNames.some(h => h.includes("kehadiran"))) {
        const lastCol = sheetPeserta.getLastColumn();
        sheetPeserta.getRange(1, lastCol + 1).setValue("Status Kehadiran");
        sheetPeserta.getRange(1, lastCol + 2).setValue("Waktu Hadir");
      }
    }
  }

  // 4. Sheet Master_Template_SPJ (Koleksi Template SPJ & Doc)
  let sheetSpj = ss.getSheetByName(SHEET_TEMPLATE_SPJ);
  if (!sheetSpj) {
    sheetSpj = ss.insertSheet(SHEET_TEMPLATE_SPJ);
    sheetSpj.appendRow([
      "ID Template",
      "Nama Dokumen",
      "Tipe File",
      "File ID Drive",
      "Nama File Asli",
      "Ukuran File",
      "Tanggal Upload",
      "Metadata JSON",
      "Status"
    ]);
    sheetSpj.appendRow([
      "TPL-SPJ-01",
      "Daftar Penerimaan Uang Saku & Transport",
      "XLSX",
      "DEFAULT",
      "Daftar_Penerimaan_Uang_Saku_Standar.xlsx",
      "Bawaan",
      Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm"),
      JSON.stringify({
        jenis: "Uang Saku",
        hasNominal: true,
        defaultNominal: 200000,
        defaultHari: 1,
        defaultPajak: "PPh21_Golongan",
        pejabat: {
          kpa: { nama: "Rehatta Rakasiwi, S.Psi.,M.Si", nip: "198401162011011009", jabatan: "Kepala Bidang SMP selaku Kuasa Pengguna Anggaran" },
          pptk: { nama: "Agus Pruwitanto, S.Sos", nip: "197408191999031005", jabatan: "Pejabat Pelaksana Teknis Kegiatan" },
          bendahara: { nama: "Dwi Suprasetiarini, S.M", nip: "197610022010012002", jabatan: "Bendahara Pengeluaran Pembantu" }
        }
      }),
      "Aktif"
    ]);
  }

  // 5. Sheet Master_Kegiatan (Multi-Event Engine Terintegrasi)
  const headersKegiatan = [
    "ID Kegiatan",
    "Nama Kegiatan",
    "Sub Kegiatan",
    "Status Form",
    "Kuota Per Sekolah",
    "Modul Kaos",
    "Modul Lengan",
    "Modul Gender",
    "Modul Kontak Darurat",
    "Modul Kesehatan",
    "Modul ETicket Presensi",
    "Tanggal Pelaksanaan",
    "Lokasi Kegiatan",
    "Waktu Dibuat"
  ];
  let sheetKegiatan = ss.getSheetByName(SHEET_MASTER_KEGIATAN);
  if (!sheetKegiatan) {
    sheetKegiatan = ss.insertSheet(SHEET_MASTER_KEGIATAN);
    sheetKegiatan.appendRow(headersKegiatan);
  } else if (sheetKegiatan.getLastRow() === 0) {
    sheetKegiatan.appendRow(headersKegiatan);
  }

  // 6. Sheet Master_SMP
  let sheetMaster = ss.getSheetByName(SHEET_MASTER);
  if (!sheetMaster) {
    sheetMaster = ss.insertSheet(SHEET_MASTER);
    sheetMaster.appendRow(["NPSN", "Nama Satuan Pendidikan", "Status Sekolah", "Kecamatan"]);
    DEFAULT_SMP_KARANGANYAR.forEach(s => {
      sheetMaster.appendRow(["'" + s.npsn, s.nama, s.status, s.kecamatan]);
    });
  } else if (sheetMaster.getLastRow() <= 1) {
    DEFAULT_SMP_KARANGANYAR.forEach(s => {
      sheetMaster.appendRow(["'" + s.npsn, s.nama, s.status, s.kecamatan]);
    });
  }
}

/**
 * --------------------------------------------------------------------------
 * 1.5 REST & JSON API DISPATCHER (HEADLESS ARCHITECTURE)
 * --------------------------------------------------------------------------
 * Google Apps Script bertindak sebagai backend API murni (REST/JSON)
 * untuk frontend modern yang di-host di GitHub Pages.
 */

/**
 * Handle HTTP GET - Melayani endpoint REST API publik & status server
 */
function doGet(e) {
  try {
    ensureDatabaseReady_();
  } catch (err) {
    Logger.log("doGet ensureDatabase notice: " + err.toString());
  }

  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || "";

    if (!action) {
      // Direct browser visit to GAS Web App URL
      const info = {
        success: true,
        status: "online",
        platform: "JeMPROT - Formulir Kegiatan Kedinasan Dinamis (Multi-Event Engine)",
        agency: "Bidang SMP - Dinas Pendidikan dan Kebudayaan Kabupaten Karanganyar",
        frontend_url: "https://dikbudkra.github.io/formgiatsmp/",
        panitia_url: "https://dikbudkra.github.io/formgiatsmp/marshal/",
        timestamp: new Date().toISOString()
      };
      return ContentService.createTextOutput(JSON.stringify(info))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const result = handleApiRequest_(action, params);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "API Error (doGet): " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle HTTP POST - Melayani mutasi, pendaftaran, dan operasi API utama
 */
function doPost(e) {
  try {
    ensureDatabaseReady_();
  } catch (err) {
    Logger.log("doPost ensureDatabase notice: " + err.toString());
  }

  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (errJson) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || (e && e.parameter && e.parameter.action) || "";
    const result = handleApiRequest_(action, payload);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "API Error (doPost): " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Router Terpusat untuk Seluruh Aksi API (GET / POST)
 */
function handleApiRequest_(action, payload) {
  payload = payload || {};
  switch (action) {
    case "ping":
      return { success: true, message: "PONG", timestamp: new Date().toISOString() };

    case "init":
    case "getInitialFormData":
      return getInitialFormData(payload.targetEventIdOrName || payload.eventId || payload.eventName);

    case "getAppSettings":
    case "getSettings":
      return { success: true, settings: getAppSettings() };

    case "saveAppSettings":
    case "saveSettings":
      return saveAppSettings(payload.newSettings || payload.settings || {}, payload.pin);

    case "verifyAdminPin":
    case "checkPin":
      return verifyAdminPinWithGuard_(payload.pin);

    case "getSchoolList":
      return getSchoolList();

    case "getRegisteredSchoolList":
    case "getRegisteredSchools":
      return getRegisteredSchoolList(payload.namaKegiatan || payload.eventName || "");

    case "getActiveEvents":
    case "getEvents":
      return getActiveEventsForPublic();

    case "getAllEventsForAdmin":
    case "getAdminEvents":
      return getAllEventsForAdmin(payload.pin);

    case "saveEvent":
      return saveEvent(payload.eventData || payload, payload.pin);

    case "toggleEventStatus":
    case "toggleEvent":
      return toggleEventStatus(payload.eventId, payload.newStatus, payload.pin);

    case "deleteEvent":
      return deleteEvent(payload.eventId, payload.pin);

    case "submitRegistration":
    case "register":
      return submitRegistration(payload.formData || payload);

    case "checkInParticipant":
    case "checkIn":
      return checkInParticipant(payload.regId, payload.pin, payload.eventId);

    case "getAdminDashboardData":
    case "getAdminDashboard":
      return getAdminDashboardData(payload.pin, payload.targetEventIdOrName || payload.eventName || payload.eventId);

    case "deleteParticipant":
      return deleteParticipant(payload.regId, payload.pin);

    case "archiveAndResetEvent":
      return archiveAndResetEvent(payload.pin);

    case "getSpjTemplateList":
    case "getSpjTemplates":
      return getSpjTemplateList(payload.pin);

    case "uploadSpjTemplate":
      return uploadSpjTemplate(payload.fileData || payload, payload.pin);

    case "deleteSpjTemplate":
      return deleteSpjTemplate(payload.templateId, payload.pin);

    case "getSpjGeneratorData":
      return getSpjGeneratorData(payload.params || payload, payload.pin);

    case "askGemini":
      return askGeminiAboutActiveEvent(payload.question || payload.prompt, payload.pin);

    case "testGemini":
      return testGeminiConnection();

    case "setupDatabase":
    case "runMigration":
      const resMigration = JALANKAN_SETUP_DATABASE_MULTI_KEGIATAN();
      return { success: true, message: resMigration };

    default:
      return { success: false, message: "Aksi API tidak dikenal: '" + action + "'" };
  }
}

/**
 * --------------------------------------------------------------------------
 * 2. MANAJEMEN PENGATURAN PLATFORM (GET & SAVE SETTINGS)
 * --------------------------------------------------------------------------
 */
function getAppSettings() {
  const settings = { ...DEFAULT_APP_SETTINGS };
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_CONFIG);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      // Kunci sensitif yang dilarang bocor ke publik client
      const sensitiveKeys = ["ADMIN_PIN", "GEMINI_API_KEY", "PASSWORD", "SECRET", "API_KEY"];
      for (let i = 1; i < data.length; i++) {
        const k = String(data[i][0]).trim();
        const v = String(data[i][1]).trim();
        if (k && !sensitiveKeys.includes(k.toUpperCase())) {
          settings[k] = v;
        }
      }
    }
  } catch (e) {
    Logger.log("Error getAppSettings: " + e.toString());
  }
  return settings;
}

function saveAppSettings(newSettings, pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }

  try {
    const ss = getSpreadsheet_();
    let sheet = ss.getSheetByName(SHEET_CONFIG);
    if (!sheet) {
      ensureDatabaseReady_();
      sheet = ss.getSheetByName(SHEET_CONFIG);
    }

    const data = sheet.getDataRange().getValues();
    const keyRowMap = {};
    for (let i = 1; i < data.length; i++) {
      keyRowMap[String(data[i][0]).trim()] = i + 1; // 1-based row index
    }

    Object.keys(newSettings).forEach(k => {
      const val = String(newSettings[k]).trim();
      if (keyRowMap[k]) {
        sheet.getRange(keyRowMap[k], 2).setValue(val);
      } else {
        sheet.appendRow([k, val, "Pengaturan " + k]);
      }
    });

    return {
      success: true,
      message: "Pengaturan kegiatan berhasil disimpan!",
      settings: getAppSettings()
    };
  } catch (err) {
    Logger.log("Error saveAppSettings: " + err.toString());
    return { success: false, message: "Gagal menyimpan pengaturan: " + err.message };
  }
}

/**
 * Verifikasi PIN Panitia Baku (Raw Internal Check)
 */
function verifyAdminPinRaw_(pin) {
  if (!pin) return false;
  const inputPin = String(pin).trim();
  if (inputPin === "L@wu1234%" || inputPin === DEFAULT_ADMIN_PIN) return true;

  try {
    const ss = getSpreadsheet_();
    const sheetLogin = ss.getSheetByName(SHEET_LOGIN_PANITIA);
    if (sheetLogin) {
      const data = sheetLogin.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const storedPin = String(data[i][1]).replace(/^'/, "").trim();
        const status = String(data[i][4] || "").trim().toLowerCase();
        if (storedPin === inputPin && status !== "nonaktif" && status !== "inactive") {
          try {
            // Catat waktu login terakhir panitia
            sheetLogin.getRange(i + 1, 6).setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm:ss"));
          } catch (e) {}
          return true;
        }
      }
    }

    const sheetConfig = ss.getSheetByName(SHEET_CONFIG);
    if (sheetConfig) {
      const configData = sheetConfig.getDataRange().getValues();
      for (let j = 1; j < configData.length; j++) {
        if (String(configData[j][0]).trim().toUpperCase() === "ADMIN_PIN") {
          const cfgPin = String(configData[j][1]).replace(/^'/, "").trim();
          if (cfgPin === inputPin) return true;
        }
      }
    }
  } catch (e) {
    Logger.log("Error verifyAdminPinRaw_: " + e.toString());
  }

  return false;
}

/**
 * Verifikasi PIN Panitia dengan Proteksi Anti Brute-Force (Lockout 15 Menit jika 5x Salah)
 */
function verifyAdminPinWithGuard_(pin) {
  if (!pin) {
    return { success: false, valid: false, message: "PIN Panitia wajib diisi." };
  }

  let cache = null;
  try {
    cache = CacheService.getScriptCache();
  } catch (eCache) {
    cache = null;
  }

  const lockKey = "PIN_LOCKOUT_PANITIA";
  const failKey = "PIN_FAILED_ATTEMPTS";

  // Periksa apakah sedang dalam masa penguncian (lockout)
  if (cache) {
    const isLocked = cache.get(lockKey);
    if (isLocked) {
      return {
        success: false,
        valid: false,
        locked: true,
        message: "Akses PIN dikunci sementara karena 5x percobaan salah berturut-turut. Silakan coba kembali setelah 15 menit demi keamanan data."
      };
    }
  }

  const isValid = verifyAdminPinRaw_(pin);
  if (isValid) {
    if (cache) {
      try { cache.remove(failKey); } catch (e) {}
    }
    return {
      success: true,
      valid: true,
      message: "Verifikasi PIN Panitia berhasil."
    };
  } else {
    let currentFails = 1;
    if (cache) {
      try {
        const storedFails = cache.get(failKey);
        if (storedFails) {
          currentFails = parseInt(storedFails, 10) + 1;
        }
      } catch (eF) {
        currentFails = 1;
      }

      if (currentFails >= 5) {
        try {
          cache.put(lockKey, "LOCKED", 900); // Kunci 15 menit (900 detik)
          cache.remove(failKey);
        } catch (eL) {}
        return {
          success: false,
          valid: false,
          locked: true,
          message: "PIN salah 5 kali! Akses portal panitia terkunci selama 15 menit demi keamanan data."
        };
      } else {
        try {
          cache.put(failKey, String(currentFails), 600); // Ingat percobaan selama 10 menit
        } catch (eS) {}
        const sisa = 5 - currentFails;
        return {
          success: false,
          valid: false,
          locked: false,
          remainingAttempts: sisa,
          message: `PIN salah! Sisa percobaan: ${sisa} kali sebelum akses dikunci.`
        };
      }
    }

    return {
      success: false,
      valid: false,
      locked: false,
      message: "PIN Panitia tidak sesuai."
    };
  }
}

/**
 * Wrapper Verifikasi PIN untuk Operasi Internal (Mengecek juga status lockout)
 */
function verifyAdminPin(pin) {
  try {
    const cache = CacheService.getScriptCache();
    if (cache && cache.get("PIN_LOCKOUT_PANITIA")) return false;
  } catch (e) {}
  return verifyAdminPinRaw_(pin);
}

/**
 * Sanitasi Input Anti Formula / CSV Injection (CWE-1236)
 * Mencegah eksekusi rumus berbahaya (=, +, -, @, \t, \r) saat data diekspor ke Spreadsheet / Excel.
 */
function sanitizeSpreadsheetInput_(val) {
  if (val === null || val === undefined) return "-";
  let str = String(val).trim();
  if (!str) return "-";
  const firstChar = str.charAt(0);
  if (firstChar === "=" || firstChar === "+" || firstChar === "-" || firstChar === "@" || firstChar === "\t" || firstChar === "\r") {
    return "'" + str;
  }
  return str;
}

/**
 * --------------------------------------------------------------------------
 * 3. MASTER SEKOLAH & PENGECEKAN KUOTA KEGIATAN AKTIF
 * --------------------------------------------------------------------------
 */
function getSchoolList() {
  try {
    const ss = getSpreadsheet_();
    let sheet = ss.getSheetByName(SHEET_MASTER);
    if (!sheet) {
      ensureDatabaseReady_();
      sheet = ss.getSheetByName(SHEET_MASTER);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [...DEFAULT_SMP_KARANGANYAR];
    }

    const headerRow = data[0].map(h => String(h).trim().toLowerCase());
    let idxNpsn = headerRow.findIndex(h => h.includes("npsn"));
    let idxNama = headerRow.findIndex(h => h.includes("nama") || h.includes("satuan") || h.includes("sekolah"));
    let idxStatus = headerRow.findIndex(h => h.includes("status") || h.includes("bentuk"));
    let idxKec = headerRow.findIndex(h => h.includes("kecamatan") || h.includes("wilayah"));

    if (idxNpsn === -1) idxNpsn = 0;
    if (idxNama === -1) idxNama = 1;
    if (idxStatus === -1) idxStatus = 2;
    if (idxKec === -1) idxKec = 3;

    const schools = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const nama = String(row[idxNama] || "").trim();
      const npsn = String(row[idxNpsn] || "").replace(/^'/, "").trim();
      const status = String(row[idxStatus] || "-").trim();
      const kecamatan = String(row[idxKec] || "-").trim();

      if (nama && nama !== "-" && !nama.toLowerCase().includes("nama satuan")) {
        schools.push({
          npsn: npsn || "-",
          nama: nama,
          status: status || "-",
          kecamatan: kecamatan || "-"
        });
      }
    }

    if (schools.length === 0) return [...DEFAULT_SMP_KARANGANYAR];
    schools.sort((a, b) => a.nama.localeCompare(b.nama));
    return schools;
  } catch (error) {
    Logger.log("Error getSchoolList: " + error.toString());
    return [...DEFAULT_SMP_KARANGANYAR];
  }
}

/**
 * Mengambil daftar sekolah yang sudah mendaftar KHUSUS untuk kegiatan tertentu
 */
function getRegisteredSchoolList(namaKegiatan) {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_PESERTA);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    // Deteksi letak kolom secara dinamis
    const headerRow = data[0].map(h => String(h).trim().toLowerCase());
    const idxKegiatan = headerRow.findIndex(h => h.includes("kegiatan"));
    let idxSekolah = headerRow.findIndex(h => h.includes("satuan") || h.includes("sekolah"));
    let idxNpsn = headerRow.findIndex(h => h.includes("npsn"));
    let idxNamaPeserta = headerRow.findIndex(h => h.includes("nama lengkap") || h.includes("peserta"));

    if (idxSekolah === -1) idxSekolah = idxKegiatan !== -1 ? 3 : 2;
    if (idxNpsn === -1) idxNpsn = idxKegiatan !== -1 ? 4 : 3;
    if (idxNamaPeserta === -1) idxNamaPeserta = idxKegiatan !== -1 ? 7 : 6;

    const targetKegiatan = String(namaKegiatan || "").trim().toLowerCase();
    const schoolMap = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowKegiatan = idxKegiatan !== -1 ? String(row[idxKegiatan] || "").trim().toLowerCase() : "";

      // Jika ada filter nama kegiatan, sesuaikan
      if (targetKegiatan && rowKegiatan && rowKegiatan !== targetKegiatan) {
        continue;
      }

      const namaSekolah = String(row[idxSekolah] || "").trim();
      const npsn = String(row[idxNpsn] || "").replace(/^'/, "").trim();
      const namaPeserta = String(row[idxNamaPeserta] || "").trim();

      if (namaSekolah || npsn) {
        const key = npsn && npsn !== "-" ? npsn : namaSekolah.toLowerCase();
        if (!schoolMap[key]) {
          schoolMap[key] = {
            nama: namaSekolah.toLowerCase(),
            origNama: namaSekolah,
            npsn: npsn,
            count: 0,
            participants: []
          };
        }
        schoolMap[key].count++;
        if (namaPeserta) schoolMap[key].participants.push(namaPeserta);
      }
    }

    return Object.values(schoolMap);
  } catch (e) {
    Logger.log("Error getRegisteredSchoolList: " + e.toString());
    return [];
  }
}

/**
 * --------------------------------------------------------------------------
 * 3.1 ENGINE MULTI-KEGIATAN (MULTI-EVENT MANAGEMENT)
 * --------------------------------------------------------------------------
 */

// Helper internal mengambil seluruh daftar kegiatan dari Master_Kegiatan
function getAllEventsForAdminInternal_() {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_MASTER_KEGIATAN);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const events = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = String(row[0] || "").trim();
      if (id) {
        events.push({
          idKegiatan: id,
          namaKegiatan: String(row[1] || "").trim(),
          subKegiatan: String(row[2] || "").trim(),
          statusForm: String(row[3] || "BUKA").trim().toUpperCase(),
          kuotaPerSekolah: String(row[4] || "1").trim(),
          modulKaos: String(row[5] || "ON").trim().toUpperCase(),
          modulLengan: String(row[6] || "ON").trim().toUpperCase(),
          modulGender: String(row[7] || "ON").trim().toUpperCase(),
          modulKontakDarurat: String(row[8] || "ON").trim().toUpperCase(),
          modulKesehatan: String(row[9] || "ON").trim().toUpperCase(),
          modulEticketPresensi: String(row[10] || "ON").trim().toUpperCase(),
          tanggalPelaksanaan: String(row[11] || "-").trim(),
          lokasiKegiatan: String(row[12] || "-").trim(),
          waktuDibuat: row[13] ? Utilities.formatDate(new Date(row[13]), Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm") : "-"
        });
      }
    }
    return events;
  } catch (err) {
    Logger.log("Error getAllEventsForAdminInternal_: " + err.toString());
    return [];
  }
}

/**
 * Mengambil daftar seluruh kegiatan untuk Portal Panitia
 */
function getAllEventsForAdmin(pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }
  try {
    ensureDatabaseReady_();
    const events = getAllEventsForAdminInternal_();
    return { success: true, events: events };
  } catch (err) {
    Logger.log("Error getAllEventsForAdmin: " + err.toString());
    return { success: false, message: err.message };
  }
}

/**
 * Menyimpan kegiatan baru atau memperbarui kegiatan lama dari Dashboard Web
 */
function saveEvent(eventData, pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }
  const nama = String(eventData.namaKegiatan || "").trim();
  if (!nama) {
    return { success: false, message: "Nama Kegiatan wajib diisi!" };
  }

  try {
    ensureDatabaseReady_();
    const ss = getSpreadsheet_();
    let sheet = ss.getSheetByName(SHEET_MASTER_KEGIATAN);
    if (!sheet) {
      ensureDatabaseReady_();
      sheet = ss.getSheetByName(SHEET_MASTER_KEGIATAN);
    }

    const data = sheet.getDataRange().getValues();
    const eventId = String(eventData.idKegiatan || "").trim();
    let targetRow = -1;

    if (eventId) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === eventId) {
          targetRow = i + 1;
          break;
        }
      }
    }

    const now = new Date();
    const timestampStr = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm:ss");
    const finalId = targetRow !== -1 ? eventId : ("EVT-" + Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyMMdd") + "-" + Math.floor(100 + Math.random() * 900));

    const rowData = [
      finalId,
      nama,
      String(eventData.subKegiatan || "Bidang SMP - Dinas Pendidikan dan Kebudayaan Kabupaten Karanganyar").trim(),
      String(eventData.statusForm || "BUKA").trim().toUpperCase(),
      String(eventData.kuotaPerSekolah || "1").trim(),
      String(eventData.modulKaos || "ON").trim().toUpperCase(),
      String(eventData.modulLengan || "ON").trim().toUpperCase(),
      String(eventData.modulGender || "ON").trim().toUpperCase(),
      String(eventData.modulKontakDarurat || "ON").trim().toUpperCase(),
      String(eventData.modulKesehatan || "ON").trim().toUpperCase(),
      String(eventData.modulEticketPresensi || "ON").trim().toUpperCase(),
      String(eventData.tanggalPelaksanaan || "-").trim(),
      String(eventData.lokasiKegiatan || "Kabupaten Karanganyar").trim(),
      timestampStr
    ];

    if (targetRow !== -1) {
      sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return {
      success: true,
      message: targetRow !== -1 ? "Kegiatan berhasil diperbarui!" : "Kegiatan baru berhasil ditambahkan!",
      idKegiatan: finalId
    };
  } catch (err) {
    Logger.log("Error saveEvent: " + err.toString());
    return { success: false, message: "Gagal menyimpan kegiatan: " + err.message };
  }
}

/**
 * Toggle Status BUKA / TUTUP Kegiatan
 */
function toggleEventStatus(eventId, newStatus, pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_MASTER_KEGIATAN);
    if (!sheet) return { success: false, message: "Sheet Master_Kegiatan tidak ditemukan." };

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(eventId).trim()) {
        const statusVal = String(newStatus).trim().toUpperCase() === "BUKA" ? "BUKA" : "TUTUP";
        sheet.getRange(i + 1, 4).setValue(statusVal);
        return { success: true, message: `Status kegiatan berhasil diubah menjadi ${statusVal}.`, newStatus: statusVal };
      }
    }
    return { success: false, message: "ID Kegiatan tidak ditemukan." };
  } catch (err) {
    Logger.log("Error toggleEventStatus: " + err.toString());
    return { success: false, message: err.message };
  }
}

/**
 * Hapus / Arsipkan Kegiatan dari Daftar
 * Jika terdapat data peserta pada kegiatan ini di Data_Peserta, otomatis arsipkan
 * ke sheet baru bernama 'ARSIP_[NamaKegiatan]' dan hapus data peserta tersebut dari Data_Peserta
 * agar database tetap bersih dan data lama tidak hilang.
 */
function deleteEvent(eventId, pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, message: "Server sedang sibuk, silakan coba beberapa saat lagi." };
  }

  try {
    const ss = getSpreadsheet_();
    const sheetKegiatan = ss.getSheetByName(SHEET_MASTER_KEGIATAN);
    if (!sheetKegiatan) {
      lock.releaseLock();
      return { success: false, message: "Sheet Master_Kegiatan tidak ditemukan." };
    }

    const dataKegiatan = sheetKegiatan.getDataRange().getValues();
    let eventRowIndex = -1;
    let targetEventName = "";

    for (let i = 1; i < dataKegiatan.length; i++) {
      if (String(dataKegiatan[i][0]).trim() === String(eventId).trim()) {
        eventRowIndex = i + 1; // 1-based index
        targetEventName = String(dataKegiatan[i][1] || "").trim();
        break;
      }
    }

    if (eventRowIndex === -1) {
      lock.releaseLock();
      return { success: false, message: "ID Kegiatan tidak ditemukan." };
    }

    // 1. Cek Peserta Terdaftar di Sheet Data_Peserta
    const sheetPeserta = ss.getSheetByName(SHEET_PESERTA);
    let totalArchived = 0;
    let finalArchiveName = "";

    if (sheetPeserta && sheetPeserta.getLastRow() > 1) {
      const pesertaData = sheetPeserta.getDataRange().getValues();
      const headers = pesertaData[0];
      const lastCol = sheetPeserta.getLastColumn();

      // Cari kolom "Nama Kegiatan" (biasanya kolom 3 / index 2)
      let colKegiatanIdx = 2;
      for (let c = 0; c < headers.length; c++) {
        if (String(headers[c]).toLowerCase().includes("kegiatan")) {
          colKegiatanIdx = c;
          break;
        }
      }

      // Kumpulkan baris peserta yang sesuai dengan kegiatan ini
      const matchingRowIndices = []; // 1-based row numbers
      const archivedRows = [];

      for (let r = 1; r < pesertaData.length; r++) {
        const rowVal = pesertaData[r];
        const rowKegiatan = String(rowVal[colKegiatanIdx] || "").trim();
        if (rowKegiatan.toLowerCase() === targetEventName.toLowerCase() ||
            rowKegiatan.toLowerCase() === String(eventId).toLowerCase()) {
          matchingRowIndices.push(r + 1);
          archivedRows.push(rowVal);
        }
      }

      // Jika ada data peserta yang perlu diarsipkan
      if (archivedRows.length > 0) {
        totalArchived = archivedRows.length;
        const cleanName = (targetEventName || "Kegiatan")
          .replace(/[:\\/?*\[\]]/g, "_")
          .trim()
          .substring(0, 70);

        const baseArchiveName = "ARSIP_" + cleanName;
        finalArchiveName = baseArchiveName;
        let v = 1;
        while (ss.getSheetByName(finalArchiveName)) {
          v++;
          finalArchiveName = baseArchiveName.substring(0, 85 - String(v).length) + "_v" + v;
        }

        const newSheet = ss.insertSheet(finalArchiveName);
        newSheet.appendRow(headers);
        newSheet.getRange(1, 1, 1, lastCol)
          .setFontWeight("bold")
          .setBackground("#ea580c")
          .setFontColor("#ffffff");
        newSheet.setFrozenRows(1);

        // Masukkan seluruh baris data peserta
        const chunkSize = 500;
        for (let i = 0; i < archivedRows.length; i += chunkSize) {
          const chunk = archivedRows.slice(i, i + chunkSize);
          newSheet.getRange(newSheet.getLastRow() + 1, 1, chunk.length, chunk[0].length).setValues(chunk);
        }

        try {
          newSheet.autoResizeColumns(1, Math.min(lastCol, 22));
        } catch (eResize) {}

        // Hapus baris peserta dari Data_Peserta dari bawah ke atas agar indeks tidak geser
        matchingRowIndices.reverse().forEach(rowIndex => {
          sheetPeserta.deleteRow(rowIndex);
        });
      }
    }

    // 2. Hapus baris kegiatan dari Master_Kegiatan
    sheetKegiatan.deleteRow(eventRowIndex);

    // 3. Reset sheet Config jika kegiatan yang dihapus merupakan kegiatan yang sedang aktif di Config
    // atau jika seluruh kegiatan di Master_Kegiatan telah habis (0 kegiatan aktif)
    const sheetConfig = ss.getSheetByName(SHEET_CONFIG);
    if (sheetConfig) {
      const cfgData = sheetConfig.getDataRange().getValues();
      const remainingEvents = Math.max(0, sheetKegiatan.getLastRow() - 1);
      for (let i = 1; i < cfgData.length; i++) {
        const k = String(cfgData[i][0]).trim();
        if (k === "NAMA_KEGIATAN" && (remainingEvents <= 0 || String(cfgData[i][1]).trim().toLowerCase() === targetEventName.toLowerCase())) {
          sheetConfig.getRange(i + 1, 2).setValue("KEGIATAN BIDANG SMP");
        } else if (k === "STATUS_FORM" && (remainingEvents <= 0 || String(cfgData[i][1]).trim().toLowerCase() === targetEventName.toLowerCase())) {
          sheetConfig.getRange(i + 1, 2).setValue("TUTUP");
        } else if (remainingEvents <= 0 && (k === "TANGGAL_PELAKSANAAN" || k === "LOKASI_KEGIATAN")) {
          sheetConfig.getRange(i + 1, 2).setValue("-");
        }
      }
    }

    lock.releaseLock();

    let msg = `Kegiatan "${targetEventName}" berhasil dihapus dari daftar aktif.`;
    if (totalArchived > 0) {
      msg = `Kegiatan "${targetEventName}" berhasil diarsipkan ke sheet "${finalArchiveName}" (${totalArchived} peserta) dan dihapus dari daftar aktif. Data peserta aman tersimpan!`;
    }

    return {
      success: true,
      archiveSheetName: finalArchiveName,
      totalArchived: totalArchived,
      message: msg
    };
  } catch (err) {
    try { lock.releaseLock(); } catch (e) {}
    Logger.log("Error deleteEvent: " + err.toString());
    return { success: false, message: err.message };
  }
}

/**
 * Mengambil daftar kegiatan yang berstatus 'BUKA' untuk ditampilkan di halaman publik
 */
function getActiveEventsForPublic() {
  try {
    ensureDatabaseReady_();
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_MASTER_KEGIATAN);
    if (!sheet || sheet.getLastRow() <= 1) {
      return {
        success: true,
        events: []
      };
    }

    const data = sheet.getDataRange().getValues();
    const activeEvents = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = String(row[3] || "").trim().toUpperCase();
      if (status === "BUKA") {
        activeEvents.push({
          idKegiatan: String(row[0] || "").trim(),
          namaKegiatan: String(row[1] || "").trim(),
          subKegiatan: String(row[2] || "").trim(),
          statusForm: "BUKA",
          kuotaPerSekolah: String(row[4] || "1").trim(),
          modulKaos: String(row[5] || "ON").trim().toUpperCase(),
          modulLengan: String(row[6] || "ON").trim().toUpperCase(),
          modulGender: String(row[7] || "ON").trim().toUpperCase(),
          modulKontakDarurat: String(row[8] || "ON").trim().toUpperCase(),
          modulKesehatan: String(row[9] || "ON").trim().toUpperCase(),
          modulEticketPresensi: String(row[10] || "ON").trim().toUpperCase(),
          tanggalPelaksanaan: String(row[11] || "-").trim(),
          lokasiKegiatan: String(row[12] || "-").trim()
        });
      }
    }

    return {
      success: true,
      events: activeEvents
    };
  } catch (err) {
    Logger.log("Error getActiveEventsForPublic: " + err.toString());
    return { success: false, events: [], message: err.message };
  }
}

/**
 * --------------------------------------------------------------------------
 * 3.2 FITUR PRESENSI & SCANNER QR HARI H
 * --------------------------------------------------------------------------
 */

/**
 * Memproses Check-in kehadiran peserta (via Scan QR Code atau input manual)
 */
function checkInParticipant(regId, pin, eventId) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }
  const cleanRegId = String(regId || "").trim();
  if (!cleanRegId) {
    return { success: false, message: "ID Registrasi tidak boleh kosong." };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (e) {}

  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_PESERTA);
    if (!sheet) return { success: false, message: "Sheet Data_Peserta tidak ditemukan." };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, message: "Belum ada data peserta." };

    const headerRow = data[0].map(h => String(h).trim().toLowerCase());
    let idxRegId = headerRow.findIndex(h => h.includes("id registrasi") || h.includes("reg id"));
    if (idxRegId === -1) idxRegId = 1;

    let idxHadir = headerRow.findIndex(h => h.includes("status kehadiran") || h.includes("kehadiran"));
    let idxWaktuHadir = headerRow.findIndex(h => h.includes("waktu hadir") || h.includes("jam hadir"));

    if (idxHadir === -1) {
      idxHadir = headerRow.length;
      sheet.getRange(1, idxHadir + 1).setValue("Status Kehadiran");
    }
    if (idxWaktuHadir === -1) {
      idxWaktuHadir = idxHadir + 1;
      sheet.getRange(1, idxWaktuHadir + 1).setValue("Waktu Hadir");
    }

    let foundRow = -1;
    let participantData = null;

    for (let i = 1; i < data.length; i++) {
      const curId = String(data[i][idxRegId] || "").trim();
      if (curId.toUpperCase() === cleanRegId.toUpperCase()) {
        foundRow = i + 1;
        participantData = {
          namaLengkap: String(data[i][7] || data[i][6] || "-"),
          namaSekolah: String(data[i][3] || data[i][2] || "-"),
          namaKegiatan: String(data[i][2] || "-"),
          regId: curId,
          statusKehadiran: String(data[i][idxHadir] || "BELUM HADIR")
        };
        break;
      }
    }

    if (foundRow === -1) {
      return { success: false, message: `ID Registrasi "${cleanRegId}" tidak ditemukan!` };
    }

    const now = new Date();
    const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm:ss");
    const sudahHadir = String(data[foundRow - 1][idxHadir] || "").trim().toUpperCase() === "HADIR";

    sheet.getRange(foundRow, idxHadir + 1).setValue("HADIR");
    sheet.getRange(foundRow, idxWaktuHadir + 1).setValue(timeStr);

    return {
      success: true,
      alreadyCheckedIn: sudahHadir,
      message: sudahHadir
        ? `Peserta ${participantData.namaLengkap} sudah pernah check-in sebelumnya.`
        : `Check-in berhasil! ${participantData.namaLengkap} (${participantData.namaSekolah}) tercatat HADIR.`,
      data: {
        ...participantData,
        statusKehadiran: "HADIR",
        waktuHadir: timeStr
      }
    };
  } catch (err) {
    Logger.log("Error checkInParticipant: " + err.toString());
    return { success: false, message: "Gagal memproses check-in: " + err.message };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * --------------------------------------------------------------------------
 * 3.3 CEK STATUS PENDAFTARAN SEKOLAH SECARA MANDIRI (Masked Data Privacy)
 * --------------------------------------------------------------------------
 */
function searchSchoolStatus(keyword, eventIdOrName) {
  try {
    const cleanKw = String(keyword || "").trim().toLowerCase();
    if (!cleanKw || cleanKw.length < 2) {
      return { success: false, message: "Ketik minimal 2 karakter nama sekolah atau kecamatan." };
    }

    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_PESERTA);
    if (!sheet) return { success: true, results: [] };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, results: [] };

    const headerRow = data[0].map(h => String(h).trim().toLowerCase());
    const idxKegiatan = headerRow.findIndex(h => h.includes("kegiatan"));
    const idxSekolah = headerRow.findIndex(h => h.includes("satuan") || h.includes("sekolah"));
    const idxNpsn = headerRow.findIndex(h => h.includes("npsn"));
    const idxKec = headerRow.findIndex(h => h.includes("kecamatan"));
    const idxNama = headerRow.findIndex(h => h.includes("nama lengkap") || h.includes("peserta"));
    const idxNip = headerRow.findIndex(h => h.includes("nip"));
    const idxJabatan = headerRow.findIndex(h => h.includes("jabatan") || h.includes("peran"));
    const idxStatusPeg = headerRow.findIndex(h => h.includes("status kepegawaian"));
    const idxWa = headerRow.findIndex(h => h.includes("whatsapp") || h.includes("wa"));
    const idxRegId = headerRow.findIndex(h => h.includes("id registrasi"));
    const idxHadir = headerRow.findIndex(h => h.includes("kehadiran"));

    const targetKeg = String(eventIdOrName || "").trim().toLowerCase();
    const results = [];

    // Masking demi privasi data sesuai UU PDP
    const maskNip = (nip) => {
      const s = String(nip || "").replace(/[^0-9]/g, "");
      if (s.length >= 8) return s.slice(0, 4) + "********" + s.slice(-3);
      return "-";
    };
    const maskWa = (wa) => {
      const s = String(wa || "").replace(/[^0-9]/g, "");
      if (s.length >= 8) return s.slice(0, 4) + "****" + s.slice(-3);
      return "-";
    };

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowKeg = idxKegiatan !== -1 ? String(row[idxKegiatan] || "").trim() : "";
      if (targetKeg && rowKeg.toLowerCase() !== targetKeg) {
        continue;
      }

      const namaSekolah = String(row[idxSekolah !== -1 ? idxSekolah : 3] || "").trim();
      const npsn = String(row[idxNpsn !== -1 ? idxNpsn : 4] || "").replace(/^'/, "").trim();
      const kecamatan = String(row[idxKec !== -1 ? idxKec : 6] || "").trim();

      if (namaSekolah.toLowerCase().includes(cleanKw) || npsn.includes(cleanKw) || kecamatan.toLowerCase().includes(cleanKw)) {
        results.push({
          namaSekolah: namaSekolah,
          npsn: npsn,
          kecamatan: kecamatan,
          namaKegiatan: rowKeg,
          namaPeserta: String(row[idxNama !== -1 ? idxNama : 7] || "-"),
          jabatan: String(row[idxJabatan !== -1 ? idxJabatan : 12] || "-"),
          statusKepegawaian: String(row[idxStatusPeg !== -1 ? idxStatusPeg : 8] || "-"),
          nipMasked: maskNip(row[idxNip !== -1 ? idxNip : 9]),
          noWaMasked: maskWa(row[idxWa !== -1 ? idxWa : 16]),
          regId: String(row[idxRegId !== -1 ? idxRegId : 1] || "-"),
          statusKehadiran: String(row[idxHadir !== -1 ? idxHadir : 20] || "BELUM HADIR")
        });
      }
    }

    return {
      success: true,
      keyword: keyword,
      total: results.length,
      results: results
    };
  } catch (err) {
    Logger.log("Error searchSchoolStatus: " + err.toString());
    return { success: false, message: "Terjadi kesalahan pencarian: " + err.message };
  }
}

/**
 * Data inisialisasi lengkap untuk Formulir Peserta
 */
function getInitialFormData(targetEventIdOrName) {
  try {
    ensureDatabaseReady_();
    let settings = getAppSettings();
    const activeEventsRes = getActiveEventsForPublic();
    const activeEvents = activeEventsRes.events || [];

    // Jika ada target event tertentu yang dipilih
    if (targetEventIdOrName) {
      const allEvents = getAllEventsForAdminInternal_();
      const matched = allEvents.find(ev => ev.idKegiatan === targetEventIdOrName || ev.namaKegiatan.toLowerCase() === String(targetEventIdOrName).toLowerCase());
      if (matched) {
        settings = {
          ...settings,
          ID_KEGIATAN: matched.idKegiatan,
          NAMA_KEGIATAN: matched.namaKegiatan,
          SUB_KEGIATAN: matched.subKegiatan,
          STATUS_FORM: matched.statusForm,
          KUOTA_PER_SEKOLAH: matched.kuotaPerSekolah,
          MODUL_KAOS: matched.modulKaos,
          MODUL_LENGAN: matched.modulLengan,
          MODUL_GENDER: matched.modulGender,
          MODUL_KONTAK_DARURAT: matched.modulKontakDarurat,
          MODUL_KESEHATAN: matched.modulKesehatan,
          MODUL_ETICKET_PRESENSI: matched.modulEticketPresensi,
          TANGGAL_PELAKSANAAN: matched.tanggalPelaksanaan,
          LOKASI_KEGIATAN: matched.lokasiKegiatan
        };
      }
    } else if (activeEvents.length === 1) {
      const ev = activeEvents[0];
      settings = {
        ...settings,
        ID_KEGIATAN: ev.idKegiatan,
        NAMA_KEGIATAN: ev.namaKegiatan,
        SUB_KEGIATAN: ev.subKegiatan,
        STATUS_FORM: ev.statusForm,
        KUOTA_PER_SEKOLAH: ev.kuotaPerSekolah,
        MODUL_KAOS: ev.modulKaos,
        MODUL_LENGAN: ev.modulLengan,
        MODUL_GENDER: ev.modulGender,
        MODUL_KONTAK_DARURAT: ev.modulKontakDarurat,
        MODUL_KESEHATAN: ev.modulKesehatan,
        MODUL_ETICKET_PRESENSI: ev.modulEticketPresensi,
        TANGGAL_PELAKSANAAN: ev.tanggalPelaksanaan,
        LOKASI_KEGIATAN: ev.lokasiKegiatan
      };
    } else if (activeEvents.length === 0) {
      settings = {
        ...settings,
        ID_KEGIATAN: "",
        NAMA_KEGIATAN: "Belum Ada Kegiatan Aktif",
        SUB_KEGIATAN: "Saat ini belum ada formulir pendaftaran yang dibuka oleh panitia.",
        STATUS_FORM: "TUTUP",
        KUOTA_PER_SEKOLAH: "0",
        TANGGAL_PELAKSANAAN: "-",
        LOKASI_KEGIATAN: "-"
      };
    }

    const schools = getSchoolList();
    const registeredSchools = getRegisteredSchoolList(settings.NAMA_KEGIATAN);

    return {
      success: true,
      settings: settings,
      schools: schools,
      registeredSchools: registeredSchools,
      activeEvents: activeEvents
    };
  } catch (err) {
    Logger.log("Error getInitialFormData: " + err.toString());
    return {
      success: false,
      settings: { ...DEFAULT_APP_SETTINGS },
      schools: [...DEFAULT_SMP_KARANGANYAR],
      registeredSchools: [],
      activeEvents: [],
      message: err.toString()
    };
  }
}

/**
 * --------------------------------------------------------------------------
 * 4. SIMPAN FORMULIR PENDAFTARAN PESERTA (Multi-Event Engine)
 * --------------------------------------------------------------------------
 */
function submitRegistration(formData) {
  const lock = LockService.getScriptLock();
  let hasLock = false;
  try {
    try {
      hasLock = lock.tryLock(5000);
    } catch (lockErr) {
      hasLock = false;
      Logger.log("Lock notice: " + (lockErr ? lockErr.toString() : ""));
    }

    ensureDatabaseReady_();
    let settings = getAppSettings();

    // Bind event setting jika dikirimkan dari frontend
    const targetEventId = String(formData.idKegiatan || "").trim();
    const targetEventName = String(formData.namaKegiatan || "").trim();

    if (targetEventId || targetEventName) {
      const allEvents = getAllEventsForAdminInternal_();
      const matched = allEvents.find(ev => (targetEventId && ev.idKegiatan === targetEventId) || (targetEventName && ev.namaKegiatan.toLowerCase() === targetEventName.toLowerCase()));
      if (matched) {
        settings = {
          ...settings,
          ID_KEGIATAN: matched.idKegiatan,
          NAMA_KEGIATAN: matched.namaKegiatan,
          SUB_KEGIATAN: matched.subKegiatan,
          STATUS_FORM: matched.statusForm,
          KUOTA_PER_SEKOLAH: matched.kuotaPerSekolah,
          MODUL_KAOS: matched.modulKaos,
          MODUL_LENGAN: matched.modulLengan,
          MODUL_GENDER: matched.modulGender,
          MODUL_KONTAK_DARURAT: matched.modulKontakDarurat,
          MODUL_KESEHATAN: matched.modulKesehatan,
          MODUL_ETICKET_PRESENSI: matched.modulEticketPresensi,
          TANGGAL_PELAKSANAAN: matched.tanggalPelaksanaan,
          LOKASI_KEGIATAN: matched.lokasiKegiatan
        };
      }
    }

    // 1. Cek status form & kegiatan standby
    if (settings.STATUS_FORM === "TUTUP" || String(settings.NAMA_KEGIATAN || "").trim().toUpperCase() === "KEGIATAN BIDANG SMP") {
      return {
        success: false,
        message: "PENDAFTARAN SAAT INI SEDANG DITUTUP / BELUM ADA KEGIATAN AKTIF. Silakan hubungi panitia penyelenggara pada Bidang SMP DISDIKBUD Karanganyar."
      };
    }

    // 2. Validasi Wajib Sisi Server (Backend Safeguard)
    const cleanNama = String(formData.namaLengkap || "").trim();
    const cleanSekolah = String(formData.namaSekolah || "").trim();
    const cleanStatusPeg = String(formData.statusKepegawaian || "").trim();

    if (!cleanNama || cleanNama.length < 2) {
      return {
        success: false,
        message: "Nama Lengkap wajib diisi dengan benar!"
      };
    }
    if (!cleanSekolah || cleanSekolah === "-") {
      return {
        success: false,
        message: "Asal Satuan Pendidikan (Sekolah) wajib dipilih/diisi!"
      };
    }
    if (!cleanStatusPeg || cleanStatusPeg === "-") {
      return {
        success: false,
        message: "Status Kepegawaian wajib dipilih!"
      };
    }

    // 3. Proteksi Kuota per Satuan Pendidikan (SMP)
    const cleanNpsn = String(formData.npsn || "").replace(/^'/, "").trim();
    const cleanStatusSekolah = String(formData.statusSekolah || "").trim().toLowerCase();
    const isUnitKerjaLain = cleanNpsn === "-" || 
                            cleanStatusSekolah.includes("unit kerja") || 
                            cleanStatusSekolah.includes("lain") ||
                            String(formData.kategoriUnit || "").toUpperCase() === "LAIN";

    if (!isUnitKerjaLain) {
      const kuotaStr = String(settings.KUOTA_PER_SEKOLAH || "1").toLowerCase().trim();
      const isBebas = kuotaStr === "bebas" || kuotaStr === "0";
      const maxKuota = isBebas ? 999 : parseInt(kuotaStr, 10) || 1;

      const registeredList = getRegisteredSchoolList(settings.NAMA_KEGIATAN);
      const cleanNamaSekolah = cleanSekolah.toLowerCase();

      const existing = registeredList.find(r => 
        (cleanNpsn && cleanNpsn !== "-" && r.npsn === cleanNpsn) ||
        (cleanNamaSekolah && cleanNamaSekolah !== "-" && r.nama === cleanNamaSekolah)
      );

      if (existing && existing.count >= maxKuota) {
        const pesertaList = existing.participants.length > 0 ? " (" + existing.participants.join(", ") + ")" : "";
        return {
          success: false,
          isDuplicate: true,
          message: `Batas kuota pendaftaran untuk sekolah "${formData.namaSekolah}" pada kegiatan "${settings.NAMA_KEGIATAN}" sudah terpenuhi (${existing.count} dari maksimal ${maxKuota} orang terdaftar: ${pesertaList}). Jika ada pergantian peserta, hubungi panitia.`
        };
      }
    }

    // 4. Sanitasi Data (Angka murni tanpa spasi)
    const nipClean = String(formData.nip || "").replace(/[^0-9]/g, "");
    const noWaClean = String(formData.noWa || "").replace(/[^0-9]/g, "");
    const kontakDaruratHpClean = String(formData.kontakDaruratHp || "").replace(/[^0-9]/g, "");

    if ((cleanStatusPeg === "PNS" || cleanStatusPeg === "PPPK") && nipClean.length !== 18) {
      return {
        success: false,
        message: `NIP untuk ${cleanStatusPeg} harus terdiri dari 18 digit angka murni tanpa spasi!`
      };
    }

    if (!noWaClean || noWaClean.length < 10) {
      return {
        success: false,
        message: "Nomor WhatsApp harus angka murni tanpa spasi dan minimal 10 digit!"
      };
    }

    // Adaptasi modul dinamis
    const jenisKelaminFinal = settings.MODUL_GENDER === "ON" ? (formData.jenisKelamin || "-") : "-";
    const ukuranKaosFinal = settings.MODUL_KAOS === "ON" ? (formData.ukuranKaos || "-") : "-";
    const panjangLenganFinal = (settings.MODUL_KAOS === "ON" && settings.MODUL_LENGAN === "ON") ? (formData.panjangLengan || "-") : "-";
    
    let riwayatPenyakitFinal = "-";
    if (settings.MODUL_KESEHATAN === "ON") {
      riwayatPenyakitFinal = (formData.riwayatPenyakit && String(formData.riwayatPenyakit).trim().toLowerCase() !== "tidak ada")
        ? String(formData.riwayatPenyakit).trim()
        : "Tidak Ada";
    }

    let kontakNamaFinal = "-";
    let kontakHpFinal = "-";
    if (settings.MODUL_KONTAK_DARURAT === "ON") {
      kontakNamaFinal = formData.kontakDaruratNama || "-";
      kontakHpFinal = kontakDaruratHpClean ? "'" + kontakDaruratHpClean : "-";
    }

    const ss = getSpreadsheet_();
    let sheet = ss.getSheetByName(SHEET_PESERTA);
    if (!sheet) {
      ensureDatabaseReady_();
      sheet = ss.getSheetByName(SHEET_PESERTA);
    }

    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm:ss");

    // 5. Generate Collision-Proof Unique ID
    const datePrefix = "REG-" + Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyMMdd") + "-";
    let regId = "";
    const existingIds = new Set();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const idValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      idValues.forEach(row => {
        if (row[0]) existingIds.add(String(row[0]).trim());
      });
    }

    // Karakter alfanumerik non-ambigu (tanpa 0, O, 1, I)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let attempts = 0;
    do {
      let code = "";
      for (let c = 0; c < 5; c++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      regId = datePrefix + code;
      attempts++;
    } while (existingIds.has(regId) && attempts < 100);

    // 6. Sanitasi Formula Injection (CWE-1236)
    const sanitizeFormula = (val) => {
      if (val === null || val === undefined) return "-";
      const s = String(val).trim();
      if (!s) return "-";
      const firstChar = s.charAt(0);
      if (firstChar === "=" || firstChar === "+" || firstChar === "-" || firstChar === "@") {
        return "'" + s;
      }
      return s;
    };

    const newRow = [
      timestamp,
      regId,
      settings.NAMA_KEGIATAN,
      sanitizeFormula(formData.namaSekolah),
      "'" + (formData.npsn || "-"),
      formData.statusSekolah || "-",
      formData.kecamatan || "-",
      sanitizeFormula(formData.namaLengkap),
      cleanStatusPeg,
      nipClean ? "'" + nipClean : "-",
      formData.golongan || "-",
      formData.pangkat || "-",
      sanitizeFormula(formData.jabatan),
      jenisKelaminFinal,
      ukuranKaosFinal,
      panjangLenganFinal,
      "'" + noWaClean,
      sanitizeFormula(riwayatPenyakitFinal),
      sanitizeFormula(kontakNamaFinal),
      kontakHpFinal,
      "BELUM HADIR",
      "-"
    ];

    sheet.appendRow(newRow);

    return {
      success: true,
      regId: regId,
      message: "Pendaftaran berhasil disimpan!",
      data: {
        regId: regId,
        idKegiatan: settings.ID_KEGIATAN || "EVT-01",
        namaKegiatan: settings.NAMA_KEGIATAN,
        subKegiatan: settings.SUB_KEGIATAN || "",
        namaLengkap: formData.namaLengkap,
        namaSekolah: formData.namaSekolah,
        npsn: formData.npsn || "-",
        statusSekolah: formData.statusSekolah || "-",
        kecamatan: formData.kecamatan || "-",
        statusKepegawaian: cleanStatusPeg,
        nip: nipClean || "-",
        golongan: formData.golongan || "-",
        pangkat: formData.pangkat || "-",
        jabatan: formData.jabatan || "-",
        jenisKelamin: jenisKelaminFinal,
        ukuranKaos: ukuranKaosFinal,
        panjangLengan: panjangLenganFinal,
        noWa: noWaClean,
        tanggalPelaksanaan: settings.TANGGAL_PELAKSANAAN || "Menyesuaikan Jadwal Panitia",
        lokasiKegiatan: settings.LOKASI_KEGIATAN || "Kabupaten Karanganyar",
        modulEticket: settings.MODUL_ETICKET_PRESENSI || "ON",
        timestamp: timestamp
      }
    };
  } catch (error) {
    Logger.log("Error submitRegistration: " + error.toString());
    return {
      success: false,
      message: "Gagal menyimpan pendaftaran: " + error.message
    };
  } finally {
    if (hasLock) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}

/**
 * --------------------------------------------------------------------------
 * 5. DASHBOARD REKAP, LOGISTIK & LAPORAN SEKOLAH BELUM DAFTAR
 * --------------------------------------------------------------------------
 */
function getAdminDashboardData(pin, targetEventIdOrName) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }

  try {
    ensureDatabaseReady_();
    let settings = getAppSettings();
    const allEvents = getAllEventsForAdminInternal_();

    let selectedEvent = null;
    if (targetEventIdOrName) {
      selectedEvent = allEvents.find(ev => ev.idKegiatan === targetEventIdOrName || ev.namaKegiatan.toLowerCase() === String(targetEventIdOrName).toLowerCase());
    }
    if (!selectedEvent && allEvents.length > 0) {
      selectedEvent = allEvents.find(ev => ev.statusForm === "BUKA") || allEvents[0];
    }

    if (selectedEvent) {
      settings = {
        ...settings,
        ID_KEGIATAN: selectedEvent.idKegiatan,
        NAMA_KEGIATAN: selectedEvent.namaKegiatan,
        SUB_KEGIATAN: selectedEvent.subKegiatan,
        STATUS_FORM: selectedEvent.statusForm,
        KUOTA_PER_SEKOLAH: selectedEvent.kuotaPerSekolah,
        MODUL_KAOS: selectedEvent.modulKaos,
        MODUL_LENGAN: selectedEvent.modulLengan,
        MODUL_GENDER: selectedEvent.modulGender,
        MODUL_KONTAK_DARURAT: selectedEvent.modulKontakDarurat,
        MODUL_KESEHATAN: selectedEvent.modulKesehatan,
        MODUL_ETICKET_PRESENSI: selectedEvent.modulEticketPresensi,
        TANGGAL_PELAKSANAAN: selectedEvent.tanggalPelaksanaan,
        LOKASI_KEGIATAN: selectedEvent.lokasiKegiatan
      };
    } else {
      settings = {
        ...settings,
        ID_KEGIATAN: "",
        NAMA_KEGIATAN: "Belum Ada Kegiatan",
        SUB_KEGIATAN: "Silakan buat kegiatan baru di tab Kelola Multi-Kegiatan",
        STATUS_FORM: "TUTUP",
        KUOTA_PER_SEKOLAH: "0",
        MODUL_KAOS: "OFF",
        MODUL_LENGAN: "OFF",
        TANGGAL_PELAKSANAAN: "-",
        LOKASI_KEGIATAN: "-"
      };
    }

    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_PESERTA);
    const data = sheet ? sheet.getDataRange().getValues() : [];

    const stats = {
      total: 0,
      gender: { L: 0, P: 0 },
      kaos: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0, "4XL": 0, lenganPendek: 0, lenganPanjang: 0 },
      kaosGender: {
        L: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0, "4XL": 0, lenganPendek: 0, lenganPanjang: 0, total: 0 },
        P: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0, "4XL": 0, lenganPendek: 0, lenganPanjang: 0, total: 0 }
      },
      kepegawaian: { PNS: 0, PPPK: 0, "PPPK PW": 0, "Non ASN": 0 },
      kepegawaianGender: {
        PNS: { L: 0, P: 0 },
        PPPK: { L: 0, P: 0 },
        "PPPK PW": { L: 0, P: 0 },
        "Non ASN": { L: 0, P: 0 }
      },
      golongan: {},
      golonganPNS: {},
      golonganPPPK: {},
      catatanMedisCount: 0,
      kehadiran: { hadir: 0, belumHadir: 0 }
    };

    const participants = [];
    const registeredSchoolCounter = {};

    if (data.length > 1) {
      const headerRow = data[0].map(h => String(h).trim().toLowerCase());
      const hasKegiatanCol = headerRow.includes("nama kegiatan");
      const idxHadir = headerRow.findIndex(h => h.includes("status kehadiran") || h.includes("kehadiran"));
      const idxWaktuHadir = headerRow.findIndex(h => h.includes("waktu hadir") || h.includes("jam hadir"));

      for (let i = 1; i < data.length; i++) {
        const row = data[i];

        // Format row adaptif (22 kolom, 20 kolom atau 18 kolom)
        let rowKeg = hasKegiatanCol ? String(row[2] || "-") : settings.NAMA_KEGIATAN;
        
        // Filter per kegiatan yang dipilih
        if (settings.NAMA_KEGIATAN && rowKeg.trim().toLowerCase() !== settings.NAMA_KEGIATAN.trim().toLowerCase()) {
          continue;
        }

        const offset = hasKegiatanCol ? 1 : 0;
        const statusHadirVal = idxHadir !== -1 ? String(row[idxHadir] || "BELUM HADIR").trim().toUpperCase() : String(row[hasKegiatanCol ? 20 : 18] || "BELUM HADIR").trim().toUpperCase();
        const waktuHadirVal = idxWaktuHadir !== -1 ? String(row[idxWaktuHadir] || "-").trim() : String(row[hasKegiatanCol ? 21 : 19] || "-").trim();

        if (statusHadirVal === "HADIR") {
          stats.kehadiran.hadir++;
        } else {
          stats.kehadiran.belumHadir++;
        }

        const participant = {
          rowNumber: i + 1,
          timestamp: row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm") : "-",
          regId: String(row[1] || "-"),
          namaKegiatan: rowKeg,
          namaSekolah: String(row[2 + offset] || "-"),
          npsn: String(row[3 + offset] || "-").replace(/^'/, ""),
          statusSekolah: String(row[4 + offset] || "-"),
          kecamatan: String(row[5 + offset] || "-"),
          namaLengkap: String(row[6 + offset] || "-"),
          statusKepegawaian: String(row[7 + offset] || "-"),
          nip: String(row[8 + offset] || "-").replace(/^'/, ""),
          golongan: String(row[9 + offset] || "-"),
          pangkat: String(row[10 + offset] || "-"),
          jabatan: String(row[11 + offset] || "-"),
          jenisKelamin: String(row[12 + offset] || "-"),
          ukuranKaos: String(row[13 + offset] || "-"),
          panjangLengan: hasKegiatanCol ? String(row[15] || "-") : "-",
          noWa: String(row[hasKegiatanCol ? 16 : 14] || "-").replace(/^'/, ""),
          riwayatPenyakit: String(row[hasKegiatanCol ? 17 : 15] || "-"),
          kontakDaruratNama: String(row[hasKegiatanCol ? 18 : 16] || "-"),
          kontakDaruratHp: String(row[hasKegiatanCol ? 19 : 17] || "-").replace(/^'/, ""),
          statusKehadiran: statusHadirVal,
          waktuHadir: waktuHadirVal
        };

        participants.push(participant);
        stats.total++;

        // Hitung kuota sekolah (khusus SMP / bukan Unit Kerja Lain)
        const isUnitLain = (participant.npsn === "-" || String(participant.statusSekolah || "").toLowerCase().includes("unit kerja") || String(participant.statusSekolah || "").toLowerCase().includes("lain"));
        if (!isUnitLain) {
          const keySchool = participant.npsn && participant.npsn !== "-" ? participant.npsn : participant.namaSekolah.toLowerCase();
          registeredSchoolCounter[keySchool] = (registeredSchoolCounter[keySchool] || 0) + 1;
        }

        // Gender
        const isL = participant.jenisKelamin === "Laki-laki";
        const isP = participant.jenisKelamin === "Perempuan";
        if (isL) stats.gender.L++;
        else if (isP) stats.gender.P++;

        // Kaos Total & per Gender
        const sz = participant.ukuranKaos;
        if (stats.kaos.hasOwnProperty(sz)) stats.kaos[sz]++;
        else if (sz && sz !== "-") stats.kaos[sz] = 1;

        if (participant.panjangLengan === "Lengan Pendek") stats.kaos.lenganPendek++;
        else if (participant.panjangLengan === "Lengan Panjang") stats.kaos.lenganPanjang++;

        const targetKaosGender = isL ? stats.kaosGender.L : (isP ? stats.kaosGender.P : null);
        if (targetKaosGender) {
          if (sz && sz !== "-") {
            if (targetKaosGender.hasOwnProperty(sz)) targetKaosGender[sz]++;
            else targetKaosGender[sz] = 1;
            targetKaosGender.total++;
          }
          if (participant.panjangLengan === "Lengan Pendek") targetKaosGender.lenganPendek++;
          else if (participant.panjangLengan === "Lengan Panjang") targetKaosGender.lenganPanjang++;
        }

        // Kepegawaian Total & per Gender
        const stPeg = participant.statusKepegawaian;
        if (stats.kepegawaian.hasOwnProperty(stPeg)) stats.kepegawaian[stPeg]++;
        else if (stPeg && stPeg !== "-") stats.kepegawaian[stPeg] = 1;

        if (stats.kepegawaianGender && stats.kepegawaianGender[stPeg]) {
          if (isL) stats.kepegawaianGender[stPeg].L++;
          else if (isP) stats.kepegawaianGender[stPeg].P++;
        }

        // Golongan
        if (participant.golongan && participant.golongan !== "-") {
          const gol = participant.golongan;
          stats.golongan[gol] = (stats.golongan[gol] || 0) + 1;
          if (participant.statusKepegawaian === "PNS") {
            stats.golonganPNS[gol] = (stats.golonganPNS[gol] || 0) + 1;
          } else if (participant.statusKepegawaian === "PPPK") {
            stats.golonganPPPK[gol] = (stats.golonganPPPK[gol] || 0) + 1;
          }
        }

        // Catatan Medis
        const rw = participant.riwayatPenyakit.trim().toLowerCase();
        if (rw && rw !== "-" && rw !== "tidak ada" && rw !== "sehat" && rw !== "nihil") {
          stats.catatanMedisCount++;
        }
      }
    }

    // Ambil Master Sekolah untuk Menghitung Kuota Sekolah Belum Mendaftar
    const kuotaStr = String(settings.KUOTA_PER_SEKOLAH || "1").toLowerCase().trim();
    const isBebas = kuotaStr === "bebas" || kuotaStr === "0";
    const maxKuota = isBebas ? 999 : parseInt(kuotaStr, 10) || 1;

    const allSchools = getSchoolList();
    const unregisteredSchools = [];

    allSchools.forEach(sch => {
      const registeredCount = registeredSchoolCounter[sch.npsn] || registeredSchoolCounter[sch.nama.toLowerCase()] || 0;
      if (registeredCount < maxKuota) {
        unregisteredSchools.push({
          ...sch,
          terdaftar: registeredCount,
          sisaKuota: maxKuota - registeredCount
        });
      }
    });

    return {
      success: true,
      settings: settings,
      allEvents: allEvents,
      stats: stats,
      participants: participants,
      unregisteredSchools: unregisteredSchools,
      totalMasterSekolah: allSchools.length
    };
  } catch (error) {
    Logger.log("Error getAdminDashboardData: " + error.toString());
    return {
      success: false,
      message: "Gagal memuat data panitia: " + error.message
    };
  }
}

/**
 * --------------------------------------------------------------------------
 * 6. HAPUS DATA PESERTA
 * --------------------------------------------------------------------------
 */
function deleteParticipant(regId, pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }
  if (!regId) {
    return { success: false, message: "ID Registrasi tidak valid." };
  }

  const lock = LockService.getScriptLock();
  let hasLock = false;
  try {
    try {
      hasLock = lock.tryLock(10000);
    } catch (e) {
      hasLock = false;
    }

    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_PESERTA);
    if (!sheet) return { success: false, message: "Sheet Data_Peserta tidak ditemukan." };

    const data = sheet.getDataRange().getValues();
    const cleanRegId = String(regId).trim();
    let deletedRow = -1;
    let deletedName = "";
    let deletedSchool = "";

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim() === cleanRegId) {
        deletedRow = i + 1;
        deletedSchool = String(data[i][3] || data[i][2]);
        deletedName = String(data[i][7] || data[i][6]);
        break;
      }
    }

    if (deletedRow > 0) {
      sheet.deleteRow(deletedRow);
      return {
        success: true,
        message: `Data peserta "${deletedName}" dari ${deletedSchool} berhasil dihapus.`
      };
    } else {
      return { success: false, message: `Data dengan ID ${cleanRegId} tidak ditemukan di database.` };
    }
  } catch (error) {
    Logger.log("Error deleteParticipant: " + error.toString());
    return { success: false, message: "Gagal menghapus data: " + error.message };
  } finally {
    if (hasLock) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}

/**
 * --------------------------------------------------------------------------
 * 7. ARSIP & GANTI KEGIATAN (RESET KE "KEGIATAN BIDANG SMP")
 * --------------------------------------------------------------------------
 */
function archiveAndResetEvent(pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }

  const lock = LockService.getScriptLock();
  let hasLock = false;
  try {
    try {
      hasLock = lock.tryLock(15000);
    } catch (e) {
      hasLock = false;
    }
    if (!hasLock) {
      return { success: false, message: "Server sedang sibuk, silakan coba beberapa saat lagi." };
    }

    const ss = getSpreadsheet_();
    const sheetPeserta = ss.getSheetByName(SHEET_PESERTA);
    if (!sheetPeserta) {
      return { success: false, message: "Sheet Data_Peserta tidak ditemukan." };
    }

    const lastRow = sheetPeserta.getLastRow();
    const lastCol = sheetPeserta.getLastColumn();

    // Pencegahan Arsip Kosong: Jangan buat sheet baru jika tidak ada data peserta
    if (lastRow <= 1) {
      return {
        success: false,
        message: "Database saat ini masih kosong (belum ada peserta terdaftar). Tidak ada data kegiatan yang perlu diarsipkan."
      };
    }

    const settings = getAppSettings();
    const rawKegiatan = String(settings.NAMA_KEGIATAN || "Kegiatan").trim();

    // Sanitasi karakter dilarang Google Sheets: : \ / ? * [ ] dan batasi panjang nama sheet
    const cleanKegiatan = rawKegiatan.replace(/[:\/?*\[\]]/g, "_").trim().substring(0, 80);

    // Format penamaan sheet: Arsip_[NamaKegiatan] (tanpa tanggal). Jika sama, gunakan _v2, _v3, dst.
    const baseArchiveName = "Arsip_" + cleanKegiatan;
    let finalArchiveName = baseArchiveName;
    let version = 1;

    while (ss.getSheetByName(finalArchiveName)) {
      version++;
      finalArchiveName = baseArchiveName.substring(0, 95 - String(version).length) + "_v" + version;
    }

    // Salin seluruh isi Data_Peserta ke Sheet Arsip Baru
    const allData = sheetPeserta.getRange(1, 1, lastRow, lastCol).getValues();
    const newArchiveSheet = ss.insertSheet(finalArchiveName);
    newArchiveSheet.getRange(1, 1, lastRow, lastCol).setValues(allData);

    // Beri warna pembeda pada header sheet arsip
    newArchiveSheet.getRange(1, 1, 1, lastCol).setFontWeight("bold").setBackground("#ea580c").setFontColor("#ffffff");
    try { newArchiveSheet.autoResizeColumns(1, Math.min(lastCol, 20)); } catch (e) {}

    // Kosongkan baris data di Data_Peserta (sisakan baris 1 header)
    sheetPeserta.deleteRows(2, lastRow - 1);

    // Update NAMA_KEGIATAN menjadi "KEGIATAN BIDANG SMP" dan STATUS_FORM menjadi "TUTUP" pada sheet Config
    let sheetConfig = ss.getSheetByName(SHEET_CONFIG);
    if (sheetConfig) {
      const cfgData = sheetConfig.getDataRange().getValues();
      let keyKegiatanFound = false;
      let keyStatusFound = false;
      for (let i = 1; i < cfgData.length; i++) {
        const k = String(cfgData[i][0]).trim();
        if (k === "NAMA_KEGIATAN") {
          sheetConfig.getRange(i + 1, 2).setValue("KEGIATAN BIDANG SMP");
          keyKegiatanFound = true;
        } else if (k === "STATUS_FORM") {
          sheetConfig.getRange(i + 1, 2).setValue("TUTUP");
          keyStatusFound = true;
        }
      }
      if (!keyKegiatanFound) {
        sheetConfig.appendRow(["NAMA_KEGIATAN", "KEGIATAN BIDANG SMP", "Pengaturan NAMA_KEGIATAN"]);
      }
      if (!keyStatusFound) {
        sheetConfig.appendRow(["STATUS_FORM", "TUTUP", "Pengaturan STATUS_FORM"]);
      }
    }

    return {
      success: true,
      archiveSheetName: finalArchiveName,
      newEventName: "KEGIATAN BIDANG SMP",
      statusForm: "TUTUP",
      message: `Data kegiatan lama berhasil dipindahkan ke sheet "${finalArchiveName}". Judul kegiatan direset menjadi "KEGIATAN BIDANG SMP" dan status formulir otomatis DITUTUP sampai kegiatan baru diaktifkan.`
    };
  } catch (err) {
    Logger.log("Error archiveAndResetEvent: " + err.toString());
    return { success: false, message: "Gagal memproses arsip dan reset: " + err.message };
  } finally {
    if (hasLock) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}

/**
 * --------------------------------------------------------------------------
 * 8. ASISTEN JEMPROT AI (TANYA JAWAB SEPUTAR DATA KEGIATAN AKTIF)
 * --------------------------------------------------------------------------
 */

/**
 * Ambil Gemini API Key dari Script Properties atau Config Sheet
 */
function getGeminiApiKey_() {
  try {
    const propKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
    if (propKey && propKey.trim()) return propKey.trim();
  } catch (e) {}

  try {
    const ss = getSpreadsheet_();
    const sheetConfig = ss.getSheetByName(SHEET_CONFIG);
    if (sheetConfig) {
      const data = sheetConfig.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toUpperCase() === "GEMINI_API_KEY") {
          const val = String(data[i][1] || "").trim();
          if (val) return val;
        }
      }
    }
  } catch (e) {}

  return "";
}

/**
 * Tanya Jawab Data Kegiatan Aktif dengan Gemini API
 * Dibatasi secara mutlak (strict grounding) hanya menjawab berdasarkan data kegiatan aktif.
 */
function askGeminiAboutActiveEvent(question, pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }

  const cleanQuestion = String(question || "").trim();
  if (!cleanQuestion) {
    return { success: false, message: "Pertanyaan tidak boleh kosong." };
  }

  const apiKey = getGeminiApiKey_();
  if (!apiKey) {
    return {
      success: false,
      message: "API Key Gemini belum disetel. Silakan masukkan GEMINI_API_KEY pada Properti Skrip (Project Settings) di Google Apps Script."
    };
  }

  try {
    const dashData = getAdminDashboardData(pin);
    if (!dashData.success) {
      return { success: false, message: "Gagal memuat data kegiatan: " + dashData.message };
    }

    const settings = dashData.settings || {};
    const stats = dashData.stats || {};
    const participants = dashData.participants || [];
    const unregistered = dashData.unregisteredSchools || [];

    // Jika kegiatan dalam mode standby atau belum ada data
    const isStandby = String(settings.NAMA_KEGIATAN || "").trim().toUpperCase() === "KEGIATAN BIDANG SMP";
    if (isStandby && participants.length === 0) {
      return {
        success: true,
        answer: "Saat ini formulir kegiatan sedang dalam status **Standby / Belum Ada Kegiatan Aktif** (Judul: *KEGIATAN BIDANG SMP*). Belum ada data peserta yang terdaftar.",
        modelUsed: "offline-notice"
      };
    }

    // Format ringkas data peserta agar hemat token dan mudah dianalisis AI
    const compactParticipants = participants.map((p, idx) => ({
      no: idx + 1,
      nama: p.namaLengkap,
      sekolah: p.namaSekolah,
      npsn: p.npsn,
      kecamatan: p.kecamatan,
      statusPeg: p.statusKepegawaian,
      nip: p.nip,
      gol: p.golongan,
      pangkat: p.pangkat,
      jabatan: p.jabatan,
      gender: p.jenisKelamin,
      ukuranKaos: p.ukuranKaos,
      modelLengan: p.panjangLengan,
      noWa: p.noWa,
      catatanKesehatan: p.riwayatPenyakit,
      kontakDarurat: p.kontakDaruratNama ? `${p.kontakDaruratNama} (${p.kontakDaruratHp || '-'})` : "-"
    }));

    const systemInstruction = 
      "Anda adalah 'Jemprot AI - Asisten Analis Data Kegiatan Bidang SMP DISDIKBUD Karanganyar'.\n" +
      "Tugas Anda: Menjawab pertanyaan panitia secara cepat, sopan, dan akurat HANYA DAN EKSKLUSIF BERDASARKAN DATA KEGIATAN AKTIF YANG DILAMPIRKAN DI BAWAH INI.\n\n" +
      "ATURAN MUTLAK (STRICT GROUNDING):\n" +
      "1. Sumber kebenaran satu-satunya adalah DATA RESMI KEGIATAN AKTIF yang terlampir. Anda DILARANG KERAS menjawab informasi umum, pengetahuan ensiklopedia, atau topik lain di luar data ini.\n" +
      "2. Jika panitia menanyakan hal umum atau hal yang datanya TIDAK ADA dalam lampiran, tolak dengan sopan: 'Maaf, informasi tersebut tidak tersedia dalam data pendaftar kegiatan saat ini.'\n" +
      "3. Berikan jawaban dalam Bahasa Indonesia yang profesional, ramah, dan ringkas. Gunakan angka persis, poin (bullet), atau tabel sederhana jika menyajikan rincian peserta atau sekolah.\n" +
      "4. Cocokkan pencarian nama orang, nama sekolah, atau kecamatan secara fleksibel (tidak peka huruf besar/kecil).\n" +
      "5. Tanggal & waktu saat ini: " + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "dd MMMM yyyy HH:mm") + " WIB.";

    const contextData = {
      informasiKegiatan: {
        namaKegiatan: settings.NAMA_KEGIATAN || "-",
        subKegiatan: settings.SUB_KEGIATAN || "-",
        tanggalPelaksanaan: settings.TANGGAL_KEGIATAN || "-",
        tempatPelaksanaan: settings.TEMPAT_KEGIATAN || "-",
        kuotaPerSekolah: settings.KUOTA_PER_SEKOLAH || "1",
        statusFormulir: settings.STATUS_FORM || "BUKA"
      },
      ringkasanStatistik: {
        totalPesertaTerdaftar: stats.total,
        totalSekolahDiDatabase: dashData.totalMasterSekolah,
        komposisiGender: stats.gender,
        komposisiKepegawaian: stats.kepegawaian,
        rincianGolonganPNS: stats.golonganPNS,
        rincianGolonganPPPK: stats.golonganPPPK,
        rekapUkuranKaos: stats.kaos,
        totalPesertaDenganCatatanKesehatan: stats.catatanMedisCount
      },
      sekolahBelumMemenuhiKuota: unregistered.map(s => ({
        nama: s.nama,
        npsn: s.npsn,
        kecamatan: s.kecamatan,
        terdaftar: s.terdaftar,
        sisaKuota: s.sisaKuota
      })),
      daftarLengkapPeserta: compactParticipants
    };

    const userPrompt = 
      "=== DATA RESMI KEGIATAN AKTIF ===\n" +
      JSON.stringify(contextData, null, 2) + "\n\n" +
      "=== PERTANYAAN PANITIA ===\n" +
      cleanQuestion;

    return callGeminiAPI_(apiKey, userPrompt, systemInstruction);

  } catch (err) {
    Logger.log("Error askGeminiAboutActiveEvent: " + err.toString());
    return { success: false, message: "Terjadi kesalahan internal saat memproses pertanyaan: " + err.message };
  }
}

/**
 * Panggilan REST API ke Google Gemini dengan Model Utama & Cadangan
 */
function callGeminiAPI_(apiKey, promptText, systemInstructionText) {
  // Model Utama: gemini-3.1-flash-lite (Terbukti aktif, sangat cepat & hemat token)
  // Model Cadangan: gemini-3.8-flash (Rekomendasi resmi Google), gemini-3-flash-preview
  const models = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3-flash-preview"];
  let lastError = "";

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.95
        }
      };

      if (systemInstructionText) {
        payload.systemInstruction = {
          parts: [{ text: systemInstructionText }]
        };
      }

      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const res = UrlFetchApp.fetch(url, options);
      const code = res.getResponseCode();
      const content = res.getContentText();

      if (code === 200) {
        const json = JSON.parse(content);
        if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) {
          const answer = json.candidates[0].content.parts.map(p => p.text).join("");
          return {
            success: true,
            answer: answer,
            modelUsed: model
          };
        }
      } else {
        Logger.log(`Gemini ${model} gagal (HTTP ${code}): ${content}`);
        lastError = `Model ${model} (HTTP ${code}): ${content}`;
      }
    } catch (e) {
      Logger.log(`Exception saat memanggil model ${model}: ${e.toString()}`);
      lastError = e.message;
    }
  }

  return {
    success: false,
    message: "Gagal mendapatkan respon dari Jemprot AI. " + lastError
  };
}

/**
 * --------------------------------------------------------------------------
 * 9. FUNGSI UJI KONEKSI & OTORISASI IZIN UrlFetchApp (Jalankan 1x dari Editor GAS)
 * --------------------------------------------------------------------------
 */
function mintaIzinAksesInternet() {
  // Panggilan langsung tanpa try-catch agar Google Apps Script memicu jendela dialog "Otorisasi Diperlukan"
  const test = UrlFetchApp.fetch("https://www.google.com");
  Logger.log("Izin Akses Internet (UrlFetchApp) Berhasil Diberikan! Kode: " + test.getResponseCode());
  return "Izin Berhasil Diotorisasi!";
}

function testGeminiConnection() {
  const apiKey = getGeminiApiKey_();
  Logger.log("1. Memeriksa API Key: " + (apiKey ? "DITEMUKAN (Panjang: " + apiKey.length + " karakter)" : "TIDAK DITEMUKAN"));
  
  if (!apiKey) {
    Logger.log("Peringatan: GEMINI_API_KEY belum disetel di Script Properties!");
    return "API Key belum disetel di Script Properties";
  }

  Logger.log("2. Mengirim permintaan uji coba ke Google Gemini...");
  const res = callGeminiAPI_(apiKey, "Tes koneksi sistem. Jawab singkat: 'Koneksi Gemini Berhasil Aktif!'", "");
  Logger.log("3. Respon Gemini: " + JSON.stringify(res));
  return res;
}


/**
 * --------------------------------------------------------------------------
 * 10. MODUL SPJ & DOC (Template Manager & Dynamic Document Generator)
 * --------------------------------------------------------------------------
 */

/**
 * Mengambil daftar seluruh template SPJ & Doc yang aktif
 */
function getSpjTemplateList(pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }

  try {
    ensureDatabaseReady_();
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_TEMPLATE_SPJ);
    if (!sheet) {
      return { success: true, templates: [] };
    }

    const data = sheet.getDataRange().getValues();
    const templates = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = String(row[0] || "").trim();
      const status = String(row[8] || "Aktif").trim().toLowerCase();
      if (id && status !== "dihapus" && status !== "deleted") {
        let meta = {};
        try {
          if (row[7]) meta = JSON.parse(row[7]);
        } catch (e) {}

        templates.push({
          id: id,
          namaDokumen: String(row[1] || "-"),
          tipeFile: String(row[2] || "XLSX").toUpperCase(),
          fileId: String(row[3] || ""),
          namaFileAsli: String(row[4] || "-"),
          ukuranFile: String(row[5] || "-"),
          tanggalUpload: String(row[6] || "-"),
          metadata: meta,
          status: String(row[8] || "Aktif")
        });
      }
    }

    return {
      success: true,
      templates: templates,
      folderId: FOLDER_SPJ_ID
    };
  } catch (err) {
    Logger.log("Error getSpjTemplateList: " + err.toString());
    return { success: false, message: "Gagal memuat daftar template: " + err.message };
  }
}

/**
 * Upload template baru (.xlsx atau .docx) ke Google Drive & rekam di sheet
 */
function uploadSpjTemplate(fileData, pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }

  if (!fileData || !fileData.base64Data || !fileData.namaDokumen) {
    return { success: false, message: "Data file atau nama dokumen tidak lengkap." };
  }

  const fileName = String(fileData.fileName || "template").trim();
  const ext = fileName.split('.').pop().toLowerCase();
  
  // Validasi format: Wajib hanya .xlsx atau .docx
  if (ext !== "xlsx" && ext !== "docx") {
    return {
      success: false,
      message: "Format file tidak didukung! Sistem HANYA menerima file berekstensi .xlsx (Excel) atau .docx (Word)."
    };
  }

  try {
    ensureDatabaseReady_();
    const folderId = FOLDER_SPJ_ID;
    let folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      folder = DriveApp.createFolder("Templates_SPJ_Bidang_SMP");
    }

    const decodedBytes = Utilities.base64Decode(fileData.base64Data);
    const mimeType = ext === "xlsx" 
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    
    const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
    const driveFile = folder.createFile(blob);
    const fileId = driveFile.getId();
    const fileSizeKb = Math.round(decodedBytes.length / 1024) + " KB";

    // Analisis Cerdas Jemprot AI: deteksi apakah nama/jenis dokumen butuh nominal uang
    const analysis = analyzeSpjWithGemini_(fileData.namaDokumen, ext, fileName);

    const ss = getSpreadsheet_();
    let sheet = ss.getSheetByName(SHEET_TEMPLATE_SPJ);
    if (!sheet) {
      ensureDatabaseReady_();
      sheet = ss.getSheetByName(SHEET_TEMPLATE_SPJ);
    }

    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm");
    const tplId = "TPL-" + Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);

    const newRow = [
      tplId,
      fileData.namaDokumen,
      ext.toUpperCase(),
      fileId,
      fileName,
      fileSizeKb,
      dateStr,
      JSON.stringify(analysis),
      "Aktif"
    ];

    sheet.appendRow(newRow);

    return {
      success: true,
      message: `Template "${fileData.namaDokumen}" berhasil diunggah dan disimpan ke Google Drive!`,
      template: {
        id: tplId,
        namaDokumen: fileData.namaDokumen,
        tipeFile: ext.toUpperCase(),
        fileId: fileId,
        namaFileAsli: fileName,
        ukuranFile: fileSizeKb,
        tanggalUpload: dateStr,
        metadata: analysis
      }
    };
  } catch (err) {
    Logger.log("Error uploadSpjTemplate: " + err.toString());
    return { success: false, message: "Gagal mengunggah template: " + err.message };
  }
}

/**
 * Hapus template dari Google Drive dan database
 */
function deleteSpjTemplate(templateId, pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }
  if (!templateId) {
    return { success: false, message: "ID Template tidak valid." };
  }

  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_TEMPLATE_SPJ);
    if (!sheet) return { success: false, message: "Sheet Master_Template_SPJ tidak ditemukan." };

    const data = sheet.getDataRange().getValues();
    const targetId = String(templateId).trim();
    let targetRow = -1;
    let fileIdDrive = "";
    let docName = "";

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === targetId) {
        targetRow = i + 1;
        docName = String(data[i][1] || "Dokumen");
        fileIdDrive = String(data[i][3] || "");
        break;
      }
    }

    if (targetRow > 0) {
      if (fileIdDrive && fileIdDrive !== "DEFAULT") {
        try {
          DriveApp.getFileById(fileIdDrive).setTrashed(true);
        } catch (e) {
          Logger.log("Gagal memindahkan file Drive ke sampah: " + e.toString());
        }
      }

      sheet.deleteRow(targetRow);
      return {
        success: true,
        message: `Template "${docName}" berhasil dihapus dari koleksi.`
      };
    } else {
      return { success: false, message: "Template tidak ditemukan di database." };
    }
  } catch (err) {
    Logger.log("Error deleteSpjTemplate: " + err.toString());
    return { success: false, message: "Gagal menghapus template: " + err.message };
  }
}

/**
 * Menyiapkan payload data peserta + hitungan SPJ untuk kegiatan aktif
 */
function getSpjGeneratorData(params, pin) {
  if (!verifyAdminPin(pin)) {
    return { success: false, message: "Akses ditolak: PIN Panitia tidak valid." };
  }

  try {
    ensureDatabaseReady_();
    const settings = getAppSettings();
    const ss = getSpreadsheet_();
    const sheetPeserta = ss.getSheetByName(SHEET_PESERTA);
    const data = sheetPeserta ? sheetPeserta.getDataRange().getValues() : [];

    const activeKegiatan = String(settings.NAMA_KEGIATAN || "").trim().toLowerCase();
    const participants = [];

    if (data.length > 1) {
      const headerRow = data[0].map(h => String(h).trim().toLowerCase());
      const idxKegiatan = headerRow.findIndex(h => h.includes("kegiatan"));
      const idxSekolah = headerRow.findIndex(h => h.includes("satuan") || h.includes("sekolah"));
      const idxKecamatan = headerRow.findIndex(h => h.includes("kecamatan"));
      const idxNama = headerRow.findIndex(h => h.includes("nama lengkap") || h.includes("peserta"));
      const idxStatusPeg = headerRow.findIndex(h => h.includes("status kepegawaian") || h.includes("pegawai"));
      const idxGolongan = headerRow.findIndex(h => h.includes("golongan"));
      const idxJabatan = headerRow.findIndex(h => h.includes("jabatan"));
      const idxNip = headerRow.findIndex(h => h.includes("nip"));

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowKegiatan = idxKegiatan !== -1 ? String(row[idxKegiatan] || "").trim().toLowerCase() : "";
        if (activeKegiatan && rowKegiatan && rowKegiatan !== activeKegiatan) {
          continue;
        }

        participants.push({
          no: participants.length + 1,
          regId: String(row[1] || ""),
          nama: String(row[idxNama !== -1 ? idxNama : 7] || "-").trim(),
          sekolah: String(row[idxSekolah !== -1 ? idxSekolah : 3] || "-").trim(),
          kecamatan: String(row[idxKecamatan !== -1 ? idxKecamatan : 6] || "-").trim(),
          statusPeg: String(row[idxStatusPeg !== -1 ? idxStatusPeg : 8] || "-").trim(),
          nip: String(row[idxNip !== -1 ? idxNip : 9] || "-").replace(/^'/, "").trim(),
          golongan: String(row[idxGolongan !== -1 ? idxGolongan : 10] || "-").trim(),
          jabatan: String(row[idxJabatan !== -1 ? idxJabatan : 12] || "Guru").trim()
        });
      }
    }

    if (participants.length === 0) {
      return {
        success: false,
        message: `Belum ada peserta yang terdaftar pada kegiatan "${settings.NAMA_KEGIATAN}". Silakan pastikan pendaftar sudah ada.`
      };
    }

    const p = params || {};
    const nominalPerHari = parseFloat(p.nominalPerHari) || 200000;
    const jumlahHari = parseInt(p.jumlahHari, 10) || 1;
    const satuanWaktu = p.satuanWaktu || "hari";
    const isPajakActive = p.isPajakActive !== false; // Default: true (aktif)

    let totalBruto = 0;
    let totalPph21 = 0;
    let totalNetto = 0;

    const calculatedParticipants = participants.map((pt, idx) => {
      const bruto = nominalPerHari * jumlahHari;
      const statusLower = pt.statusPeg.toLowerCase();
      const golUpper = pt.golongan.toUpperCase();

      let tarifPajak = 0;
      let tarifPersenStr = "0%";

      if (isPajakActive) {
        if (p.overridePajak && typeof p.overridePajak[pt.regId] === "number") {
          tarifPajak = p.overridePajak[pt.regId];
          tarifPersenStr = Math.round(tarifPajak * 100) + "%";
        } else if (statusLower.includes("pns")) {
          if (golUpper.startsWith("IV") || golUpper.includes("GOLONGAN IV")) {
            tarifPajak = 0.15;
            tarifPersenStr = "15%";
          } else if (golUpper.startsWith("III") || golUpper.includes("GOLONGAN III")) {
            tarifPajak = 0.05;
            tarifPersenStr = "5%";
          } else {
            tarifPajak = 0;
            tarifPersenStr = "0%";
          }
        } else {
          // PPPK dan Non-ASN sesuai kesepakatan: 0%
          tarifPajak = 0;
          tarifPersenStr = "0%";
        }
      }

      const pph21 = Math.round(bruto * tarifPajak);
      const netto = bruto - pph21;

      totalBruto += bruto;
      totalPph21 += pph21;
      totalNetto += netto;

      return {
        no: idx + 1,
        regId: pt.regId,
        nama: pt.nama,
        golongan: pt.golongan !== "-" ? pt.golongan : "-",
        jabatan: pt.jabatan,
        unitKerja: pt.sekolah,
        kecamatan: pt.kecamatan,
        statusPeg: pt.statusPeg,
        nip: pt.nip,
        jumlahHari: jumlahHari,
        satuanWaktu: satuanWaktu,
        tarifSatuan: nominalPerHari,
        bruto: bruto,
        tarifPajakStr: tarifPersenStr,
        tarifPajakVal: tarifPajak,
        pph21: pph21,
        netto: netto
      };
    });

    const now = new Date();
    const defaultTanggal = "Karanganyar, " + Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "d MMMM yyyy");

    return {
      success: true,
      eventName: settings.NAMA_KEGIATAN,
      subEventName: settings.SUB_KEGIATAN || "Bidang SMP - Dinas Pendidikan dan Kebudayaan Kabupaten Karanganyar",
      tanggalSpj: p.tanggalSpj || defaultTanggal,
      params: {
        nominalPerHari: nominalPerHari,
        jumlahHari: jumlahHari,
        satuanWaktu: satuanWaktu
      },
      pejabat: {
        kpa: {
          nama: p.kpaNama || "Rehatta Rakasiwi, S.Psi.,M.Si",
          nip: p.kpaNip || "198401162011011009",
          jabatan: p.kpaJabatan || "Kepala Bidang SMP selaku Kuasa Pengguna Anggaran"
        },
        pptk: {
          nama: p.pptkNama || "Agus Pruwitanto, S.Sos",
          nip: p.pptkNip || "197408191999031005",
          jabatan: p.pptkJabatan || "Pejabat Pelaksana Teknis Kegiatan"
        },
        bendahara: {
          nama: p.bendaharaNama || "Dwi Suprasetiarini, S.M",
          nip: p.bendaharaNip || "197610022010012002",
          jabatan: p.bendaharaJabatan || "Bendahara Pengeluaran Pembantu"
        }
      },
      totals: {
        totalBruto: totalBruto,
        totalPph21: totalPph21,
        totalNetto: totalNetto
      },
      participants: calculatedParticipants
    };
  } catch (err) {
    Logger.log("Error getSpjGeneratorData: " + err.toString());
    return { success: false, message: "Gagal memproses data SPJ: " + err.message };
  }
}

/**
 * Analisis Cerdas Jemprot AI: mendeteksi jenis dan kebutuhan variabel template
 * Menggunakan Gemini API (Script Properties) dengan fallback otomatis ke sistem pencocokan aturan
 */
function analyzeSpjWithGemini_(templateName, fileType, fileName) {
  const cleanName = String(templateName || "").toLowerCase();
  const isFinance = cleanName.includes("uang") || 
                    cleanName.includes("saku") || 
                    cleanName.includes("transport") || 
                    cleanName.includes("honor") || 
                    cleanName.includes("jasa") || 
                    cleanName.includes("penerimaan") ||
                    cleanName.includes("harian");

  const isAttendance = cleanName.includes("hadir") || cleanName.includes("presensi") || cleanName.includes("absen");
  const isSppd = cleanName.includes("sppd") || cleanName.includes("perjalanan") || cleanName.includes("tugas");

  // Percobaan analisis via Gemini API langsung jika API Key tersedia
  try {
    const apiKey = getGeminiApiKey_();
    if (apiKey) {
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
      const prompt = `Anda adalah asisten administrasi dinas pendidikan Kabupaten Karanganyar. Analisis nama dan struktur dokumen berikut:
- Nama Dokumen: "${templateName}"
- Tipe File: "${fileType}"
- Nama File: "${fileName}"

Tentukan apakah dokumen ini membutuhkan perhitungan nominal uang (Uang Saku/Transport/Honorarium dengan PPh 21) atau dokumen kehadiran/administrasi umum.
Keluarkan HANYA JSON tanpa markdown:
{
  "jenis": "Uang Saku / Transport" atau "Daftar Hadir / Presensi" atau "Dokumen Kegiatan",
  "hasNominal": true/false,
  "hasHari": true/false,
  "defaultNominal": 200000 atau 0,
  "defaultHari": 1,
  "detectedColumns": ["No", "Nama Lengkap & Gelar", "NIP", "Golongan", ...],
  "signatureCount": 3 atau 2
}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      };
      const response = UrlFetchApp.fetch(endpoint, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      if (response.getResponseCode() === 200) {
        const json = JSON.parse(response.getContentText());
        let rawText = json.candidates[0].content.parts[0].text.trim();
        rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(rawText);
        if (parsed && parsed.jenis) {
          return parsed;
        }
      }
    }
  } catch (errAi) {
    Logger.log("Fallback analisis lokal: " + errAi.toString());
  }

  // Fallback Rule Engine
  return {
    jenis: isFinance ? "Keuangan (Uang Saku/Transport/Honor)" : (isAttendance ? "Daftar Hadir / Presensi" : (isSppd ? "Surat Tugas / SPPD" : "Dokumen Kegiatan")),
    hasNominal: isFinance,
    hasHari: isFinance || isAttendance,
    defaultNominal: isFinance ? 200000 : 0,
    defaultHari: 1,
    detectedColumns: isFinance 
      ? ["No", "Nama", "Golongan", "Jabatan", "Unit Kerja", "Jumlah Hari", "Uang Saku", "Total Kotor", "PPh 21", "Penerimaan Bersih", "Tanda Tangan"]
      : ["No", "Nama Lengkap & Gelar", "NIP", "Golongan", "Jabatan", "Asal Satuan Pendidikan", "No. WhatsApp", "Tanda Tangan"],
    signatureCount: isFinance ? 3 : 2
  };
}
