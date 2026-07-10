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

// Test koneksi
pool.getConnection()
  .then(async conn => {
    console.log('✅ Database connected!');
    try {
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
      console.log('✅ Table activity_logs is ready!');
      
      // Pastikan tabel users memiliki kolom is_logged_in
      try {
        await conn.query('ALTER TABLE users ADD COLUMN is_logged_in BOOLEAN DEFAULT FALSE');
        console.log('✅ Added is_logged_in column to users table');
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.error('⚠️ Could not add is_logged_in column:', err.message);
        }
      }

      // Pastikan tabel menu memiliki kolom deskripsi
      try {
        await conn.query('ALTER TABLE menu ADD COLUMN deskripsi TEXT NULL AFTER nama');
        console.log('✅ Added deskripsi column to menu table');
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.error('⚠️ Could not add deskripsi column:', err.message);
        }
      }
    } catch (e) {
      console.error('⚠️ Failed to ensure tables:', e.message);
    }
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;