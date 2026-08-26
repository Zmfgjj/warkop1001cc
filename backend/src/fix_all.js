require('dotenv').config({ path: '/var/www/backend/.env' });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warkop'
  });

  try {
    const [res] = await conn.query("UPDATE pesanan SET status = 'selesai', payment_status = 'paid', is_open_bill = 0 WHERE status = 'pending'");
    console.log('Pesanan berhasil di-fix:', res.affectedRows, 'baris');
    
    const [res2] = await conn.query("UPDATE detail_pesanan SET status = 'selesai' WHERE status = 'pending'");
    console.log('Detail pesanan berhasil di-fix:', res2.affectedRows, 'baris');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    conn.end();
  }
}
run();
