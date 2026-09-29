# PRD: Sistem Pre-Order dan Jastip

## Latar Belakang dan Tujuan

Usaha jastip (jasa titip) dan pre-order barang biasanya dikelola manual lewat chat WhatsApp, catatan Excel, dan transfer bukti bayar yang berserakan. Pemilik usaha kesulitan melacak siapa sudah DP, siapa sudah lunas, berapa total yang harus dibelanjakan ke supplier, dan sudah sampai tahap apa pengiriman sebuah batch pesanan. Kesalahan hitung dan lupa catat pembayaran adalah risiko nyata yang berdampak langsung ke uang.

Aplikasi ini dibangun untuk menggantikan pencatatan manual tersebut dengan sistem yang terstruktur: setiap pembukaan pemesanan dikelola sebagai satu "batch" dengan tenggat waktu yang jelas, pembayaran dicatat bertahap (DP dan pelunasan) dengan status yang dihitung otomatis, dan status pengiriman batch dapat dipantau pelanggan tanpa perlu bertanya berulang kali ke pemilik usaha. Tujuan utamanya adalah mengurangi kesalahan pencatatan pembayaran dan mempercepat proses rekap belanja ke supplier.

## Target Pengguna

- **Pemilik usaha jastip/pre-order (admin)**: mengelola supplier, membuka batch PO, mencatat produk yang ditawarkan, memantau pesanan masuk, mencatat pembayaran, mengubah status pengiriman, dan mengambil rekap belanja per supplier.
- **Pelanggan (publik)**: melihat daftar produk dalam sebuah batch yang sedang buka, melakukan pemesanan tanpa perlu login, dan memantau status pesanan serta sisa tagihannya sendiri melalui tautan unik.

## Ruang Lingkup Fitur

1. Manajemen data supplier (tambah, lihat, kelola kontak).
2. Manajemen batch PO: pembuatan batch dengan tenggat waktu, penambahan produk ke dalam batch, dan siklus status pengiriman batch.
3. Halaman pemesanan publik: pelanggan memilih produk dan kuantitas (bisa beberapa item sekaligus) dari sebuah batch yang masih buka, mengisi data diri, lalu mendapatkan rincian tagihan.
4. Halaman status pesanan publik: pelanggan dapat memeriksa rincian pesanan, total tagihan, jumlah yang sudah dibayar, sisa tagihan, dan status pengiriman batch terkait.
5. Pencatatan pembayaran oleh admin (DP dan pelunasan) dengan status pesanan yang dihitung ulang otomatis setiap kali ada pembayaran baru.
6. Daftar seluruh pesanan lintas batch dengan filter berdasarkan status pembayaran.
7. Rekap pesanan per supplier: agregat kuantitas per produk dari seluruh pesanan yang sah (tidak dibatalkan) dalam sebuah batch, sebagai daftar belanja nyata untuk admin.
8. Dashboard ringkas berisi daftar batch aktif dan statusnya.

## Di Luar Ruang Lingkup

- **Autentikasi/login**: sisi admin tidak memiliki sistem login pada versi ini. Ini adalah alat internal yang diasumsikan hanya diakses oleh pemilik usaha sendiri (misalnya dijalankan di perangkat pribadi atau jaringan tepercaya). Ini adalah keputusan sadar untuk mempercepat rilis awal, bukan kelalaian. Penambahan autentikasi direkomendasikan sebagai pekerjaan lanjutan sebelum aplikasi diekspos ke internet publik secara luas.
- Halaman pemesanan publik memang sengaja tidak memerlukan login, konsisten dengan praktik nyata bisnis jastip di mana pelanggan memesan lewat tautan yang dibagikan tanpa perlu membuat akun.
- Integrasi pembayaran otomatis (payment gateway) tidak termasuk; pencatatan pembayaran dilakukan manual oleh admin berdasarkan bukti transfer yang diterima di luar sistem.
- Notifikasi otomatis (WhatsApp/email/SMS) ke pelanggan tidak termasuk pada versi ini.
- Multi-pengguna/multi-role admin (misalnya staf dengan hak akses terbatas) tidak termasuk.
- Manajemen stok/inventaris di luar konteks batch PO tidak termasuk.

## Model Data dan Entitas

