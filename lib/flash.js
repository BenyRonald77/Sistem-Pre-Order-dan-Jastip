function redirectFlash(res, url, tipe, pesan) {
  const qs = new URLSearchParams({ flash: pesan, tipe }).toString();
  const pemisah = url.includes('?') ? '&' : '?';
  res.redirect(url + pemisah + qs);
}

function getFlash(req) {
  if (req.query && req.query.flash) {
    return { pesan: req.query.flash, tipe: req.query.tipe || 'info' };
  }
  return null;
}

module.exports = { redirectFlash, getFlash };
