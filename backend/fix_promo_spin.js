const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSpinPrices() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warkop1001cc'
  });

  try {
    const isDryRun = process.argv.includes('dry-run');

    const [rows] = await conn.query(`
      SELECT p.id as pesanan_id, p.status, p.total, dp.id as detail_id, dp.menu_id, dp.catatan, dp.harga as harga_lama, dp.qty 
      FROM pesanan p 
      JOIN detail_pesanan dp ON p.id = dp.pesanan_id 
      WHERE dp.catatan LIKE '%Hadiah Spin Wheel%' AND p.status != 'selesai' AND p.status != 'batal'
    `);

    if (rows.length === 0) {
      console.log('Tidak ada pesanan aktif (pending/diproses) yang memiliki promo spin.');
      process.exit(0);
    }

    console.log(`Ditemukan ${rows.length} item promo spin pada pesanan aktif.`);

    let updatedPesananIds = new Set();
    
    for (const row of rows) {
      const p = row.catatan.toLowerCase();
      let specialPrice = 10000;
      if (p.includes('lychee')) specialPrice = 10000;
      else if (p.includes('boci') || p.includes('tulang rangu')) specialPrice = 13000;
      else if (p.includes('siomay') || p.includes('somay')) specialPrice = 10000;
      else if (p.includes('mango')) specialPrice = 10000;
      else if (p.includes('seblak')) specialPrice = 15000;
      else if (p.includes('cireng isi') || p.includes('gemoy')) specialPrice = 12000;
      else if (p.includes('es teh')) specialPrice = 5000;
      else if (p.includes('singkong')) specialPrice = 10000;
      else if (p.includes('kentang')) specialPrice = 10000;
      else if (p.includes('peach')) specialPrice = 10000;
      else if (p.includes('macaroni') || p.includes('schotel')) specialPrice = 13000;
      else if (p.includes('cireng rujak')) specialPrice = 10000;

      console.log(`Pesanan ID: ${row.pesanan_id}, Detail ID: ${row.detail_id}, Catatan: ${row.catatan}`);
      console.log(`  - Harga Lama: ${row.harga_lama} => Harga Baru: ${specialPrice}`);

      if (!isDryRun && Number(row.harga_lama) !== specialPrice) {
        await conn.query('UPDATE detail_pesanan SET harga = ? WHERE id = ?', [specialPrice, row.detail_id]);
        updatedPesananIds.add(row.pesanan_id);
      }
    }

    if (!isDryRun && updatedPesananIds.size > 0) {
      console.log('\\nMenghitung ulang total pesanan...');
      for (const pid of updatedPesananIds) {
        const [pesananInfo] = await conn.query('SELECT discount_value, point_used FROM pesanan WHERE id = ?', [pid]);
        if (pesananInfo.length === 0) continue;

        const discount = Number(pesananInfo[0].discount_value) || 0;
        const point = Number(pesananInfo[0].point_used) || 0;

        const [details] = await conn.query('SELECT SUM(harga * qty) as subtotal FROM detail_pesanan WHERE pesanan_id = ? AND status != "batal"', [pid]);
        const subtotal = Number(details[0].subtotal) || 0;
        
        const newTotal = Math.max(0, subtotal - discount - point);
        
        await conn.query('UPDATE pesanan SET total = ? WHERE id = ?', [newTotal, pid]);
        console.log(`Pesanan ID ${pid} total diperbarui menjadi ${newTotal}`);
      }
      console.log('\nPerbaikan harga promo spin pada orderan berlangsung selesai!');
    } else {
      if (isDryRun) {
        console.log('\nJalankan kembali script ini TANPA argumen "dry-run" untuk menerapkan perubahan.');
      } else {
        console.log('\nTidak ada perubahan yang diperlukan.');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await conn.end();
  }
}

fixSpinPrices();
