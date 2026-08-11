const mysql = require('mysql2/promise');

async function fixData() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'warkop1001cc'
  });

  try {
    console.log("== AUG 2 MISMATCH ==");
    const [rows2] = await conn.query(`
      SELECT dp.id, p.id as pesanan_id, m.nama, dp.qty, dp.harga as dp_harga, m.harga as current_harga 
      FROM detail_pesanan dp 
      JOIN pesanan p ON dp.pesanan_id = p.id 
      JOIN menu m ON dp.menu_id = m.id 
      WHERE DATE(p.created_at) = '2026-08-02' 
      AND (dp.harga * dp.qty != m.harga * dp.qty OR dp.harga = 15000 OR dp.harga = 30000)
    `);
    console.log(rows2);

    console.log("\n== AUG 4 MISMATCH ==");
    const [rows4] = await conn.query(`
      SELECT dp.id, p.id as pesanan_id, m.nama, dp.qty, dp.harga as dp_harga, m.harga as current_harga 
      FROM detail_pesanan dp 
      JOIN pesanan p ON dp.pesanan_id = p.id 
      JOIN menu m ON dp.menu_id = m.id 
      WHERE DATE(p.created_at) = '2026-08-04'
      AND (dp.harga * dp.qty != m.harga * dp.qty OR m.harga = 20000 OR dp.harga = 20000 OR dp.harga * dp.qty = 52000)
    `);
    console.log(rows4);

  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

fixData();
