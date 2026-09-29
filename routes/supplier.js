const express = require('express');
const router = express.Router();
const db = require('../db');
const { redirectFlash, getFlash } = require('../lib/flash');

router.get('/', (req, res) => {
  const daftarSupplier = db.prepare(`
    SELECT supplier.*,
      (SELECT COUNT(*) FROM batch WHERE batch.supplier_id = supplier.id) AS jumlah_batch
    FROM supplier
    ORDER BY supplier.nama COLLATE NOCASE ASC
  `).all();

  let supplierDiedit = null;
  if (req.query.edit) {
    supplierDiedit = db.prepare('SELECT * FROM supplier WHERE id = ?').get(req.query.edit) || null;
  }

  res.render('supplier/index', {
    title: 'Supplier',
    daftarSupplier,
    supplierDiedit,
    flash: getFlash(req),
  });
});

router.post('/', (req, res) => {
  const nama = (req.body.nama || '').trim();
  const kontak = (req.body.kontak || '').trim();

  if (!nama) {
    return redirectFlash(res, '/supplier', 'error', 'Nama supplier wajib diisi.');
  }

  db.prepare('INSERT INTO supplier (nama, kontak) VALUES (?, ?)').run(nama, kontak || null);
  redirectFlash(res, '/supplier', 'sukses', `Supplier "${nama}" berhasil ditambahkan.`);
});

router.post('/:id/edit', (req, res) => {
  const supplier = db.prepare('SELECT * FROM supplier WHERE id = ?').get(req.params.id);
  if (!supplier) {
    return redirectFlash(res, '/supplier', 'error', 'Supplier tidak ditemukan.');
  }

  const nama = (req.body.nama || '').trim();
  const kontak = (req.body.kontak || '').trim();

  if (!nama) {
    return redirectFlash(res, '/supplier', 'error', 'Nama supplier wajib diisi.');
  }

  db.prepare('UPDATE supplier SET nama = ?, kontak = ? WHERE id = ?').run(nama, kontak || null, req.params.id);
  redirectFlash(res, '/supplier', 'sukses', `Supplier "${nama}" berhasil diperbarui.`);
});

router.post('/:id/hapus', (req, res) => {
  const supplier = db.prepare('SELECT * FROM supplier WHERE id = ?').get(req.params.id);
  if (!supplier) {
    return redirectFlash(res, '/supplier', 'error', 'Supplier tidak ditemukan.');
  }

  const jumlahBatch = db.prepare('SELECT COUNT(*) AS jumlah FROM batch WHERE supplier_id = ?').get(req.params.id).jumlah;
  if (jumlahBatch > 0) {
    return redirectFlash(res, '/supplier', 'error', `Supplier "${supplier.nama}" tidak dapat dihapus karena sudah memiliki ${jumlahBatch} batch.`);
  }

  db.prepare('DELETE FROM supplier WHERE id = ?').run(req.params.id);
  redirectFlash(res, '/supplier', 'sukses', `Supplier "${supplier.nama}" berhasil dihapus.`);
});

module.exports = router;
