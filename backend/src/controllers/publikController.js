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

    const [promos] = await db.query(`
      SELECT pm.menu_id, p.id, p.nama, p.tipe_promo, p.nilai_promo, p.mulai_jam, p.selesai_jam, p.hari
      FROM promosi_menu pm
      JOIN promosi p ON pm.promosi_id = p.id
    `);
    const promoMap = {};
    for (const p of promos) {
      if (!promoMap[p.menu_id]) promoMap[p.menu_id] = [];
      promoMap[p.menu_id].push({
        id: p.id,
        nama: p.nama,
        tipe_promo: p.tipe_promo,
        nilai_promo: Number(p.nilai_promo),
        mulai_jam: p.mulai_jam,
        selesai_jam: p.selesai_jam,
        hari: p.hari
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
        variants: mappedVariants,
        promosi: promoMap[m.id] || []
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

// POST /api/publik/pesanan - customer places order (DISABLED - Look Only)
exports.buatPesananPublik = async (req, res) => {
  return res.status(403).json({
    message: 'Fitur pemesanan mandiri dinonaktifkan. Silakan melakukan pemesanan langsung melalui kasir.'
  });
};

// POST /api/publik/pesanan/:id/bukti - customer uploads payment proof (DISABLED - Look Only)
exports.uploadBukti = async (req, res) => {
  return res.status(403).json({
    message: 'Fitur pemesanan mandiri dinonaktifkan. Silakan melakukan pemesanan langsung melalui kasir.'
  });
};

exports.recordVisit = async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const today = new Date().toISOString().split('T')[0];
    
    // Log visit to public_menu_visits
    await db.query(
      'INSERT INTO public_menu_visits (tanggal, ip_address) VALUES (?, ?)',
      [today, ip]
    );
    
    return res.status(200).json({ success: true, message: 'Visit recorded' });
  } catch (err) {
    console.error('Error logging visit:', err);
    // Return 200 anyway so client logic doesn't crash on DB issues
    return res.status(200).json({ success: false, message: err.message });
  }
};
