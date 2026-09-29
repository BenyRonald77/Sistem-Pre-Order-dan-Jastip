const express = require('express');
const router = express.Router();
const db = require('../db');
const { LABEL_STATUS_BATCH } = require('../lib/constants');
const { formatRupiah, formatTanggalWaktu } = require('../lib/format');

function ambilBatchUntukPemesanan(batchId) {
  return db.prepare(`
    SELECT batch.*, supplier.nama AS nama_supplier
    FROM batch
    JOIN supplier ON supplier.id = batch.supplier_id
    WHERE batch.id = ?
  `).get(batchId);
}

function batchMasihMenerimaPesanan(batch) {
  return batch.status === 'buka' && new Date(batch.tenggat_waktu).getTime() > Date.now();
}

router.get('/:batchId', (req, res) => {
  const batch = ambilBatchUntukPemesanan(req.params.batchId);
  if (!batch) {
    return res.status(404).render('404');
  }

  const daftarProduk = db.prepare('SELECT * FROM produk WHERE batch_id = ? ORDER BY id ASC').all(batch.id);

  res.render('pesan/form', {
    title: `Pesan - ${batch.nama}`,
    publik: true,
    batch,
    daftarProduk,
    bisaPesan: batchMasihMenerimaPesanan(batch),
    LABEL_STATUS_BATCH,
    formatRupiah,
    formatTanggalWaktu,
    error: null,
    inputSebelumnya: null,
    flash: null,
  });
});

router.post('/:batchId', (req, res) => {
  const batch = ambilBatchUntukPemesanan(req.params.batchId);
  if (!batch) {
    return res.status(404).render('404');
  }

  const daftarProduk = db.prepare('SELECT * FROM produk WHERE batch_id = ? ORDER BY id ASC').all(batch.id);
  const bisaPesan = batchMasihMenerimaPesanan(batch);

  const tampilkanGalat = (pesanGalat) => {
    res.status(400).render('pesan/form', {
      title: `Pesan - ${batch.nama}`,
      publik: true,
      batch,
      daftarProduk,
      bisaPesan,
      LABEL_STATUS_BATCH,
      formatRupiah,
      formatTanggalWaktu,
      error: pesanGalat,
      inputSebelumnya: req.body,
      flash: null,
    });
  };

  // Validasi tenggat waktu dan status batch dilakukan lagi di sini, bukan hanya
  // dengan menyembunyikan form di tampilan, sehingga permintaan langsung ke
  // endpoint ini setelah batch ditutup atau lewat tenggat tetap ditolak.
  if (!bisaPesan) {
    return tampilkanGalat(
      batch.status !== 'buka'
        ? `Batch ini berstatus "${LABEL_STATUS_BATCH[batch.status]}" dan sudah tidak menerima pesanan baru.`
        : 'Tenggat waktu pemesanan batch ini sudah lewat. Pesanan tidak dapat diproses.'
    );
  }

  const nama = (req.body.nama || '').trim();
  const noHp = (req.body.no_hp || '').trim();
  const alamat = (req.body.alamat || '').trim();

  if (!nama || !noHp || !alamat) {
    return tampilkanGalat('Nama, nomor WhatsApp, dan alamat wajib diisi.');
  }

  const itemDipesan = [];
  for (const produk of daftarProduk) {
    const kuantitas = parseInt(req.body['kuantitas_' + produk.id], 10);
    if (Number.isFinite(kuantitas) && kuantitas > 0) {
      itemDipesan.push({ produk, kuantitas });
    }
  }

  if (itemDipesan.length === 0) {
    return tampilkanGalat('Pilih minimal satu produk dengan kuantitas lebih dari 0.');
  }

  const buatPesanan = db.transaction(() => {
    let pelanggan = db.prepare('SELECT * FROM pelanggan WHERE no_hp = ?').get(noHp);
    if (pelanggan) {
      db.prepare('UPDATE pelanggan SET nama = ?, alamat = ? WHERE id = ?').run(nama, alamat, pelanggan.id);
    } else {
      const infoPelanggan = db.prepare(
        'INSERT INTO pelanggan (nama, no_hp, alamat) VALUES (?, ?, ?)'
      ).run(nama, noHp, alamat);
      pelanggan = { id: infoPelanggan.lastInsertRowid };
    }

    const infoPesanan = db.prepare(
      "INSERT INTO pesanan (batch_id, pelanggan_id, status) VALUES (?, ?, 'pending')"
    ).run(batch.id, pelanggan.id);

    const pesananId = infoPesanan.lastInsertRowid;

    const sisipItem = db.prepare(`
      INSERT INTO pesanan_item (pesanan_id, produk_id, kuantitas, harga_satuan, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const { produk, kuantitas } of itemDipesan) {
      sisipItem.run(pesananId, produk.id, kuantitas, produk.harga, produk.harga * kuantitas);
    }

    return pesananId;
  });

  const pesananId = buatPesanan();
  res.redirect(`/pesanan/${pesananId}`);
});

module.exports = router;
