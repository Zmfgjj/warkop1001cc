require('dotenv').config({ path: './src/.env' });
require('dotenv').config(); // Load backend/.env
const db = require('./src/config/database');

async function fixDB() {
  try {
    console.log("🛠️ Memulai perbaikan database...");

    try {
      await db.query("ALTER TABLE pesanan ADD COLUMN nomor_antrean INT NULL;");
      console.log("✅ Kolom 'nomor_antrean' berhasil ditambahkan ke tabel pesanan.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'nomor_antrean' sudah ada.");
      else throw e;
    }

    try {
      await db.query("INSERT IGNORE INTO settings (`key`, nilai) VALUES ('queue_date', '2020-01-01'), ('queue_online', '0'), ('queue_offline', '30');");
      console.log("✅ Data antrean berhasil ditambahkan ke tabel settings.");
    } catch (e) {
      console.log("⚠️ Gagal menambahkan ke tabel settings:", e.message);
    }

    try {
      await db.query("ALTER TABLE menu ADD COLUMN harga_diskon DECIMAL(10,2) DEFAULT 0 AFTER harga;");
      console.log("✅ Kolom 'harga_diskon' berhasil ditambahkan ke tabel menu.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'harga_diskon' sudah ada.");
      else throw e;
    }

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS menu_varian (
          id INT AUTO_INCREMENT PRIMARY KEY,
          menu_id INT NOT NULL,
          nama VARCHAR(100) NOT NULL,
          harga_tambahan DECIMAL(10,2) DEFAULT 0,
          FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
        );
      `);
      console.log("✅ Tabel 'menu_varian' berhasil dipastikan ada.");
    } catch (e) {
      console.log("⚠️ Gagal membuat tabel menu_varian:", e.message);
    }

    console.log("🎉 Perbaikan selesai!");
  } catch (err) {
    console.error("❌ Terjadi kesalahan utama:", err.message);
  } finally {
    process.exit(0);
  }
}

fixDB();
