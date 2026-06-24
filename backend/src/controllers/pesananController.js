const db = require('../config/database');

async function getNomorAntrean(conn, isOffline) {
  // Lock settings
  await conn.query('SELECT id FROM settings FOR UPDATE');
  
  const [rows] = await conn.query('SELECT `key`, nilai FROM settings WHERE `key` IN ("queue_date", "queue_online", "queue_offline")');
  const settings = {};
  for (const r of rows) settings[r.key] = r.nilai;
  
  const d = new Date();
  const todayStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

  if (settings.queue_date !== todayStr) {
    settings.queue_date = todayStr;
    settings.queue_online = '0';
    settings.queue_offline = '30';
    await conn.query('UPDATE settings SET nilai = ? WHERE `key` = "queue_date"', [todayStr]);
    await conn.query('UPDATE settings SET nilai = "0" WHERE `key` = "queue_online"');
    await conn.query('UPDATE settings SET nilai = "30" WHERE `key` = "queue_offline"');
  }

  let nextNo = 0;
  if (isOffline) {
    nextNo = parseInt(settings.queue_offline || '30') + 1;
    await conn.query('UPDATE settings SET nilai = ? WHERE `key` = "queue_offline"', [nextNo]);
  } else {
    nextNo = parseInt(settings.queue_online || '0') + 1;
    if (nextNo > 30) nextNo = 1; // loop back to 1 if it exceeds 30
    await conn.query('UPDATE settings SET nilai = ? WHERE `key` = "queue_online"', [nextNo]);
  }
  return nextNo;
}


