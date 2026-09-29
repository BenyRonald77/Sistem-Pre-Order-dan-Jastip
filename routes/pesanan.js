const express = require('express');
const router = express.Router();
const db = require('../db');
const { redirectFlash, getFlash } = require('../lib/flash');
const { LABEL_STATUS_BATCH, LABEL_STATUS_PESANAN } = require('../lib/constants');
const { formatRupiah, formatTanggalWaktu } = require('../lib/format');
const { ambilRincianPesanan, catatPembayaran } = require('../lib/pesanan');

const TIPE_PEMBAYARAN_VALID = ['dp', 'pelunasan'];

const STATUS_PESANAN_VALID = ['pending', 'dp_dibayar', 'lunas', 'dibatalkan'];

router.get('/', (req, res) => {
  const statusFilter = req.query.status || '';

  let sql = `
    SELECT pesanan.*, pelanggan.nama AS nama_pelanggan, pelanggan.no_hp,
      batch.nama AS nama_batch,
      (SELECT COALESCE(SUM(subtotal), 0) FROM pesanan_item WHERE pesanan_item.pesanan_id = pesanan.id) AS total_tagihan,
      (SELECT COALESCE(SUM(jumlah), 0) FROM pembayaran WHERE pembayaran.pesanan_id = pesanan.id) AS total_dibayar
    FROM pesanan
    JOIN pelanggan ON pelanggan.id = pesanan.pelanggan_id
    JOIN batch ON batch.id = pesanan.batch_id
  `;
  const params = [];
  if (statusFilter && STATUS_PESANAN_VALID.includes(statusFilter)) {
    sql += ' WHERE pesanan.status = ?';
    params.push(statusFilter);
  }
  sql += ' ORDER BY pesanan.dibuat_pada DESC';

  const daftarPesanan = db.prepare(sql).all(...params);

  res.render('pesanan/index', {
    title: 'Semua Pesanan',
    daftarPesanan,
    statusFilter,
    LABEL_STATUS_PESANAN,
    formatRupiah,
    formatTanggalWaktu,
    flash: getFlash(req),
  });
});

router.get('/:id', (req, res) => {
  const rincian = ambilRincianPesanan(req.params.id);
  if (!rincian) {
    return res.status(404).render('404');
  }

  res.render('pesan/status', {
    title: `Status Pesanan #${rincian.pesanan.id}`,
    publik: true,
    rincian,
    LABEL_STATUS_BATCH,
    LABEL_STATUS_PESANAN,
    formatRupiah,
    formatTanggalWaktu,
    flash: getFlash(req),
  });
});

router.post('/:id/bayar', (req, res) => {
  const pesanan = db.prepare('SELECT * FROM pesanan WHERE id = ?').get(req.params.id);
  if (!pesanan) {
    return res.status(404).render('404');
  }

  const kembaliMentah = req.body.kembali;
  const kembali = typeof kembaliMentah === 'string' && kembaliMentah.startsWith('/')
    ? kembaliMentah
    : `/pesanan/${pesanan.id}`;

  if (pesanan.status === 'dibatalkan') {
    return redirectFlash(res, kembali, 'error', 'Pesanan ini sudah dibatalkan, pembayaran tidak dapat dicatat.');
  }
  if (pesanan.status === 'lunas') {
    return redirectFlash(res, kembali, 'error', 'Pesanan ini sudah lunas, tidak perlu pembayaran tambahan.');
  }

  const tipe = req.body.tipe;
  const jumlah = Number(req.body.jumlah);
  const metode = (req.body.metode || '').trim();
  const catatan = (req.body.catatan || '').trim();

  if (!TIPE_PEMBAYARAN_VALID.includes(tipe)) {
    return redirectFlash(res, kembali, 'error', 'Tipe pembayaran tidak valid.');
  }
  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    return redirectFlash(res, kembali, 'error', 'Jumlah pembayaran harus lebih dari 0.');
  }

  const hasil = catatPembayaran(pesanan.id, { tipe, jumlah, metode, catatan });

  redirectFlash(
    res,
    kembali,
    'sukses',
    `Pembayaran ${formatRupiah(jumlah)} berhasil dicatat. Status pesanan sekarang: ${LABEL_STATUS_PESANAN[hasil.statusBaru]}, sisa tagihan ${formatRupiah(hasil.sisaTagihan)}.`
  );
});

module.exports = router;
