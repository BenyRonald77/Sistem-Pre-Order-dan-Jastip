const express = require('express');
const router = express.Router();
const db = require('../db');
const { redirectFlash, getFlash } = require('../lib/flash');
const { LABEL_STATUS_BATCH, LABEL_STATUS_PESANAN } = require('../lib/constants');
const { formatRupiah, formatTanggalWaktu } = require('../lib/format');

function ambilBatchAtauNull(id) {
  return db.prepare(`
    SELECT batch.*, supplier.nama AS nama_supplier, supplier.kontak AS kontak_supplier
    FROM batch
    JOIN supplier ON supplier.id = batch.supplier_id
    WHERE batch.id = ?
  `).get(id);
}

router.get('/', (req, res) => {
  const daftarBatch = db.prepare(`
    SELECT batch.*, supplier.nama AS nama_supplier,
      (SELECT COUNT(*) FROM produk WHERE produk.batch_id = batch.id) AS jumlah_produk,
      (SELECT COUNT(*) FROM pesanan WHERE pesanan.batch_id = batch.id AND pesanan.status != 'dibatalkan') AS jumlah_pesanan
    FROM batch
    JOIN supplier ON supplier.id = batch.supplier_id
    ORDER BY batch.dibuat_pada DESC
  `).all();

  const daftarSupplier = db.prepare('SELECT * FROM supplier ORDER BY nama COLLATE NOCASE ASC').all();

  res.render('batch/index', {
    title: 'Batch PO',
    daftarBatch,
    daftarSupplier,
    LABEL_STATUS_BATCH,
    formatTanggalWaktu,
    flash: getFlash(req),
  });
});

router.post('/', (req, res) => {
  const nama = (req.body.nama || '').trim();
  const supplierId = req.body.supplier_id;
  const tenggatWaktu = req.body.tenggat_waktu;
  const catatan = (req.body.catatan || '').trim();

  if (!nama || !supplierId || !tenggatWaktu) {
    return redirectFlash(res, '/batch', 'error', 'Nama batch, supplier, dan tenggat waktu wajib diisi.');
  }

  const supplier = db.prepare('SELECT id FROM supplier WHERE id = ?').get(supplierId);
  if (!supplier) {
    return redirectFlash(res, '/batch', 'error', 'Supplier yang dipilih tidak valid.');
  }

  const info = db.prepare(`
    INSERT INTO batch (nama, supplier_id, tenggat_waktu, catatan, status)
    VALUES (?, ?, ?, ?, 'buka')
  `).run(nama, supplierId, tenggatWaktu, catatan || null);

  redirectFlash(res, `/batch/${info.lastInsertRowid}`, 'sukses', `Batch "${nama}" berhasil dibuat. Tambahkan produk di bawah ini.`);
});

router.get('/:id', (req, res) => {
  const batch = ambilBatchAtauNull(req.params.id);
  if (!batch) {
    return res.status(404).render('404');
  }

  const daftarProduk = db.prepare('SELECT * FROM produk WHERE batch_id = ? ORDER BY id ASC').all(batch.id);

  const daftarPesanan = db.prepare(`
    SELECT pesanan.*, pelanggan.nama AS nama_pelanggan, pelanggan.no_hp,
      (SELECT COALESCE(SUM(subtotal), 0) FROM pesanan_item WHERE pesanan_item.pesanan_id = pesanan.id) AS total_tagihan,
      (SELECT COALESCE(SUM(jumlah), 0) FROM pembayaran WHERE pembayaran.pesanan_id = pesanan.id) AS total_dibayar
    FROM pesanan
    JOIN pelanggan ON pelanggan.id = pesanan.pelanggan_id
    WHERE pesanan.batch_id = ?
    ORDER BY pesanan.dibuat_pada DESC
  `).all(batch.id);

  const batchMasihBuka = batch.status === 'buka' && new Date(batch.tenggat_waktu).getTime() > Date.now();

  res.render('batch/detail', {
    title: `Batch: ${batch.nama}`,
    batch,
    daftarProduk,
    daftarPesanan,
    batchMasihBuka,
    LABEL_STATUS_BATCH,
    LABEL_STATUS_PESANAN,
    formatRupiah,
    formatTanggalWaktu,
    flash: getFlash(req),
  });
});

router.post('/:id/produk', (req, res) => {
  const batch = ambilBatchAtauNull(req.params.id);
  if (!batch) {
    return res.status(404).render('404');
  }

  const nama = (req.body.nama || '').trim();
  const harga = Number(req.body.harga);
  const satuan = (req.body.satuan || '').trim();

  if (!nama || !satuan || !Number.isFinite(harga) || harga <= 0) {
    return redirectFlash(res, `/batch/${batch.id}`, 'error', 'Nama produk, harga (harus lebih dari 0), dan satuan wajib diisi dengan benar.');
  }

  db.prepare('INSERT INTO produk (batch_id, nama, harga, satuan) VALUES (?, ?, ?, ?)').run(batch.id, nama, harga, satuan);
  redirectFlash(res, `/batch/${batch.id}`, 'sukses', `Produk "${nama}" berhasil ditambahkan ke batch.`);
});

router.post('/:id/produk/:produkId/hapus', (req, res) => {
  const batch = ambilBatchAtauNull(req.params.id);
  if (!batch) {
    return res.status(404).render('404');
  }

  const produk = db.prepare('SELECT * FROM produk WHERE id = ? AND batch_id = ?').get(req.params.produkId, batch.id);
  if (!produk) {
    return redirectFlash(res, `/batch/${batch.id}`, 'error', 'Produk tidak ditemukan.');
  }

  const jumlahDipesan = db.prepare('SELECT COUNT(*) AS jumlah FROM pesanan_item WHERE produk_id = ?').get(produk.id).jumlah;
  if (jumlahDipesan > 0) {
    return redirectFlash(res, `/batch/${batch.id}`, 'error', `Produk "${produk.nama}" tidak dapat dihapus karena sudah ada pesanan yang memuatnya.`);
  }

  db.prepare('DELETE FROM produk WHERE id = ?').run(produk.id);
  redirectFlash(res, `/batch/${batch.id}`, 'sukses', `Produk "${produk.nama}" berhasil dihapus.`);
});

module.exports = router;
