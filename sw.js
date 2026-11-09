/**
 * Service Worker: Form Kegiatan Kedinasan - Bidang SMP DISDIKBUD Karanganyar
 * PWA Offline Cache & Background Engine
 */

const CACHE_NAME = 'formgiatsmp-v1.0.0';

// Daftar aset inti yang di-cache saat instalasi
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './marshal.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png'
];

// 1. Event Install: Pre-cache aset statis
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Event Activate: Bersihkan cache versi lama & klaim klien
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Event Fetch: Strategi Caching Pintar
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // A. Transaksi & API Google Apps Script: Wajib Network-Only (TIDAK BOLEH DI-CACHE)
  if (
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('script.googleusercontent.com') ||
    url.searchParams.has('action') ||
    req.method !== 'GET'
  ) {
    event.respondWith(fetch(req));
    return;
  }

  // B. Navigasi Halaman Utama (HTML): Network-First, Fallback ke Cache jika offline
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match(req).then((cachedRes) => {
            if (cachedRes) return cachedRes;
            // Jika rute spesifik tidak ditemukan, berikan index.html
            return caches.match('./index.html');
          });
        })
    );
    return;
  }

  // C. Pustaka Eksternal CDN (Bootstrap, Fonts, SweetAlert, XLSX, jsPDF, html2canvas):
  // Cache-First dengan Network Fallback agar cepat & hemat kuota
  if (
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        if (cachedRes) return cachedRes;
        return fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // D. Aset Statis Lokal Lainnya: Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => cachedRes);

      return cachedRes || fetchPromise;
    })
  );
});
