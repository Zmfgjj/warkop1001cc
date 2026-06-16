const db = require('../config/database');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

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
    const { kategori_id, nama, deskripsi, harga, hpp, pilihan_rasa } = req.body;
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
      const webpFilename = `${req.file.filename.split('.')[0]}.webp`;
      const webpPath = path.join(req.file.destination, webpFilename);
      
      await sharp(req.file.path)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpPath);
        
      // Delete original file
      if (req.file.path !== webpPath) {
        fs.unlinkSync(req.file.path);
      }
      
      gambar = `/uploads/${webpFilename}`;
      console.log('✅ Gambar path:', gambar);
    }
    
    const [result] = await db.query(
      'INSERT INTO menu (kategori_id, nama, deskripsi, harga, hpp, gambar, pilihan_rasa) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [kategori_id, nama, deskripsi, harga, hpp || 0, gambar, pilihan_rasa || null]
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
    const { kategori_id, nama, deskripsi, harga, hpp, tersedia, pilihan_rasa } = req.body;
    let gambar = req.body.gambar; // Keep existing if no new file

    if (!nama || !harga || !kategori_id) {
      return res.status(400).json({ message: 'Nama, harga, dan kategori wajib diisi' });
    }

    if (isNaN(harga) || Number(harga) < 0) {
      return res.status(400).json({ message: 'Harga tidak valid' });
    }
    
    if (req.file) {
      const webpFilename = `${req.file.filename.split('.')[0]}.webp`;
      const webpPath = path.join(req.file.destination, webpFilename);
      
      await sharp(req.file.path)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpPath);
        
      // Delete original file
      if (req.file.path !== webpPath) {
        fs.unlinkSync(req.file.path);
      }
      
      gambar = `/uploads/${webpFilename}`;
    }
    
    await db.query(
      'UPDATE menu SET kategori_id=?, nama=?, deskripsi=?, harga=?, hpp=?, gambar=?, tersedia=?, pilihan_rasa=? WHERE id=?',
      [kategori_id, nama, deskripsi, harga, hpp || 0, gambar, tersedia, pilihan_rasa || null, id]
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
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ message: 'Menu tidak bisa dihapus karena sudah tercatat di riwayat pesanan. Silakan Edit menu ini dan jadikan "Tidak Tersedia".' });
    }
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};