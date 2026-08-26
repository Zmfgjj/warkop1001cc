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
    const [result] = await conn.query(`
      INSERT INTO pembayaran (pesanan_id, metode, jumlah, status, created_at)
      SELECT p.id, 'cash', p.total, 'sukses', p.created_at
      FROM pesanan p
      WHERE p.payment_status = 'paid' AND NOT EXISTS (
        SELECT 1 FROM pembayaran pb WHERE pb.pesanan_id = p.id
      )
    `);
    console.log('BERHASIL! Riwayat pembayaran yang hilang sudah ditambahkan: ' + result.affectedRows + ' baris');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    conn.end();
  }
}
run();
