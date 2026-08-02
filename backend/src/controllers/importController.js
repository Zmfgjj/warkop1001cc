const db = require('../config/database');

exports.importPesananLama = async (req, res) => {
  const { tanggal, total, pelanggan, tipe, catatan, items } = req.body;
  if (!tanggal || !total || !items || items.length === 0) return res.status(400).json({ message: 'Tanggal, Total, dan Items wajib diisi' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO pesanan 
      (kasir_id, tipe, total, status, payment_status, is_open_bill, created_at, nama_pelanggan, catatan) 
      VALUES (?, ?, ?, 'selesai', 'paid', 0, ?, ?, ?)`,
      [req.user.id, tipe || 'dine-in', total, tanggal, pelanggan || 'Migrasi Lama', catatan || '']
    );

    const pesananId = result.insertId;

    // Insert items
    for (const item of items) {
      // Dapatkan HPP dari menu jika ada
      const [menuData] = await conn.query('SELECT hpp FROM menu WHERE id = ?', [item.menu_id]);
      const hpp = menuData.length > 0 ? menuData[0].hpp : 0;
      
      await conn.query(
        `INSERT INTO detail_pesanan (pesanan_id, menu_id, qty, harga, catatan)
         VALUES (?, ?, ?, ?, ?)`,
        [pesananId, item.menu_id, item.qty, item.harga, item.catatan || '']
      );
    }

    // Masukkan ke pembayaran
    await conn.query(
      `INSERT INTO pembayaran (pesanan_id, metode, jumlah, status, created_at)
       VALUES (?, 'tunai', ?, 'sukses', ?)`,
      [pesananId, total, tanggal]
    );

    await conn.commit();
    res.json({ message: 'Berhasil memasukkan data pesanan lama' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Gagal mengimpor pesanan' });
  } finally {
    conn.release();
  }
};
