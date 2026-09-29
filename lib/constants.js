const URUTAN_STATUS_BATCH = ['buka', 'ditutup', 'dipesan_ke_supplier', 'dikirim', 'tiba', 'selesai'];

const LABEL_STATUS_BATCH = {
  buka: 'Buka',
  ditutup: 'Ditutup',
  dipesan_ke_supplier: 'Dipesan ke Supplier',
  dikirim: 'Dikirim',
  tiba: 'Tiba di Tujuan',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

const KETERANGAN_STATUS_BATCH = {
  buka: 'Batch masih menerima pesanan baru.',
  ditutup: 'Pemesanan sudah ditutup, sedang disiapkan untuk dipesan ke supplier.',
  dipesan_ke_supplier: 'Rekap belanja sudah dipesan ke supplier.',
  dikirim: 'Barang sedang dalam perjalanan dari supplier.',
  tiba: 'Barang sudah tiba dan siap diambil atau diantar ke pelanggan.',
  selesai: 'Batch ini sudah selesai sepenuhnya.',
  dibatalkan: 'Batch ini dibatalkan.',
};

function statusBatchBerikutnya(statusSaatIni) {
  const idx = URUTAN_STATUS_BATCH.indexOf(statusSaatIni);
  if (idx === -1 || idx === URUTAN_STATUS_BATCH.length - 1) return null;
  return URUTAN_STATUS_BATCH[idx + 1];
}

const LABEL_STATUS_PESANAN = {
  pending: 'Menunggu Pembayaran',
  dp_dibayar: 'DP Dibayar',
  lunas: 'Lunas',
  dibatalkan: 'Dibatalkan',
};

module.exports = {
  URUTAN_STATUS_BATCH,
  LABEL_STATUS_BATCH,
  KETERANGAN_STATUS_BATCH,
  statusBatchBerikutnya,
  LABEL_STATUS_PESANAN,
};
