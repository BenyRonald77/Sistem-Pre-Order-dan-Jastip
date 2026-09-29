const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS supplier (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    kontak TEXT
  );

  CREATE TABLE IF NOT EXISTS batch (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    supplier_id INTEGER NOT NULL,
    tenggat_waktu TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('buka','ditutup','dipesan_ke_supplier','dikirim','tiba','selesai','dibatalkan')) DEFAULT 'buka',
    eta_pengiriman TEXT,
    catatan TEXT,
    dibuat_pada TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (supplier_id) REFERENCES supplier(id)
  );

  CREATE TABLE IF NOT EXISTS produk (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    nama TEXT NOT NULL,
    harga REAL NOT NULL,
    satuan TEXT NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES batch(id)
  );

  CREATE TABLE IF NOT EXISTS pelanggan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    no_hp TEXT NOT NULL UNIQUE,
    alamat TEXT
  );

  CREATE TABLE IF NOT EXISTS pesanan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    pelanggan_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending','dp_dibayar','lunas','dibatalkan')) DEFAULT 'pending',
    dibuat_pada TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (batch_id) REFERENCES batch(id),
    FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id)
  );

  CREATE TABLE IF NOT EXISTS pesanan_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pesanan_id INTEGER NOT NULL,
    produk_id INTEGER NOT NULL,
    kuantitas INTEGER NOT NULL,
    harga_satuan REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (pesanan_id) REFERENCES pesanan(id),
    FOREIGN KEY (produk_id) REFERENCES produk(id)
  );

  CREATE TABLE IF NOT EXISTS pembayaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pesanan_id INTEGER NOT NULL,
    tipe TEXT NOT NULL CHECK(tipe IN ('dp','pelunasan')),
    jumlah REAL NOT NULL,
    metode TEXT,
    catatan TEXT,
    dicatat_pada TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (pesanan_id) REFERENCES pesanan(id)
  );

  CREATE INDEX IF NOT EXISTS idx_batch_supplier ON batch(supplier_id);
  CREATE INDEX IF NOT EXISTS idx_produk_batch ON produk(batch_id);
  CREATE INDEX IF NOT EXISTS idx_pesanan_batch ON pesanan(batch_id);
  CREATE INDEX IF NOT EXISTS idx_pesanan_pelanggan ON pesanan(pelanggan_id);
  CREATE INDEX IF NOT EXISTS idx_item_pesanan ON pesanan_item(pesanan_id);
  CREATE INDEX IF NOT EXISTS idx_item_produk ON pesanan_item(produk_id);
  CREATE INDEX IF NOT EXISTS idx_bayar_pesanan ON pembayaran(pesanan_id);
`);

module.exports = db;
