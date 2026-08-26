const db = require('./src/config/database');

async function fixSpecificOrders() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const targetIds = [1876, 1877];
    console.log(`Mencari pesanan spesifik: ${targetIds.join(', ')}`);
    
    // Dry run (SELECT)
    const [orders] = await conn.query(`
      SELECT p.id, p.total, p.created_at, p.status, p.payment_status, p.member_id 
      FROM pesanan p
      WHERE p.id IN (?)
    `, [targetIds]);

    if (orders.length === 0) {
      console.log("Pesanan tidak ditemukan.");
      return;
    }

    console.log("Pesanan yang ditemukan:");
    console.table(orders);
    
    for (const p of orders) {
       // Cek apakah pembayaran sudah ada
       const [payments] = await conn.query('SELECT id FROM pembayaran WHERE pesanan_id = ?', [p.id]);
       
       if (payments.length === 0) {
         console.log(`Menambahkan pembayaran untuk pesanan #${p.id}...`);
         await conn.query(
           `INSERT INTO pembayaran (pesanan_id, metode, jumlah, status, created_at) VALUES (?, 'tunai', ?, 'sukses', ?)`,
           [p.id, p.total, p.created_at]
         );
       } else {
         console.log(`Pesanan #${p.id} sudah memiliki data pembayaran.`);
       }
       
       console.log(`Mengupdate status pesanan #${p.id} menjadi selesai dan paid...`);
       await conn.query(
         `UPDATE pesanan SET payment_status = 'paid', is_open_bill = 0, status = 'selesai' WHERE id = ?`,
         [p.id]
       );
       
       await conn.query(
         `UPDATE detail_pesanan SET status = 'selesai' WHERE pesanan_id = ?`,
         [p.id]
       );

       if (p.member_id) {
         const [memberCheck] = await conn.query('SELECT point_earned FROM pesanan WHERE id = ?', [p.id]);
         if (memberCheck.length > 0 && memberCheck[0].point_earned === 0) {
            const pointsEarned = Math.floor(p.total / 100);
            if (pointsEarned > 0) {
              await conn.query('UPDATE members SET point = point + ? WHERE id = ?', [pointsEarned, p.member_id]);
              await conn.query('INSERT INTO member_points_history (member_id, pesanan_id, tipe, jumlah_poin) VALUES (?, ?, "earn", ?)', [p.member_id, p.id, pointsEarned]);
              await conn.query('UPDATE pesanan SET point_earned = ? WHERE id = ?', [pointsEarned, p.id]);
              console.log(`🎁 Poin member ditambahkan: +${pointsEarned} poin untuk member #${p.member_id}`);
            }
         }
       }

       console.log(`✅ Pesanan #${p.id} berhasil diperbaiki.`);
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

fixSpecificOrders();
