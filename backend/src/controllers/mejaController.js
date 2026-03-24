const db = require('../config/database');

exports.getMeja = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM meja ORDER BY nomor'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStatusMeja = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query('UPDATE meja SET status = ? WHERE id = ?', [status, id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('status_meja', { meja_id: id, status });
    }

    res.json({ message: 'Status meja diupdate' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.tambahMeja = async (req, res) => {
  try {
    const { nomor } = req.body;

    const [existing] = await db.query(
      'SELECT id FROM meja WHERE nomor = ?', [nomor]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Nomor meja sudah ada' });
    }

    const [result] = await db.query(
      'INSERT INTO meja (nomor) VALUES (?)', [nomor]
    );

    res.status(201).json({ message: 'Meja ditambahkan', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.hapusMeja = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek meja sedang dipakai
    const [cek] = await db.query(
      'SELECT status FROM meja WHERE id = ?', [id]
    );
    if (cek[0].status === 'terisi') {
      return res.status(400).json({ message: 'Meja sedang terisi, tidak bisa dihapus' });
    }

    await db.query('DELETE FROM meja WHERE id = ?', [id]);
    res.json({ message: 'Meja dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.generateQR = async (req, res) => {
  try {
    const { id } = req.params;
    const [meja] = await db.query('SELECT * FROM meja WHERE id = ?', [id]);

    if (meja.length === 0) {
      return res.status(404).json({ message: 'Meja tidak ditemukan' });
    }

    const qr_url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu?meja=${meja[0].nomor}&id=${id}`;
    
    await db.query('UPDATE meja SET qr_code = ? WHERE id = ?', [qr_url, id]);

    res.json({ 
      message: 'QR Code generated',
      qr_url,
      nomor_meja: meja[0].nomor
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};