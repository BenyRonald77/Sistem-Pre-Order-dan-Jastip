const db = require('../db');

function hitungTotalTagihan(pesananId) {
  return db.prepare('SELECT COALESCE(SUM(subtotal), 0) AS total FROM pesanan_item WHERE pesanan_id = ?').get(pesananId).total;
}

function hitungTotalDibayar(pesananId) {
  return db.prepare('SELECT COALESCE(SUM(jumlah), 0) AS total FROM pembayaran WHERE pesanan_id = ?').get(pesananId).total;
}

function statusDariPembayaran(totalTagihan, totalDibayar) {
  if (totalDibayar <= 0) return 'pending';
  if (totalDibayar < totalTagihan) return 'dp_dibayar';
  return 'lunas';
}

function ambilRincianPesanan(pesananId) {
  const pesanan = db.prepare(`
    SELECT pesanan.*, pelanggan.nama AS nama_pelanggan, pelanggan.no_hp, pelanggan.alamat,
      batch.id AS batch_id, batch.nama AS nama_batch, batch.status AS status_batch,
      supplier.nama AS nama_supplier
    FROM pesanan
    JOIN pelanggan ON pelanggan.id = pesanan.pelanggan_id
    JOIN batch ON batch.id = pesanan.batch_id
    JOIN supplier ON supplier.id = batch.supplier_id
    WHERE pesanan.id = ?
  `).get(pesananId);

  if (!pesanan) return null;

  const item = db.prepare(`
    SELECT pesanan_item.*, produk.nama AS nama_produk, produk.satuan
    FROM pesanan_item
    JOIN produk ON produk.id = pesanan_item.produk_id
    WHERE pesanan_item.pesanan_id = ?
    ORDER BY pesanan_item.id ASC
  `).all(pesananId);

  const pembayaran = db.prepare(
    'SELECT * FROM pembayaran WHERE pesanan_id = ? ORDER BY dicatat_pada ASC, id ASC'
  ).all(pesananId);

  const totalTagihan = item.reduce((jumlah, i) => jumlah + i.subtotal, 0);
  const totalDibayar = pembayaran.reduce((jumlah, p) => jumlah + p.jumlah, 0);

  return {
    pesanan,
    item,
    pembayaran,
    totalTagihan,
    totalDibayar,
    sisaTagihan: Math.max(totalTagihan - totalDibayar, 0),
  };
}

function catatPembayaran(pesananId, { tipe, jumlah, metode, catatan }) {
  const transaksi = db.transaction(() => {
    db.prepare(`
      INSERT INTO pembayaran (pesanan_id, tipe, jumlah, metode, catatan)
      VALUES (?, ?, ?, ?, ?)
    `).run(pesananId, tipe, jumlah, metode || null, catatan || null);

    // Total tagihan dan total dibayar dihitung ulang dari basis data (bukan dari
    // nilai yang dikirim klien), lalu status pesanan diperbarui dalam transaksi
    // yang sama, sehingga pencatatan pembayaran dan status selalu sinkron.
    const totalTagihan = hitungTotalTagihan(pesananId);
    const totalDibayar = hitungTotalDibayar(pesananId);
    const statusBaru = statusDariPembayaran(totalTagihan, totalDibayar);

    db.prepare('UPDATE pesanan SET status = ? WHERE id = ?').run(statusBaru, pesananId);

    return { totalTagihan, totalDibayar, statusBaru, sisaTagihan: Math.max(totalTagihan - totalDibayar, 0) };
  });

  return transaksi();
}

module.exports = {
  hitungTotalTagihan,
  hitungTotalDibayar,
  statusDariPembayaran,
  ambilRincianPesanan,
  catatPembayaran,
};
