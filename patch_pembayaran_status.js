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
      UPDATE pembayaran pb
      JOIN pesanan p ON pb.pesanan_id = p.id
      SET pb.status = 'sukses'
      WHERE p.payment_status = 'paid' AND pb.status != 'sukses'
    `);
    console.log('BERHASIL! Status pembayaran yang pending/gagal untuk pesanan lunas telah diupdate menjadi sukses: ' + result.affectedRows + ' baris');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    conn.end();
  }
}
run();
