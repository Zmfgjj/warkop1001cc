const db = require('../config/database');

exports.buatPembayaran = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { pesanan_id, metode } = req.body;

    // Cek pesanan
    const [pesanan] = await conn.query(
      'SELECT * FROM pesanan WHERE id = ? AND status != "batal"',
      [pesanan_id]
    );

    if (pesanan.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    // Cek sudah dibayar belum
    const [existing] = await conn.query(
      'SELECT * FROM pembayaran WHERE pesanan_id = ? AND status = "sukses"',
      [pesanan_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Pesanan sudah dibayar' });
    }

    // Insert pembayaran
    const [result] = await conn.query(
      'INSERT INTO pembayaran (pesanan_id, metode, jumlah, status) VALUES (?, ?, ?, ?)',
      [pesanan_id, metode, pesanan[0].total, metode === 'cash' ? 'sukses' : 'pending']
    );

    // Kalau cash langsung selesai
    if (metode === 'cash') {
      await conn.query('UPDATE pesanan SET status = "selesai" WHERE id = ?', [pesanan_id]);
      if (pesanan[0].meja_id) {
        await conn.query('UPDATE meja SET status = "kosong" WHERE id = ?', [pesanan[0].meja_id]);
      }
    }

    await conn.commit();

    // Emit socket
    const io = req.app.get('io');
    if (io) {
      io.emit('pembayaran', { pesanan_id, metode, status: metode === 'cash' ? 'sukses' : 'pending' });
    }

    res.status(201).json({
      message: metode === 'cash' ? 'Pembayaran berhasil' : 'Menunggu pembayaran QRIS',
      pembayaran_id: result.insertId,
      jumlah: pesanan[0].total,
      metode
    });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
};

exports.getPembayaran = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pb.*, p.total, p.tipe, m.nomor as nomor_meja
      FROM pembayaran pb
      LEFT JOIN pesanan p ON pb.pesanan_id = p.id
      LEFT JOIN meja m ON p.meja_id = m.id
      ORDER BY pb.created_at DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.konfirmasiQris = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;

    const [pembayaran] = await conn.query(
      'SELECT * FROM pembayaran WHERE id = ? AND metode = "qris"',
      [id]
    );

    if (pembayaran.length === 0) {
      return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });
    }

    await conn.query('UPDATE pembayaran SET status = "sukses" WHERE id = ?', [id]);
    await conn.query('UPDATE pesanan SET status = "selesai" WHERE id = ?', [pembayaran[0].pesanan_id]);

    const [pesanan] = await conn.query('SELECT meja_id FROM pesanan WHERE id = ?', [pembayaran[0].pesanan_id]);
    if (pesanan[0].meja_id) {
      await conn.query('UPDATE meja SET status = "kosong" WHERE id = ?', [pesanan[0].meja_id]);
    }

    await conn.commit();

    const io = req.app.get('io');
    if (io) {
      io.emit('qris_sukses', { pembayaran_id: id, pesanan_id: pembayaran[0].pesanan_id });
    }

    res.json({ message: 'Pembayaran QRIS dikonfirmasi' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
};