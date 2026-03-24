const db = require('../config/database');

exports.getKategori = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kategori ORDER BY urutan');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.tambahMenu = async (req, res) => {
  try {
    const { kategori_id, nama, deskripsi, harga, gambar } = req.body;
    const [result] = await db.query(
      'INSERT INTO menu (kategori_id, nama, deskripsi, harga, gambar) VALUES (?, ?, ?, ?, ?)',
      [kategori_id, nama, deskripsi, harga, gambar]
    );
    res.status(201).json({ message: 'Menu ditambahkan', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { kategori_id, nama, deskripsi, harga, gambar, tersedia } = req.body;
    await db.query(
      'UPDATE menu SET kategori_id=?, nama=?, deskripsi=?, harga=?, gambar=?, tersedia=? WHERE id=?',
      [kategori_id, nama, deskripsi, harga, gambar, tersedia, id]
    );
    res.json({ message: 'Menu diupdate' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.hapusMenu = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM menu WHERE id = ?', [id]);
    res.json({ message: 'Menu dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};