exports.buatPesanan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { meja_id, tipe, catatan, items, is_offline_sync, pembayaran } = req.body;
    const kasir_id = req.user?.id || null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items pesanan wajib diisi' });
    }

    // Hitung total dari DB dan ambil nama menu + kategori untuk keperluan print struk dapur di KDS
    let totalBaru = 0;
    const validatedItems = [];
    for (const item of items) {
      const [menu] = await conn.query(
        `SELECT m.harga, m.nama, k.nama as kategori_nama 
         FROM menu m 
         LEFT JOIN kategori k ON m.kategori_id = k.id 
         WHERE m.id = ?`,
        [item.menu_id]
      );
      if (menu.length > 0) {
        totalBaru += menu[0].harga * item.qty;
        validatedItems.push({ 
          ...item, 
          harga: menu[0].harga,
          nama_menu: menu[0].nama,
          kategori_nama: menu[0].kategori_nama
        });
      }
    }

    let pesanan_id;
    let total = 0;

    // Lock meja row to prevent race condition
    if (meja_id) {
      await conn.query('SELECT id FROM meja WHERE id = ? FOR UPDATE', [meja_id]);
    }

    // Cek Open Bill (Bypass jika ini pesanan sinkronisasi offline)
    const [openBill] = is_offline_sync ? [[]] : await conn.query(
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
      const isOffline = kasir_id !== null;
      const nomor_antrean = await getNomorAntrean(conn, isOffline);

      // Jika sync offline, status langsung 'selesai' dan payment_status 'paid'
      const statusValue = is_offline_sync ? 'selesai' : 'pending';
      const paymentStatusValue = is_offline_sync ? 'paid' : 'unpaid';

      const [result] = await conn.query(
        'INSERT INTO pesanan (meja_id, kasir_id, tipe, catatan, total, nomor_antrean, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [meja_id, kasir_id, tipe, catatan, total, nomor_antrean, statusValue, paymentStatusValue]
      );
      pesanan_id = result.insertId;

      const itemStatusValue = is_offline_sync ? 'selesai' : 'pending';
      for (const item of validatedItems) {
        await conn.query(
          'INSERT INTO detail_pesanan (pesanan_id, menu_id, qty, harga, catatan, status) VALUES (?, ?, ?, ?, ?, ?)',
          [pesanan_id, item.menu_id, item.qty, item.harga, item.catatan || null, itemStatusValue]
        );
      }

      // Jika sync offline, simpan pembayaran secara otomatis
      if (is_offline_sync && pembayaran) {
        await conn.query(
          'INSERT INTO pembayaran (pesanan_id, metode, jumlah, status) VALUES (?, ?, ?, "sukses")',
          [pesanan_id, pembayaran.metode || 'tunai', pembayaran.jumlah || total]
        );
      }

      if (meja_id && !is_offline_sync) {
        await conn.query('UPDATE meja SET status = "terisi" WHERE id = ?', [meja_id]);
      }
    }

    await conn.commit();

    const io = req.app.get('io');
    if (io) {
      if (is_offline_sync) {
        // Ambil nama kasir untuk data struk
        let namaKasir = 'Kasir';
        if (kasir_id) {
          const [u] = await db.query('SELECT nama FROM users WHERE id = ?', [kasir_id]);
          if (u.length > 0) namaKasir = u[0].nama;
        }

        // Ambil nomor meja jika ada
        let nomorMeja = null;
        if (meja_id) {
          const [m] = await db.query('SELECT nomor FROM meja WHERE id = ?', [meja_id]);
          if (m.length > 0) nomorMeja = m[0].nomor;
        }

        io.emit('pesanan_offline_sync', {
          id: pesanan_id,
          meja_id,
          nomor_meja: nomorMeja,
          tipe,
          catatan,
          total,
          nomor_antrean,
          created_at: new Date(),
          nama_kasir: namaKasir,
          items: validatedItems
        });
      } else {
        io.emit('pesanan_baru', { pesanan_id, meja_id, total });
        if (meja_id && openBill.length === 0) {
          io.emit('status_meja', { meja_id, status: 'terisi' });
        }
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

    const nomor_antrean = await getNomorAntrean(conn, true); // Reservasi is always offline/kasir

    const [result] = await conn.query(
      'INSERT INTO pesanan (meja_id, kasir_id, tipe, catatan, total, is_open_bill, dp_amount, nama_pelanggan, nomor_antrean) VALUES (?, ?, "dine-in", "", 0, true, ?, ?, ?)',
      [meja_id, kasir_id, dp_amount || 0, nama_pelanggan, nomor_antrean]
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

    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      const [allDetails] = await db.query(`
        SELECT dp.*, mn.nama as nama_menu, k.nama as kategori_nama
        FROM detail_pesanan dp
        LEFT JOIN menu mn ON dp.menu_id = mn.id
        LEFT JOIN kategori k ON mn.kategori_id = k.id
        WHERE dp.pesanan_id IN (?)
      `, [ids]);

      const detailMap = {};
      for (const d of allDetails) {
        if (!detailMap[d.pesanan_id]) detailMap[d.pesanan_id] = [];
        detailMap[d.pesanan_id].push(d);
      }
      for (const pesanan of rows) {
        pesanan.items = detailMap[pesanan.id] || [];
      }
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

    if (status === 'selesai' || status === 'diproses') {
      await db.query('UPDATE detail_pesanan SET status = ? WHERE pesanan_id = ? AND status != ?', [status, id, status]);
    }

    const io = req.app.get('io');

    // (Fitur otomatis mengosongkan meja dihapus berdasarkan request agar tidak bertabrakan dengan realitas lapangan)
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

    // Auto-complete: if ALL items selesai → pesanan selesai
    if (status === 'selesai') {
      const [remaining] = await db.query(
        "SELECT COUNT(*) as cnt FROM detail_pesanan WHERE pesanan_id = ? AND status != 'selesai'",
        [pesanan_id]
      );
      if (remaining[0].cnt === 0) {
        await db.query("UPDATE pesanan SET status = 'selesai' WHERE id = ?", [pesanan_id]);
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

exports.konfirmasiPembayaran = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { status } = req.body; // 'paid' or 'unpaid'
    
    if (status === 'paid') {
      await conn.query("UPDATE pesanan SET payment_status = 'paid' WHERE id = ?", [id]);
      const [p] = await conn.query("SELECT total FROM pesanan WHERE id = ?", [id]);
      
      // Check if pembayaran already exists
      const [ex] = await conn.query("SELECT id FROM pembayaran WHERE pesanan_id = ?", [id]);
      if (ex.length === 0 && p.length > 0) {
        await conn.query("INSERT INTO pembayaran (pesanan_id, metode, jumlah, status) VALUES (?, 'qris', ?, 'sukses')", [id, p[0].total]);
      }
    } else {
      await conn.query("UPDATE pesanan SET payment_status = 'unpaid', bukti_pembayaran = NULL WHERE id = ?", [id]);
    }
    
    const io = req.app.get('io');
    if (io) {
      io.emit('pembayaran', { pesanan_id: id, status });
    }

    res.json({ message: 'Status pembayaran diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.hapusPesanan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    const [pesanan] = await conn.query('SELECT meja_id FROM pesanan WHERE id = ?', [id]);
    if (pesanan.length > 0 && pesanan[0].meja_id) {
      await conn.query("UPDATE meja SET status = 'tersedia' WHERE id = ?", [pesanan[0].meja_id]);
    }

    await conn.query('DELETE FROM detail_pesanan WHERE pesanan_id = ?', [id]);
    await conn.query('DELETE FROM pembayaran WHERE pesanan_id = ?', [id]);
    await conn.query('DELETE FROM pesanan WHERE id = ?', [id]);

    await conn.commit();
    
    const io = req.app.get('io');
    if (io) {
      io.emit('status_pesanan', { pesanan_id: id, status: 'batal' });
      io.emit('mejaUpdated');
      io.emit('pesanan_baru', { pesanan_id: id });
    }

    res.json({ message: 'Pesanan berhasil dihapus' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};