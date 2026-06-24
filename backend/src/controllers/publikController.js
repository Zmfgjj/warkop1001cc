const db = require('../config/database');

// Rate limiting store (in-memory, per IP)
const rateLimitStore = new Map();
const RATE_LIMIT = 10; // max requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

// Cleanup stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 5 * 60 * 1000);

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, resetAt: now + RATE_WINDOW };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW;
  }
  entry.count++;
  rateLimitStore.set(ip, entry);
  return entry.count <= RATE_LIMIT;
}

// Sanitize string input - strip HTML/script tags
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim().slice(0, 500);
}

// GET /api/publik/menu - list available menu items (no auth)
exports.getMenuPublik = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, k.id as kategori_id, k.nama as kategori_nama, COALESCE(k.urutan, 999) as kategori_urutan
      FROM menu m
      LEFT JOIN kategori k ON m.kategori_id = k.id
      WHERE m.tersedia = 1
      ORDER BY kategori_urutan, m.nama
    `);

    // Fetch varian
    const [variants] = await db.query('SELECT * FROM menu_varian');
    const variantMap = {};
    for (const v of variants) {
      if (!variantMap[v.menu_id]) variantMap[v.menu_id] = [];
      variantMap[v.menu_id].push({
        id: v.id,
        nama: v.nama,
        harga_tambahan: v.harga_tambahan || 0
      });
    }

    const result = rows.map(m => {
      // Map legacy pilihan_rasa to variant format if no DB variants exist
      let mappedVariants = variantMap[m.id] || [];
      if (mappedVariants.length === 0 && m.pilihan_rasa) {
        mappedVariants = m.pilihan_rasa.split(',').map((r, i) => ({
          id: `legacy_${i}`,
          nama: r.trim(),
          harga_tambahan: 0
        })).filter(r => r.nama);
      }
      return {
        ...m,
        variants: mappedVariants
      };
    });

    res.json(result);
  } catch (err) {
    console.error('publikController.getMenuPublik:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/publik/kategori - list categories
exports.getKategoriPublik = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nama FROM kategori ORDER BY urutan');
    res.json(rows);
  } catch (err) {
    console.error('publikController.getKategoriPublik:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/publik/meja/:nomor - validate meja by nomor (e.g. '011')
exports.getMejaPublik = async (req, res) => {
  try {
    const nomor = req.params.nomor;
    if (!nomor || typeof nomor !== 'string' || nomor.trim() === '' || nomor.length > 20) {
      return res.status(400).json({ message: 'Nomor meja tidak valid' });
    }

    // nomor bisa berformat '011' (string) atau '11' (angka), coba keduanya
    const [rows] = await db.query(
      'SELECT id, nomor, status FROM meja WHERE nomor = ? OR nomor = ?',
      [nomor.trim(), String(parseInt(nomor, 10))]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: `Meja nomor ${nomor} tidak ditemukan` });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('publikController.getMejaPublik:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/publik/ppn - get current PPN rate (needed for order summary)
exports.getPPNPublik = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT nilai FROM settings WHERE `key` = 'ppn' LIMIT 1");
    res.json({ ppn: rows.length > 0 ? parseFloat(rows[0].nilai) : 2 });
  } catch (err) {
    console.error('publikController.getPPNPublik:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/publik/pesanan - customer places order (no auth, rate limited)
exports.buatPesananPublik = async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ message: 'Terlalu banyak permintaan. Coba lagi sebentar.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { meja_id, nama_pelanggan, no_telepon, email, payment_method, catatan } = req.body;
    let items = req.body.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch(e) { items = []; }
    }

    // Validate inputs
    if (!meja_id || !Number.isInteger(Number(meja_id)) || Number(meja_id) <= 0) {
      return res.status(400).json({ message: 'ID meja tidak valid' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Pesanan kosong' });
    }
    if (items.length > 50) {
      return res.status(400).json({ message: 'Terlalu banyak item' });
    }

    const sanitizedNama = sanitize(nama_pelanggan || 'Tamu');
    const sanitizedNoTelp = sanitize(no_telepon || '');
    const sanitizedEmail = sanitize(email || '');
    const rawCatatan = sanitize(catatan || '');
    const sanitizedCatatan = sanitizedNama !== 'Tamu'
      ? `[${sanitizedNama}] ${rawCatatan}`.trim()
      : rawCatatan;

    const buktiPembayaran = null; // No longer used, handled via Kasir confirmation
    const paymentStatus = 'unpaid'; // All orders start as unpaid until verified by cashier

    // Validate meja exists and lock the row to prevent race condition double-orders
    const [mejaRows] = await conn.query('SELECT id FROM meja WHERE id = ? FOR UPDATE', [Number(meja_id)]);
    if (mejaRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Meja tidak ditemukan' });
    }

    // Validate and calculate total from DB prices (never trust client-side price)
    let total = 0;
    const validatedItems = [];
    for (const item of items) {
      const menuId = parseInt(item.menu_id, 10);
      const qty = parseInt(item.qty, 10);

      if (!menuId || menuId <= 0 || !qty || qty <= 0 || qty > 99) {
        await conn.rollback();
        return res.status(400).json({ message: 'Data item tidak valid' });
      }

      const [menuRows] = await conn.query(
        'SELECT id, harga FROM menu WHERE id = ? AND tersedia = 1',
        [menuId]
      );
      if (menuRows.length === 0) {
        await conn.rollback();
        return res.status(400).json({ message: `Menu ID ${menuId} tidak tersedia` });
      }

      let itemHarga = menuRows[0].harga;

      if (item.varian_nama) {
        const [varianRows] = await conn.query(
          'SELECT harga_tambahan FROM menu_varian WHERE menu_id = ? AND nama = ?',
          [menuId, item.varian_nama]
        );
        if (varianRows.length > 0) {
          itemHarga += varianRows[0].harga_tambahan;
        }
      }

      const itemCatatan = sanitize(item.catatan || '');
      total += itemHarga * qty;
      validatedItems.push({ menu_id: menuId, qty, harga: itemHarga, catatan: itemCatatan });
    }

    // Check Open Bill
    const [openBill] = await conn.query(
      "SELECT id, total FROM pesanan WHERE meja_id = ? AND is_open_bill = 1 AND status != 'selesai' AND status != 'batal' LIMIT 1",
      [Number(meja_id)]
    );

    let pesanan_id;
    let finalTotal = 0;

    if (openBill.length > 0) {
      pesanan_id = openBill[0].id;
      finalTotal = parseFloat(openBill[0].total) + total;
      
      // Update pesanan total
      await conn.query(
        'UPDATE pesanan SET total = ?, nama_pelanggan = IFNULL(nama_pelanggan, ?), no_telepon = IFNULL(no_telepon, ?), email = IFNULL(email, ?), bukti_pembayaran = IFNULL(bukti_pembayaran, ?), payment_status = ? WHERE id = ?', 
        [finalTotal, sanitizedNama, sanitizedNoTelp, sanitizedEmail, buktiPembayaran, paymentStatus, pesanan_id]
      );
      
      // Insert detail
      for (const item of validatedItems) {
        await conn.query(
          'INSERT INTO detail_pesanan (pesanan_id, menu_id, qty, harga, catatan) VALUES (?, ?, ?, ?, ?)',
          [pesanan_id, item.menu_id, item.qty, item.harga, item.catatan || null]
        );
      }
    } else {
      finalTotal = total;
      // Insert pesanan (kasir_id = null for web orders, tipe = 'dine-in' for table orders)
      const [result] = await conn.query(
        'INSERT INTO pesanan (meja_id, kasir_id, tipe, catatan, total, nama_pelanggan, no_telepon, email, bukti_pembayaran, payment_status) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)',
        [Number(meja_id), 'dine-in', sanitizedCatatan, finalTotal, sanitizedNama, sanitizedNoTelp, sanitizedEmail, buktiPembayaran, paymentStatus]
      );
      pesanan_id = result.insertId;

      // Insert detail
      for (const item of validatedItems) {
        await conn.query(
          'INSERT INTO detail_pesanan (pesanan_id, menu_id, qty, harga, catatan) VALUES (?, ?, ?, ?, ?)',
          [pesanan_id, item.menu_id, item.qty, item.harga, item.catatan || null]
        );
      }

      // Update meja status
      await conn.query('UPDATE meja SET status = "terisi" WHERE id = ?', [Number(meja_id)]);
    }

    await conn.commit();

    // Emit socket events to KDS and ManajemenMeja
    const io = req.app.get('io');
    if (io) {
      io.emit('pesanan_baru', { pesanan_id, meja_id: Number(meja_id), total: finalTotal, sumber: 'web' });
      if (openBill.length === 0) {
        io.emit('status_meja', { meja_id: Number(meja_id), status: 'terisi' });
      }
    }

    res.status(201).json({
      message: 'Pesanan berhasil dikirim ke dapur!',
      pesanan_id,
      total: finalTotal
    });
  } catch (err) {
    await conn.rollback();
    console.error('publikController.buatPesananPublik:', err.message);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.uploadBukti = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Gambar bukti pembayaran belum diupload' });
    }

    const buktiPembayaran = `/uploads/${req.file.filename}`;

    await db.query(
      "UPDATE pesanan SET bukti_pembayaran = ?, payment_status = 'pending_verification' WHERE id = ?",
      [buktiPembayaran, id]
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('pesanan_baru', { pesanan_id: id, total: 0 }); // trigger dashboard refresh
    }

    res.json({ message: 'Bukti pembayaran berhasil diupload' });
  } catch (err) {
    console.error(err); 
    res.status(500).json({ message: 'Server error saat upload bukti' });
  }
};
