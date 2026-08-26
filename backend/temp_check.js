const db = require('./src/config/database');
async function check() {
  const conn = await db.getConnection();
  try {
    const [orders] = await conn.query('SELECT p.id, p.total, p.created_at, p.status, p.payment_status, p.member_id, p.is_open_bill FROM pesanan p WHERE p.id IN (1876, 1877)');
    const [details] = await conn.query('SELECT id, pesanan_id, nama_menu, qty, harga, status FROM detail_pesanan WHERE pesanan_id IN (1876, 1877)');
    console.log('Orders:'); console.table(orders);
    console.log('Details:'); console.table(details);
  } finally {
    conn.release();
    process.exit();
  }
}
check();
