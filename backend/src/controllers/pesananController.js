const db = require('../config/database');

exports.buatPesanan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { meja_id, tipe, catatan, items } = req.body;
    const kasir_id = req.user?.id || null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items pesanan wajib diisi' });
    }

    // Hitung total dari DB
    let totalBaru = 0;
    const validatedItems = [];
    for (const item of items) {
      const [menu] = await conn.query('SELECT harga FROM menu WHERE id = ?', [item.menu_id]);
      if (menu.length > 0) {
        totalBaru += menu[0].harga * item.qty;
        validatedItems.push({ ...item, harga: menu[0].harga });
      }
    }

    let pesanan_id;
    let total = 0;

    // Lock meja row to prevent race condition
    if (meja_id) {
      await conn.query('SELECT id FROM meja WHERE id = ? FOR UPDATE', [meja_id]);
    }

    // Cek Open Bill
    const [openBill] = await conn.query(
      "SELECT id, total FROM pesanan WHERE meja_id = ? AND is_open_bill = 1 AND status != 'selesai' AND status != 'batal' LIMIT 1",
      [meja_id]
    );

    if (openBill.length > 0) {
      pesanan_id = openBill[0].id;
      total = parseFloat(openBill[0].total) + totalBaru;
      
      await conn.query('UPDATE pesanan SET total = ? WHERE id = ?', [total, pesanan_id]);
      
      for (const item of validatedItems) {
        await conn.query(
          'INSERT INTO detail_pesanan (pesanan_id, menu_id, qty, harga, catatan) VALUES (?, ?, ?, ?, ?)',
          [pesanan_id, item.menu_id, item.qty, item.harga, item.catatan || null]
        );
      }
    } else {
      total = totalBaru;
      const [result] = await conn.query(
        'INSERT INTO pesanan (meja_id, kasir_id, tipe, catatan, total) VALUES (?, ?, ?, ?, ?)',
        [meja_id, kasir_id, tipe, catatan, total]
      );
      pesanan_id = result.insertId;

      for (const item of validatedItems) {
        await conn.query(
          'INSERT INTO detail_pesanan (pesanan_id, menu_id, qty, harga, catatan) VALUES (?, ?, ?, ?, ?)',
          [pesanan_id, item.menu_id, item.qty, item.harga, item.catatan || null]
        );
      }

      if (meja_id) {
        await conn.query('UPDATE meja SET status = "terisi" WHERE id = ?', [meja_id]);
      }
    }

    await conn.commit();

    const io = req.app.get('io');
    if (io) {
      io.emit('pesanan_baru', { pesanan_id, meja_id, total });
      if (meja_id && openBill.length === 0) {
        io.emit('status_meja', { meja_id, status: 'terisi' });
      }
    }

    res.status(201).json({ message: 'Pesanan dibuat/diperbarui', pesanan_id, total });
  } catch (err) {
    await conn.rollback();
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.buatReservasi = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { meja_id, nama_pelanggan, dp_amount } = req.body;
    const kasir_id = req.user?.id || null;

    if (!meja_id || !nama_pelanggan) {
      return res.status(400).json({ message: 'Meja dan nama pelanggan wajib diisi' });
    }

    const [result] = await conn.query(
      'INSERT INTO pesanan (meja_id, kasir_id, tipe, catatan, total, is_open_bill, dp_amount, nama_pelanggan) VALUES (?, ?, "dine-in", "", 0, true, ?, ?)',
      [meja_id, kasir_id, dp_amount || 0, nama_pelanggan]
    );

    await conn.query('UPDATE meja SET status = "reservasi" WHERE id = ?', [meja_id]);

    await conn.commit();

    const io = req.app.get('io');
    if (io) {
      io.emit('status_meja', { meja_id, status: 'reservasi' });
      io.emit('pesanan_baru', { pesanan_id: result.insertId, meja_id, total: 0 });
    }

    res.status(201).json({ message: 'Reservasi berhasil dibuat', pesanan_id: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err); res.status(500).json({ message: 'Server error' });
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
      WHERE p.status NOT IN ('selesai', 'batal')
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
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ['pending', 'diproses', 'selesai', 'batal'];
    if (!status || !allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    await db.query('UPDATE pesanan SET status = ? WHERE id = ?', [status, id]);

    const io = req.app.get('io');

    // Kalau selesai, kosongkan meja
    if (status === 'selesai') {
      const [pesanan] = await db.query('SELECT meja_id FROM pesanan WHERE id = ?', [id]);
      if (pesanan[0].meja_id) {
        await db.query('UPDATE meja SET status = "kosong" WHERE id = ?', [pesanan[0].meja_id]);
        if (io) io.emit('status_meja', { meja_id: pesanan[0].meja_id, status: 'kosong' });
      }
    }

    // Emit socket
    if (io) {
      io.emit('status_pesanan', { pesanan_id: id, status });
    }

    res.json({ message: 'Status diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatusDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ['pending', 'diproses', 'selesai'];
    if (!status || !allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    await db.query('UPDATE detail_pesanan SET status = ? WHERE id = ?', [status, id]);

    const [detail] = await db.query('SELECT pesanan_id FROM detail_pesanan WHERE id = ?', [id]);
    const pesanan_id = detail[0].pesanan_id;
    
    // Auto-update pesanan status: if any item diproses → pesanan diproses
    if (status === 'diproses') {
      await db.query("UPDATE pesanan SET status = 'diproses' WHERE id = ? AND status = 'pending'", [pesanan_id]);
    }

    // Auto-complete: if ALL items selesai → pesanan selesai + kosongkan meja
    if (status === 'selesai') {
      const [remaining] = await db.query(
        "SELECT COUNT(*) as cnt FROM detail_pesanan WHERE pesanan_id = ? AND status != 'selesai'",
        [pesanan_id]
      );
      if (remaining[0].cnt === 0) {
        await db.query("UPDATE pesanan SET status = 'selesai' WHERE id = ?", [pesanan_id]);
        const [pRow] = await db.query('SELECT meja_id FROM pesanan WHERE id = ?', [pesanan_id]);
        if (pRow[0].meja_id) {
          await db.query('UPDATE meja SET status = "kosong" WHERE id = ?', [pRow[0].meja_id]);
          const io2 = req.app.get('io');
          if (io2) io2.emit('status_meja', { meja_id: pRow[0].meja_id, status: 'kosong' });
        }
      }
    }

    // Emit socket ke dapur
    const io = req.app.get('io');
    if (io) {
      io.emit('status_item', { detail_id: id, pesanan_id, status });
      if (status === 'selesai') io.emit('status_pesanan', { pesanan_id, status: 'selesai' });
    }

    res.json({ message: 'Status item diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateDetailCatatan = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan } = req.body;

    if (catatan === undefined || catatan === null) {
      return res.status(400).json({ message: 'Catatan tidak valid' });
    }

    const catatanValue = String(catatan).trim() || null;

    await db.query('UPDATE detail_pesanan SET catatan = ? WHERE id = ?', [catatanValue, id]);

    const [detail] = await db.query('SELECT pesanan_id FROM detail_pesanan WHERE id = ?', [id]);
    
    // Emit socket
    const io = req.app.get('io');
    if (io) {
      io.emit('catatan_item', { detail_id: id, pesanan_id: detail[0].pesanan_id, catatan: catatanValue });
    }

    res.json({ message: 'Catatan item diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};