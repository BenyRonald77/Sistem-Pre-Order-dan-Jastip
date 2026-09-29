const path = require('path');
const express = require('express');

require('./db'); // memastikan skema database sudah siap sebelum menerima permintaan

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/supplier', require('./routes/supplier'));
app.use('/batch', require('./routes/batch'));
app.use('/pesan', require('./routes/pesan'));
app.use('/pesanan', require('./routes/pesanan'));

app.use((req, res) => {
  res.status(404).render('404');
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500', { pesan: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sistem Pre-Order dan Jastip berjalan di http://localhost:${PORT}`);
});
