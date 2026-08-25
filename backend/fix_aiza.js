const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAiza() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warkop1001cc'
  });

  try {
    // 1. Cari pesanan atas nama Aiza hari ini
    const [pesanan] = await conn.query("SELECT id, total FROM pesanan WHERE nama_pelanggan = 'Aiza' AND DATE(created_at) = '2026-08-07'");
    
    if (pesanan.length === 0) {
      console.log('Pesanan Aiza tidak ditemukan pada tanggal ini.');
      return;
    }

    const pid = pesanan[0].id;
    console.log(`Ditemukan Pesanan ID: ${pid} dengan Total Lama: ${pesanan[0].total}`);

    // 2. Update Total Pesanan & Pembayaran menjadi 132000
    await conn.query("UPDATE pesanan SET total = 132000 WHERE id = ?", [pid]);
    console.log(`=> Pesanan total diubah menjadi 132000`);

    await conn.query("UPDATE pembayaran SET jumlah = 132000 WHERE pesanan_id = ?", [pid]);
    console.log(`=> Jumlah pembayaran diubah menjadi 132000`);

    // 3. Sinkronisasi harga item di detail_pesanan agar laporan per menu juga akurat
    const [details] = await conn.query("SELECT id, harga, catatan FROM detail_pesanan WHERE pesanan_id = ? AND catatan LIKE '%Hadiah Spin Wheel%'", [pid]);
    
    if (details.length > 0) {
      for (const d of details) {
        const p = (d.catatan || '').toLowerCase();
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
        
        await conn.query("UPDATE detail_pesanan SET harga = ? WHERE id = ?", [specialPrice, d.id]);
        console.log(`=> Harga detail item spin (ID: ${d.id}) dikoreksi dari ${d.harga} menjadi ${specialPrice}`);
      }
    } else {
      // Jika pesanan dibuat secara offline dan catatan spin tidak tersimpan
      // Kurangi selisihnya (8000) dari salah satu item agar Laporan sinkron
      const [allDetails] = await conn.query("SELECT id, harga FROM detail_pesanan WHERE pesanan_id = ? LIMIT 1", [pid]);
      if (allDetails.length > 0) {
        await conn.query("UPDATE detail_pesanan SET harga = harga - 8000 WHERE id = ?", [allDetails[0].id]);
        console.log(`=> Harga item pertama (ID: ${allDetails[0].id}) dikurangi Rp 8.000 agar sinkron dengan total baru (132.000).`);
      }
    }

    console.log('\n✅ Perbaikan selesai untuk pesanan Aiza! Silakan cek Laporan.');
  } catch (err) {
    console.error('Error saat melakukan perbaikan:', err);
  } finally {
    await conn.end();
  }
}

fixAiza();
