const db = require('../config/database');

exports.getKategori = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kategori ORDER BY urutan');
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.getMenu = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, k.nama as kategori_nama 
      FROM menu m 
      LEFT JOIN kategori k ON m.kategori_id = k.id
      ORDER BY k.urutan, m.nama
    `);
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.tambahMenu = async (req, res) => {
  try {
    const { kategori_id, nama, deskripsi, harga } = req.body;
    let gambar = '';

    if (!nama || !harga || !kategori_id) {
      return res.status(400).json({ message: 'Nama, harga, dan kategori wajib diisi' });
    }

    if (isNaN(harga) || Number(harga) < 0) {
      return res.status(400).json({ message: 'Harga tidak valid' });
    }
    
    console.log('📝 Tambah menu request:', { nama, harga, kategori_id });
    console.log('📂 File received:', req.file ? { name: req.file.filename, size: req.file.size } : 'No file');
    
    if (req.file) {
      gambar = `/uploads/${req.file.filename}`;
      console.log('✅ Gambar path:', gambar);
    }
    
    const [result] = await db.query(
      'INSERT INTO menu (kategori_id, nama, deskripsi, harga, gambar) VALUES (?, ?, ?, ?, ?)',
      [kategori_id, nama, deskripsi, harga, gambar]
    );
    
    // Emit real-time event
    const io = req.app.get('io');
    const [menuBaru] = await db.query(
      'SELECT m.*, k.nama as kategori_nama FROM menu m LEFT JOIN kategori k ON m.kategori_id = k.id WHERE m.id = ?',
      [result.insertId]
    );
    io.emit('menuAdded', menuBaru[0]);
    
    res.status(201).json({ message: 'Menu ditambahkan', id: result.insertId });
  } catch (err) {
    console.error('❌ Error tambah menu:', err.message);
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { kategori_id, nama, deskripsi, harga, tersedia } = req.body;
    let gambar = req.body.gambar; // Keep existing if no new file
    
    if (req.file) {
      gambar = `/uploads/${req.file.filename}`;
    }
    
    await db.query(
      'UPDATE menu SET kategori_id=?, nama=?, deskripsi=?, harga=?, gambar=?, tersedia=? WHERE id=?',
      [kategori_id, nama, deskripsi, harga, gambar, tersedia, id]
    );
    
    // Emit real-time event
    const io = req.app.get('io');
    const [menuUpdated] = await db.query(
      'SELECT m.*, k.nama as kategori_nama FROM menu m LEFT JOIN kategori k ON m.kategori_id = k.id WHERE m.id = ?',
      [id]
    );
    io.emit('menuUpdated', menuUpdated[0]);
    
    res.json({ message: 'Menu diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.hapusMenu = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM menu WHERE id = ?', [id]);
    
    // Emit real-time event
    const io = req.app.get('io');
    io.emit('menuDeleted', { id: parseInt(id) });
    
    res.json({ message: 'Menu dihapus' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};