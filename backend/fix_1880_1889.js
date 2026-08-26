require('dotenv').config({ path: '/root/warkop-backend/.env' });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warkop'
  });

  try {
    const [resultPesanan] = await conn.query("UPDATE pesanan SET status = 'selesai', payment_status = 'paid', is_open_bill = 0 WHERE id BETWEEN 1880 AND 1889 AND status = 'pending'");
    console.log('Update pesanan:', resultPesanan.affectedRows, 'rows');

    const [resultDetail] = await conn.query("UPDATE detail_pesanan SET status = 'selesai' WHERE pesanan_id BETWEEN 1880 AND 1889");
    console.log('Update detail_pesanan:', resultDetail.affectedRows, 'rows');
  } catch(e) {
    console.error(e.message);
  } finally {
    conn.end();
  }
}
run();
