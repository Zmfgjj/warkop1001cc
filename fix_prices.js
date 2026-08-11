const mysql = require('mysql2/promise');

async function fixHistorical() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'warkop1001cc'
  });

  try {
    console.log("Fixing Aug 2 (Peach Tea)...");
    // Peach Tea id=448 (pesanan 172) dp.harga from 15000 -> 13000. Qty = 2.
    // Decrease total by 4000
    await conn.query(`UPDATE detail_pesanan SET harga = 13000 WHERE id = 448`);
    await conn.query(`UPDATE pesanan SET total = total - 4000 WHERE id = 172`);
    await conn.query(`UPDATE pembayaran SET jumlah = jumlah - 4000 WHERE pesanan_id = 172`);
    
    console.log("Fixing Aug 4 (Cireng gemoy ayam)...");
    // Cireng gemoy ayam id=832 (pesanan 311) dp.harga from 12000 -> 20000. Qty = 1.
    // Increase total by 8000
    await conn.query(`UPDATE detail_pesanan SET harga = 20000 WHERE id = 832`);
    await conn.query(`UPDATE pesanan SET total = total + 8000 WHERE id = 311`);
    await conn.query(`UPDATE pembayaran SET jumlah = jumlah + 8000 WHERE pesanan_id = 311`);

    console.log("Done fixing historical data.");
  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

fixHistorical();
