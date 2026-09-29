function formatRupiah(angka) {
  const n = Math.round(Number(angka) || 0);
  return 'Rp' + n.toLocaleString('id-ID');
}

function formatTanggalWaktu(nilai) {
  if (!nilai) return '-';
  const d = new Date(nilai);
  if (isNaN(d.getTime())) return String(nilai);
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatTanggal(nilai) {
  if (!nilai) return '-';
  const d = new Date(nilai);
  if (isNaN(d.getTime())) return String(nilai);
  return d.toLocaleDateString('id-ID', { dateStyle: 'medium' });
}

module.exports = { formatRupiah, formatTanggalWaktu, formatTanggal };
