const db = require('./src/config/database');

async function fixBrokenOrders() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    console.log("Mencari pesanan offline/stuck hari ini yang belum lunas...");
    
    // Cari semua pesanan hari ini yang payment_status = 'unpaid', tetapi seharusnya lunas (misal karena offline sync gagal kirim pembayaran)
    const [orders] = await conn.query(`
      SELECT p.id, p.total, p.created_at, p.status, p.payment_status 
      FROM pesanan p
      LEFT JOIN pembayaran pb ON pb.pesanan_id = p.id
      WHERE pb.id IS NULL 
        AND p.status != 'batal' 
        AND p.created_at >= CURDATE()
    `);

    if (orders.length === 0) {
      console.log("Tidak ada pesanan yang perlu diperbaiki.");
      return;
    }

    console.log(`Ditemukan ${orders.length} pesanan bermasalah. Memperbaiki...`);

    for (const p of orders) {
       // 1. Buat record pembayaran tunai
       await conn.query(
         `INSERT INTO pembayaran (pesanan_id, metode, jumlah, status, created_at) VALUES (?, 'tunai', ?, 'sukses', ?)`,
         [p.id, p.total, p.created_at]
       );
       
       // 2. Update pesanan jadi lunas dan selesai agar masuk ke Laporan (Omset)
       await conn.query(
         `UPDATE pesanan SET payment_status = 'paid', is_open_bill = 0, status = 'selesai' WHERE id = ?`,
         [p.id]
       );
       
       // 3. Update detail pesanan
       await conn.query(
         `UPDATE detail_pesanan SET status = 'selesai' WHERE pesanan_id = ?`,
         [p.id]
       );

       console.log(`✅ Pesanan #${p.id} berhasil diperbaiki (masuk omset).`);
    }

    await conn.commit();
    console.log("Proses perbaikan selesai!");
  } catch (e) {
    await conn.rollback();
    console.error("Terjadi kesalahan:", e);
  } finally {
    conn.release();
    process.exit();
  }
}

fixBrokenOrders();
