# Sistem Pre-Order dan Jastip

Aplikasi manajemen pre-order dan jastip: batch PO dengan tenggat waktu, pembayaran DP dan pelunasan terpisah, status pengiriman per batch, serta rekap pesanan per supplier untuk memudahkan belanja.

Lihat `PRD.md` untuk latar belakang, ruang lingkup, dan aturan bisnis lengkap. Lihat `DESIGN.md` untuk arah desain dan alasan setiap keputusan visual.

## Menjalankan Proyek

Kebutuhan: Node.js versi 18 ke atas.

```bash
npm install
npm start
```

Aplikasi akan berjalan di `http://localhost:3000` (bisa diubah lewat variabel lingkungan `PORT`). Basis data SQLite dibuat otomatis di `data/app.db` saat pertama kali dijalankan, tidak ada langkah setup basis data manual.

Tidak ada proses build. Perubahan pada berkas `.ejs` atau `public/css/style.css` langsung terlihat setelah me-restart server (`npm start`).

## Struktur Proyek

```
server.js            Titik masuk aplikasi, konfigurasi Express
db/index.js           Koneksi SQLite dan skema tabel (CREATE TABLE IF NOT EXISTS)
lib/                   Fungsi bantu: format angka/tanggal, konstanta status, logika pesanan & pembayaran, flash message
routes/                Route handler per area: dashboard, supplier, batch, pesanan admin, pesanan publik
views/                 Tampilan EJS, dikelompokkan per area, memakai partials/header.ejs dan partials/footer.ejs bersama
public/css/style.css   Gaya visual, ditulis tangan tanpa framework CSS
data/                  Lokasi berkas basis data (app.db tidak disertakan di git)
```

## Alur Pemakaian Singkat

1. Buka `/supplier`, tambahkan supplier tempat barang akan dibeli.
2. Buka `/batch`, buat batch baru dengan nama, supplier, dan tenggat waktu pemesanan, lalu tambahkan produk yang ditawarkan pada batch tersebut di halaman detail batch.
3. Bagikan tautan `/pesan/<id-batch>` yang tersedia di halaman detail batch kepada calon pembeli. Pelanggan memesan tanpa perlu login.
4. Setelah pelanggan memesan, mereka mendapat tautan `/pesanan/<id-pesanan>` untuk memantau status pesanan dan sisa tagihan kapan saja.
5. Admin mencatat pembayaran (DP lalu pelunasan) lewat tombol "Catat Pembayaran" pada halaman detail batch atau halaman "Semua Pesanan" (`/pesanan`). Status pesanan (menunggu pembayaran / DP dibayar / lunas) dihitung ulang otomatis setiap kali ada pembayaran baru.
6. Setelah tenggat waktu lewat, admin memeriksa rekap belanja di `/batch/<id-batch>/rekap` untuk mengetahui total kuantitas tiap produk yang perlu dibeli dari supplier.
7. Admin menaikkan status batch secara berurutan (Buka -> Ditutup -> Dipesan ke Supplier -> Dikirim -> Tiba -> Selesai) lewat tombol di halaman detail batch. Status ini langsung terlihat oleh pelanggan di halaman status pesanan mereka.

## Catatan Ruang Lingkup

Aplikasi ini tidak memiliki sistem login. Sisi admin (dashboard, supplier, batch, pesanan) diasumsikan hanya diakses oleh pemilik usaha sendiri di perangkat atau jaringan tepercaya. Sisi pemesanan publik memang sengaja terbuka tanpa login, karena itu adalah cara kerja pemesanan jastip yang sebenarnya. Detail lengkap ada di bagian "Di Luar Ruang Lingkup" pada `PRD.md`.
