const express = require('express');
const router = express.Router();
const db = require('../db');
const { redirectFlash, getFlash } = require('../lib/flash');
const { LABEL_STATUS_BATCH, LABEL_STATUS_PESANAN, statusBatchBerikutnya, URUTAN_STATUS_BATCH } = require('../lib/constants');
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
  const statusBerikutnya = statusBatchBerikutnya(batch.status);
  const bisaDibatalkan = batch.status !== 'selesai' && batch.status !== 'dibatalkan';

  res.render('batch/detail', {
    title: `Batch: ${batch.nama}`,
    batch,
    daftarProduk,
    daftarPesanan,
    batchMasihBuka,
    statusBerikutnya,
    bisaDibatalkan,
    LABEL_STATUS_BATCH,
    LABEL_STATUS_PESANAN,
    formatRupiah,
    formatTanggalWaktu,
    flash: getFlash(req),
  });
});

router.post('/:id/status', (req, res) => {
  const batch = ambilBatchAtauNull(req.params.id);
  if (!batch) {
    return res.status(404).render('404');
  }

  const statusBaru = req.body.status;
  const semuaStatusValid = [...URUTAN_STATUS_BATCH, 'dibatalkan'];

  if (!semuaStatusValid.includes(statusBaru)) {
    return redirectFlash(res, `/batch/${batch.id}`, 'error', 'Status tujuan tidak valid.');
  }

  if (statusBaru === 'dibatalkan') {
    if (batch.status === 'selesai' || batch.status === 'dibatalkan') {
      return redirectFlash(res, `/batch/${batch.id}`, 'error', `Batch berstatus "${LABEL_STATUS_BATCH[batch.status]}" tidak dapat dibatalkan.`);
    }
  } else {
    const berikutnyaSeharusnya = statusBatchBerikutnya(batch.status);
    if (statusBaru !== berikutnyaSeharusnya) {
      return redirectFlash(res, `/batch/${batch.id}`, 'error', 'Status pengiriman harus diubah sesuai urutan siklus, tidak bisa melompat.');
    }
  }

  db.prepare('UPDATE batch SET status = ? WHERE id = ?').run(statusBaru, batch.id);
  redirectFlash(res, `/batch/${batch.id}`, 'sukses', `Status batch berhasil diubah menjadi "${LABEL_STATUS_BATCH[statusBaru]}".`);
});

router.get('/:id/rekap', (req, res) => {
  const batch = ambilBatchAtauNull(req.params.id);
  if (!batch) {
    return res.status(404).render('404');
  }

  const rekap = db.prepare(`
    SELECT produk.id, produk.nama, produk.satuan, produk.harga,
      COALESCE(SUM(pi.kuantitas), 0) AS total_kuantitas,
      COALESCE(SUM(pi.subtotal), 0) AS total_nilai
    FROM produk
    LEFT JOIN pesanan_item pi ON pi.produk_id = produk.id
      AND pi.pesanan_id IN (SELECT id FROM pesanan WHERE pesanan.status != 'dibatalkan')
    WHERE produk.batch_id = ?
    GROUP BY produk.id
    ORDER BY produk.id ASC
  `).all(batch.id);

  const totalNilaiBelanja = rekap.reduce((jumlah, r) => jumlah + r.total_nilai, 0);
  const jumlahPesananDihitung = db.prepare(
    "SELECT COUNT(*) AS jumlah FROM pesanan WHERE batch_id = ? AND status != 'dibatalkan'"
  ).get(batch.id).jumlah;

  res.render('batch/rekap', {
    title: `Rekap Belanja: ${batch.nama}`,
    batch,
    rekap,
    totalNilaiBelanja,
    jumlahPesananDihitung,
    formatRupiah,
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
