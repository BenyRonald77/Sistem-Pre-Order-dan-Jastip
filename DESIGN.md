# Arah Desain: Sistem Pre-Order dan Jastip

Catatan jujur: arah desain di dokumen ini disusun sendiri oleh pengembang (builder) untuk kebutuhan alat operasional jastip/pre-order, bukan didikte langsung oleh pemilik usaha. Ini dipilih secara sadar sebagai jalur "agen menyusun arah sendiri, dengan peringatan jujur" karena tidak ada pemilik usaha nyata yang bisa ditanyai pada tahap ini. Jika pemilik usaha sebenarnya kelak punya preferensi berbeda, dokumen ini adalah titik awal yang bisa diubah, bukan keputusan final yang mengikat.

## Karakter Produk

Ini adalah alat kerja (operational tool), bukan halaman pemasaran. Penggunanya menangani uang orang lain (DP dan pelunasan pelanggan) dan barang titipan, jadi kesan yang harus muncul adalah **dapat dipercaya, rapi, dan tenang**, bukan flashy atau menghibur. Pelanggan publik juga menyentuh sebagian halaman ini (form pesan dan cek status), jadi tampilannya harus tetap ramah dan mudah dibaca oleh orang awam lewat ponsel, bukan terasa seperti dasbor teknis.

## Palet Warna

- **Krem hangat `#FBF7F0`** (latar utama): putih gading, bukan putih steril, memberi kesan hangat seperti nota toko fisik, bukan aplikasi generik. *Alasan: menghindari putih default AI yang terasa dingin dan tanpa karakter.*
- **Cokelat tinta `#2B241C`** (teks utama dan elemen gelap): cokelat sangat gelap alih-alih hitam pekat, selaras dengan nuansa hangat krem di atas. *Alasan: hitam murni terasa keras berdampingan dengan krem hangat; cokelat tinta tetap kontras tinggi tapi lebih menyatu.*
- **Cokelat pasir `#8A7A64`** (teks sekunder, garis pembatas, latar netral kedua): nuansa netral ketiga untuk hierarki tanpa menambah warna baru. *Alasan: memberi jenjang visual (utama/sekunder) tanpa melanggar batas 2-3 warna inti.*
- **Teal tua `#0F6D5C`** (aksen tunggal: tombol utama, status lunas, tautan penting): teal/hijau tua dipilih karena asosiasinya dengan uang dan kepercayaan dalam konteks transaksi, sekaligus secara sengaja menghindari gradasi biru-ungu yang jadi ciri khas tampilan AI generik. *Alasan: satu aksen yang konsisten dipakai hanya di titik keputusan (tombol simpan, status lunas, total tagihan), bukan disebar ke semua elemen.*

Warna status tambahan (bukan bagian dari palet inti, dipakai terbatas untuk label status transaksional yang memang butuh dibedakan): kuning tanah `#B5842A` untuk `pending`/`dp_dibayar`, merah bata `#B03A2E` untuk `dibatalkan`. Keduanya adalah warna fungsional status, bukan warna dekoratif, dan dipakai hanya pada label kecil (badge status), bukan pada latar besar atau tombol umum.

Total warna inti: krem, cokelat tinta, cokelat pasir (3 netral/inti) + 1 aksen teal. Warna status adalah pengecualian fungsional yang dicatat di sini, bukan bagian dari hitungan aksen dekoratif.

## Tipografi

Font: tumpukan sistem (`system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`), bukan font dari Google Fonts CDN. *Alasan ganda: (1) keandalan, alat ini sering diakses pelanggan lewat data seluler yang tidak stabil, dan font sistem tampil instan tanpa bergantung pada permintaan jaringan tambahan ke server font eksternal; (2) font sistem tiap perangkat sudah dioptimalkan untuk keterbacaan di layar tersebut, cocok untuk alat kerja yang mengutamakan fungsi.* Tidak dipakai font monospasi besar bergaya "teknis" karena produk ini bukan alat developer.

Ukuran teks dijaga cukup besar (basis 16px ke atas untuk body) agar nyaman dibaca pemilik usaha dan pelanggan dari berbagai usia lewat ponsel, tanpa perlu memperbesar tampilan.

## Tiga Dial (ENERGY / RHYTHM / MOTION)

**ENERGY 2, RHYTHM 2, MOTION 1.**

- *ENERGY 2 (seimbang, seperti Stripe/Vercel, bukan agency portfolio)*: alasan, ini alat operasional yang dipakai berulang kali setiap hari oleh pemilik usaha, jadi tampilan harus jelas dan efisien, tapi tetap punya identitas warna dan bentuk yang membuatnya terasa dibuat khusus, bukan sekadar tabel HTML polos.
- *RHYTHM 2 (konsisten dengan beberapa variasi)*: alasan, halaman admin (tabel, form) sengaja dibuat konsisten agar mudah dipelajari, tapi halaman publik (pemesanan dan status pesanan) punya komposisi kartu ringkasan tagihan yang berbeda dari halaman tabel admin, karena fungsinya memang berbeda (ringkasan angka besar vs daftar data).
- *MOTION 1 (transisi hover/fokus saja, tanpa animasi hias)*: alasan, ini alat kerja transaksional, animasi berlebih hanya memperlambat pemilik usaha yang sedang mencatat pembayaran berkali-kali sehari. Transisi dibatasi pada perubahan warna singkat saat hover/fokus tombol dan tautan, tidak ada animasi loop atau scroll-reveal.

## Bentuk dan Komponen

- **Radius sudut**: satu nilai kecil konsisten (6px) untuk kartu dan input, satu nilai sedikit lebih besar (8px) khusus tombol utama agar tombol aksi terasa sedikit lebih menonjol. *Alasan: variasi radius yang disengaja sebagai penanda hierarki (tombol vs kartu), bukan semua dibuat pil seragam.*
- **Bayangan (shadow)**: dipakai tipis, hanya pada kartu ringkasan tagihan di halaman publik dan pada elemen modal/dialog konfirmasi, sebagai penanda elevasi bahwa elemen itu "mengambang" di atas alur normal. *Alasan: kartu ringkasan tagihan adalah fokus visual utama halaman pemesanan, layak diberi sedikit elevasi; elemen tabel biasa tetap datar.*
- **Badge status**: bentuk kapsul kecil dipakai khusus untuk label status pesanan/batch (pending, dp_dibayar, lunas, dan seterusnya) karena itu memang status nyata yang perlu dibedakan sekilas mata, bukan dekorasi. *Alasan: ini pemakaian badge yang fungsional (real status), sesuai aturan bahwa badge harus mewakili keadaan nyata.*
- **Tanpa gradien, tanpa glassmorphism, tanpa ikon generik**: karena tidak menambah kejelasan bagi alat kerja transaksional ini, dan cenderung membuatnya terlihat generik. Label teks yang jelas ("Simpan Pembayaran", "Tandai Terkirim") lebih efektif daripada ikon abstrak.

## Motif Identitas

Satu motif berulang: **garis pembatas tipis berwarna cokelat pasir di antara bagian ringkasan angka** (misalnya antara "Total Tagihan", "Sudah Dibayar", "Sisa Tagihan" pada kartu status pesanan), meniru struktur nota/kwitansi fisik yang sudah dikenal pemilik usaha dan pelanggan jastip. *Alasan: motif ini punya hubungan langsung dengan konteks produk (pencatatan transaksi ala nota), bukan hiasan generik, dan dipakai berulang di setiap tampilan ringkasan angka agar terasa konsisten sebagai satu identitas.*
