const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Auto migration function on DB connect
pool.getConnection()
  .then(async conn => {
    console.log('✅ Database connected!');
    try {
      // 1. activity_logs table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          username VARCHAR(100) NULL,
          action_type VARCHAR(50) NOT NULL,
          table_name VARCHAR(50) NULL,
          description TEXT NOT NULL,
          backup_data LONGTEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. settings table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          \`key\` VARCHAR(100) UNIQUE NOT NULL,
          nilai VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      // Default settings data
      try {
        await conn.query("INSERT IGNORE INTO settings (`key`, nilai) VALUES ('ppn', '2'), ('queue_date', '2020-01-01'), ('queue_online', '0'), ('queue_offline', '30');");
      } catch (e) {}

      // 3. menu_varian table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS menu_varian (
          id INT AUTO_INCREMENT PRIMARY KEY,
          menu_id INT NOT NULL,
          nama VARCHAR(100) NOT NULL,
          harga_tambahan DECIMAL(10,2) DEFAULT 0,
          FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
        );
      `);

      // 4. promosi table
      await conn.query(`
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

      // 5. promosi_menu table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS promosi_menu (
          promosi_id INT NOT NULL,
          menu_id INT NOT NULL,
          PRIMARY KEY (promosi_id, menu_id),
          FOREIGN KEY (promosi_id) REFERENCES promosi(id) ON DELETE CASCADE,
          FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
        );
      `);

      // 6. public_menu_visits table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS public_menu_visits (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tanggal DATE NOT NULL,
          ip_address VARCHAR(45) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 7. members table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS members (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nama VARCHAR(100) NOT NULL,
          nama_panggilan VARCHAR(50) NULL,
          no_hp VARCHAR(20) UNIQUE NOT NULL,
          tgl_lahir DATE NULL,
          point INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 8. member_points_history table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS member_points_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          member_id INT NOT NULL,
          pesanan_id INT NULL,
          tipe VARCHAR(20) NOT NULL, -- 'earn', 'redeem'
          jumlah_poin INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
        );
      `);

      // Safe column addition helper
      const addColumn = async (table, columnDef) => {
        try {
          await conn.query(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
        } catch (err) {
          if (err.code !== 'ER_DUP_FIELDNAME') {
            console.error(`⚠️ Could not add column to ${table}:`, err.message);
          }
        }
      };

      await addColumn('users', 'is_logged_in BOOLEAN DEFAULT FALSE');
      await addColumn('menu', 'deskripsi TEXT NULL AFTER nama');
      await addColumn('menu', 'harga_diskon DECIMAL(10,2) DEFAULT 0 AFTER harga');
      await addColumn('menu', 'promo_mulai_jam VARCHAR(5) NULL AFTER harga_diskon');
      await addColumn('menu', 'promo_selesai_jam VARCHAR(5) NULL AFTER promo_mulai_jam');
      await addColumn('pesanan', 'nomor_antrean INT NULL');
      await addColumn('pesanan', 'discount_name VARCHAR(100) NULL');
      await addColumn('pesanan', 'discount_value DECIMAL(10,2) DEFAULT 0');
      await addColumn('pesanan', 'member_id INT NULL');
      await addColumn('pesanan', 'point_earned INT DEFAULT 0');
      await addColumn('pesanan', 'point_used INT DEFAULT 0');
      await addColumn('pesanan', 'local_id VARCHAR(50) NULL UNIQUE');
      await addColumn('activity_logs', 'ip_address VARCHAR(45) NULL');
      await addColumn('activity_logs', 'user_agent TEXT NULL');
      await addColumn('members', 'nama_panggilan VARCHAR(50) NULL AFTER nama');
      await addColumn('menu', 'kategori2_id INT NULL AFTER kategori_id');
      await addColumn('kategori', 'print_destination VARCHAR(50) DEFAULT "kasir"');
      await addColumn('menu', 'is_deleted BOOLEAN DEFAULT FALSE');

      // Safe Index addition
      try {
        await conn.query("CREATE INDEX idx_pesanan_status_date ON pesanan (status, created_at);");
      } catch (e) {}

      console.log('✅ All database tables and columns ensured!');

    } catch (e) {
      console.error('⚠️ Failed during schema auto-migration:', e.message);
    }
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;