- **supplier**(id, nama, kontak): pemasok tempat barang dibeli.
- **batch**(id, nama, supplier_id, tenggat_waktu, status, eta_pengiriman, catatan, dibuat_pada): satu putaran pembukaan pemesanan untuk satu supplier. Status: `buka`, `ditutup`, `dipesan_ke_supplier`, `dikirim`, `tiba`, `selesai`, `dibatalkan`.
- **produk**(id, batch_id, nama, harga, satuan): barang yang ditawarkan dalam suatu batch tertentu (harga dan satuan spesifik per batch, karena harga jastip bisa berubah tiap batch).
- **pelanggan**(id, nama, no_hp, alamat): data pemesan, diidentifikasi unik lewat nomor HP agar pelanggan lama tidak perlu didaftar ulang.
- **pesanan**(id, batch_id, pelanggan_id, status, dibuat_pada): satu transaksi pemesanan oleh satu pelanggan dalam satu batch. Status: `pending`, `dp_dibayar`, `lunas`, `dibatalkan`.
- **pesanan_item**(id, pesanan_id, produk_id, kuantitas, harga_satuan, subtotal): rincian barang yang dipesan dalam satu pesanan. `harga_satuan` disalin dari harga produk saat pesanan dibuat agar histori tidak berubah jika harga produk diedit kemudian.
- **pembayaran**(id, pesanan_id, tipe, jumlah, metode, catatan, dicatat_pada): setiap setoran uang untuk sebuah pesanan. Tipe: `dp` atau `pelunasan`.

## Alur Pengguna Utama

### Alur admin
1. Admin menambahkan data supplier.
2. Admin membuat batch baru: nama batch, pilih supplier, atur tenggat waktu, isi catatan, lalu tambahkan daftar produk beserta harga dan satuannya.
3. Admin membagikan tautan halaman pemesanan publik batch tersebut ke calon pembeli.
4. Selama batch berstatus `buka` dan sebelum tenggat waktu, pesanan masuk otomatis muncul di halaman detail batch.
5. Setelah tenggat waktu lewat atau admin menutup batch secara manual, admin memeriksa rekap per supplier untuk mengetahui total kuantitas tiap produk yang harus dibelanjakan.
6. Admin mencatat pembayaran (DP lalu pelunasan) yang diterima dari tiap pelanggan; status pesanan berubah otomatis.
7. Admin memesan barang ke supplier sesuai rekap, lalu menaikkan status batch secara berurutan: `ditutup` -> `dipesan_ke_supplier` -> `dikirim` -> `tiba` -> `selesai`. Batch dapat dibatalkan (`dibatalkan`) dari status apa pun jika perlu.

### Alur pelanggan
1. Pelanggan membuka tautan pemesanan batch yang dibagikan admin.
2. Jika batch masih `buka` dan belum lewat tenggat waktu, pelanggan memilih satu atau lebih produk beserta kuantitasnya, lalu mengisi nama, nomor HP, dan alamat.
3. Sistem menghitung total tagihan dan menampilkan instruksi pembayaran DP, beserta tautan untuk memantau status pesanan.
4. Pelanggan dapat membuka tautan status pesanan kapan saja untuk melihat rincian item, total, jumlah yang sudah dibayar, sisa tagihan, dan status pengiriman batch terkini.

## Aturan Bisnis Penting

### Aturan tenggat waktu batch
Sebuah batch hanya menerima pesanan baru jika **kedua syarat** berikut terpenuhi secara bersamaan:
1. `batch.status = 'buka'`, dan
2. waktu saat ini masih sebelum `batch.tenggat_waktu`.

Validasi ini dilakukan di server pada saat submit form pemesanan (bukan hanya menyembunyikan form di tampilan), sehingga permintaan yang dikirim langsung ke endpoint setelah tenggat lewat atau setelah batch ditutup tetap ditolak dengan pesan yang jelas kepada pelanggan.

### Perhitungan status pembayaran (DP dan pelunasan)
- Total tagihan pesanan = jumlah seluruh `pesanan_item.subtotal` pada pesanan tersebut.
- Setiap kali admin mencatat pembayaran baru, sistem menjumlahkan seluruh `pembayaran.jumlah` untuk pesanan tersebut (disebut `total_dibayar`), lalu memperbarui status pesanan berdasarkan aturan berikut:
  - jika `total_dibayar = 0`: status tetap `pending`.
  - jika `0 < total_dibayar < total_tagihan`: status menjadi `dp_dibayar`.
  - jika `total_dibayar >= total_tagihan`: status menjadi `lunas`.
- Penyisipan baris pembayaran dan pembaruan status pesanan dilakukan **dalam satu transaksi database atomik**, sehingga tidak mungkin terjadi kondisi di mana pembayaran tercatat tetapi status pesanan tidak sinkron (atau sebaliknya), bahkan jika terjadi kegagalan di tengah proses.
- Sisa tagihan yang ditampilkan ke pelanggan selalu dihitung sebagai `total_tagihan - total_dibayar`.

### Siklus status pengiriman batch
Status batch berjalan secara berurutan dan eksplisit, dikendalikan oleh admin (bukan otomatis oleh waktu):

```
buka -> ditutup -> dipesan_ke_supplier -> dikirim -> tiba -> selesai
```

