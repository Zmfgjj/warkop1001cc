const db = require('../config/database');

exports.buatPesanan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { meja_id, tipe, catatan, items } = req.body;
    const kasir_id = req.user?.id || null;

    // Hitung total
    let total = 0;
    for (const item of items) {
      const [menu] = await conn.query('SELECT harga FROM menu WHERE id = ?', [item.menu_id]);
      total += menu[0].harga * item.qty;
    }

    // Insert pesanan
    const [result] = await conn.query(
      'INSERT INTO pesanan (meja_id, kasir_id, tipe, catatan, total) VALUES (?, ?, ?, ?, ?)',
      [meja_id, kasir_id, tipe, catatan, total]
    );
    const pesanan_id = result.insertId;

    // Insert detail
    for (const item of items) {
      const [menu] = await conn.query('SELECT harga FROM menu WHERE id = ?', [item.menu_id]);
      await conn.query(
        'INSERT INTO detail_pesanan (pesanan_id, menu_id, qty, harga, catatan) VALUES (?, ?, ?, ?, ?)',
        [pesanan_id, item.menu_id, item.qty, menu[0].harga, item.catatan || null]
      );
    }

    // Update status meja
    if (meja_id) {
      await conn.query('UPDATE meja SET status = "terisi" WHERE id = ?', [meja_id]);
    }

    await conn.commit();

    // Emit socket
    const io = req.app.get('io');
    if (io) {
      io.emit('pesanan_baru', { pesanan_id, meja_id, total });
    }

    res.status(201).json({ message: 'Pesanan dibuat', pesanan_id, total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
};

exports.getPesanan = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, m.nomor as nomor_meja,
        u.nama as nama_kasir
      FROM pesanan p
      LEFT JOIN meja m ON p.meja_id = m.id
      LEFT JOIN users u ON p.kasir_id = u.id
      WHERE p.status != 'selesai'
      ORDER BY p.created_at DESC
    `);

    for (const pesanan of rows) {
      const [detail] = await db.query(`
        SELECT dp.*, mn.nama as nama_menu
        FROM detail_pesanan dp
        LEFT JOIN menu mn ON dp.menu_id = mn.id
        WHERE dp.pesanan_id = ?
      `, [pesanan.id]);
      pesanan.items = detail;
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query('UPDATE pesanan SET status = ? WHERE id = ?', [status, id]);

    // Kalau selesai, kosongkan meja
    if (status === 'selesai') {
      const [pesanan] = await db.query('SELECT meja_id FROM pesanan WHERE id = ?', [id]);
      if (pesanan[0].meja_id) {
        await db.query('UPDATE meja SET status = "kosong" WHERE id = ?', [pesanan[0].meja_id]);
      }
    }

    // Emit socket
    const io = req.app.get('io');
    if (io) {
      io.emit('status_pesanan', { pesanan_id: id, status });
    }

    res.json({ message: 'Status diupdate' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStatusDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query('UPDATE detail_pesanan SET status = ? WHERE id = ?', [status, id]);

    const [detail] = await db.query('SELECT pesanan_id FROM detail_pesanan WHERE id = ?', [id]);
    
    // Emit socket ke dapur
    const io = req.app.get('io');
    if (io) {
      io.emit('status_item', { detail_id: id, pesanan_id: detail[0].pesanan_id, status });
    }

    res.json({ message: 'Status item diupdate' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};