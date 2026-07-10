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
      await db.query("ALTER TABLE menu ADD COLUMN promo_mulai_jam VARCHAR(5) NULL AFTER harga_diskon;");
      console.log("✅ Kolom 'promo_mulai_jam' berhasil ditambahkan ke tabel menu.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'promo_mulai_jam' sudah ada.");
      else throw e;
    }

    try {
      await db.query("ALTER TABLE menu ADD COLUMN promo_selesai_jam VARCHAR(5) NULL AFTER promo_mulai_jam;");
      console.log("✅ Kolom 'promo_selesai_jam' berhasil ditambahkan ke tabel menu.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'promo_selesai_jam' sudah ada.");
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

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS promosi (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nama VARCHAR(100) NOT NULL,
          tipe_promo VARCHAR(20) NOT NULL,
          nilai_promo DECIMAL(10,2) NOT NULL,
          mulai_jam VARCHAR(5) NULL,
          selesai_jam VARCHAR(5) NULL,
          hari VARCHAR(50) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Tabel 'promosi' berhasil dipastikan ada.");
    } catch (e) {
      console.log("⚠️ Gagal membuat tabel promosi:", e.message);
    }

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS promosi_menu (
          promosi_id INT NOT NULL,
          menu_id INT NOT NULL,
          PRIMARY KEY (promosi_id, menu_id),
          FOREIGN KEY (promosi_id) REFERENCES promosi(id) ON DELETE CASCADE,
          FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
        );
      `);
      console.log("✅ Tabel 'promosi_menu' berhasil dipastikan ada.");
    } catch (e) {
      console.log("⚠️ Gagal membuat tabel promosi_menu:", e.message);
    }

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS public_menu_visits (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tanggal DATE NOT NULL,
          ip_address VARCHAR(45) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Tabel 'public_menu_visits' berhasil dipastikan ada.");
    } catch (e) {
      console.log("⚠️ Gagal membuat tabel public_menu_visits:", e.message);
    }

    try {
      await db.query("ALTER TABLE pesanan ADD COLUMN discount_name VARCHAR(100) NULL;");
      console.log("✅ Kolom 'discount_name' berhasil ditambahkan ke tabel pesanan.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'discount_name' sudah ada.");
      else throw e;
    }

    try {
      await db.query("ALTER TABLE pesanan ADD COLUMN discount_value DECIMAL(10,2) DEFAULT 0;");
      console.log("✅ Kolom 'discount_value' berhasil ditambahkan ke tabel pesanan.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'discount_value' sudah ada.");
      else throw e;
    }

    try {
      await db.query("ALTER TABLE activity_logs ADD COLUMN ip_address VARCHAR(45) NULL;");
      console.log("✅ Kolom 'ip_address' berhasil ditambahkan ke activity_logs.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'ip_address' sudah ada di activity_logs.");
      else console.log("⚠️ Gagal tambah ip_address:", e.message);
    }

    try {
      await db.query("ALTER TABLE activity_logs ADD COLUMN user_agent TEXT NULL;");
      console.log("✅ Kolom 'user_agent' berhasil ditambahkan ke activity_logs.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'user_agent' sudah ada di activity_logs.");
      else console.log("⚠️ Gagal tambah user_agent:", e.message);
    }

    // CREATE INDEXES
    try {
      await db.query("CREATE INDEX idx_pesanan_status_date ON pesanan (status, created_at);");
      console.log("✅ Index 'idx_pesanan_status_date' berhasil dibuat.");
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') console.log("ℹ️ Index 'idx_pesanan_status_date' sudah ada.");
      else console.log("⚠️ Gagal buat index pesanan:", e.message);
    }

    try {
      await db.query("CREATE INDEX idx_detail_pesanan_id ON detail_pesanan (pesanan_id);");
      console.log("✅ Index 'idx_detail_pesanan_id' berhasil dibuat.");
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') console.log("ℹ️ Index 'idx_detail_pesanan_id' sudah ada.");
      else console.log("⚠️ Gagal buat index detail pesanan:", e.message);
    }

    console.log("🎉 Perbaikan selesai!");
  } catch (err) {
    console.error("❌ Terjadi kesalahan utama:", err.message);
  } finally {
    process.exit(0);
  }
}

fixDB();
