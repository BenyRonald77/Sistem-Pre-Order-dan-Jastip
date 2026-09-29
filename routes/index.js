const express = require('express');
const router = express.Router();
const db = require('../db');
const { LABEL_STATUS_BATCH } = require('../lib/constants');
const { formatTanggalWaktu } = require('../lib/format');
const { getFlash } = require('../lib/flash');

router.get('/', (req, res) => {
  const batchAktif = db.prepare(`
    SELECT batch.*, supplier.nama AS nama_supplier,
      (SELECT COUNT(*) FROM pesanan WHERE pesanan.batch_id = batch.id AND pesanan.status != 'dibatalkan') AS jumlah_pesanan
    FROM batch
    JOIN supplier ON supplier.id = batch.supplier_id
    WHERE batch.status NOT IN ('selesai', 'dibatalkan')
    ORDER BY batch.dibuat_pada DESC
  `).all();

  res.render('index', {
    title: 'Dashboard',
    batchAktif,
    LABEL_STATUS_BATCH,
    formatTanggalWaktu,
    flash: getFlash(req),
  });
});

module.exports = router;