Dari status apa pun (kecuali `selesai`), batch dapat dipindahkan ke `dibatalkan` jika transaksi dibatalkan seluruhnya. Status pengiriman yang ditampilkan ke pelanggan pada halaman status pesanan adalah status batch tersebut secara langsung (tidak ada status pengiriman terpisah per pesanan individual), karena pengiriman barang jastip dilakukan sekaligus per batch dari supplier, bukan per pesanan.

### Rekap pesanan per supplier
Untuk sebuah batch tertentu, sistem menghitung `SUM(pesanan_item.kuantitas)` dikelompokkan per `produk`, dengan hanya mengikutsertakan `pesanan` yang berstatus selain `dibatalkan`. Hasilnya adalah daftar belanja nyata: nama produk dan total kuantitas yang harus dibeli admin dari supplier untuk memenuhi seluruh pesanan sah pada batch tersebut. Ini adalah agregasi langsung dari data pesanan yang tersimpan, bukan estimasi atau angka yang dikarang.

## Kebutuhan Non-Fungsional

- **Kesederhanaan operasional**: aplikasi harus dapat dijalankan dengan `npm install && npm start` tanpa langkah build tambahan, karena pengguna akhir adalah pemilik usaha kecil yang tidak punya tim IT.
- **Keandalan data**: seluruh data disimpan di berkas SQLite lokal (`data/app.db`). Operasi yang mengubah beberapa tabel sekaligus (pembayaran dan status pesanan) wajib atomik lewat transaksi database.
- **Aksesibilitas**: kontras warna teks memenuhi WCAG AA, seluruh elemen interaktif dapat dioperasikan lewat keyboard, dan tidak ada kontrol yang terlihat interaktif tetapi tidak berfungsi.
- **Responsif**: halaman publik pemesanan dan status pesanan harus nyaman digunakan di layar ponsel tanpa scroll horizontal, karena mayoritas pelanggan mengakses lewat tautan yang dibagikan di WhatsApp dari ponsel.
- **Bahasa**: seluruh antarmuka menggunakan Bahasa Indonesia karena target pengguna adalah pelaku usaha dan pelanggan domestik.
- **Kinerja**: karena skala data usaha kecil-menengah, tidak diperlukan optimasi khusus; SQLite dengan indeks bawaan sudah mencukupi.

## Tumpukan Teknologi dan Alasan

- **Node.js + Express**: kerangka kerja server minimal, cukup untuk aplikasi rendering sisi server tanpa kompleksitas API terpisah, dan mudah dijalankan di lingkungan hosting murah yang lazim dipakai usaha kecil.
- **better-sqlite3**: basis data berkas tunggal, tanpa perlu menjalankan server database terpisah. API sinkronnya memudahkan penulisan transaksi (`db.transaction`) yang benar-benar atomik untuk kasus pembayaran, tanpa kerumitan callback atau race condition antar-request.
- **EJS**: templating sisi server yang sederhana, cocok untuk aplikasi yang didominasi form dan tabel, tanpa perlu proses build seperti pada kerangka kerja frontend modern.
- **CSS murni tulisan tangan**: tanpa kerangka kerja CSS atau CDN eksternal (termasuk Google Fonts), agar aplikasi tetap berjalan penuh meski koneksi internet pengguna sedang tidak stabil saat memuat halaman, dan tampilan sepenuhnya sesuai kebutuhan bisnis ini, bukan komponen generik.
- **Tanpa langkah build**: seluruh aset dapat langsung disajikan Express, sehingga proses deploy hanya `git pull`, `npm install`, `npm start`.

## Rencana Rilis

1. **Rilis 0 - Fondasi proyek**: struktur proyek, skema database, layout dasar, dan gaya visual (commit "chore: scaffold proyek").
2. **Rilis 1 - Manajemen supplier dan batch**: admin dapat mengelola supplier dan membuat batch PO lengkap dengan produk dan tenggat waktu (commit "feat: manajemen supplier dan batch PO dengan tenggat waktu").
3. **Rilis 2 - Pemesanan publik dan manajemen pesanan**: pelanggan dapat memesan lewat halaman publik, admin dapat melihat seluruh pesanan (commit "feat: halaman pemesanan publik dan manajemen pesanan").
4. **Rilis 3 - Pembayaran bertahap**: pencatatan DP dan pelunasan dengan status otomatis dan atomik (commit "feat: pencatatan pembayaran DP dan pelunasan dengan status otomatis").
5. **Rilis 4 - Status pengiriman dan rekap**: siklus status pengiriman batch dan rekap belanja per supplier (commit "feat: status pengiriman per batch dan rekap pesanan per supplier").
6. **Rilis 5 - Dokumentasi**: petunjuk instalasi dan penggunaan di README (commit "docs: README cara menjalankan proyek").
