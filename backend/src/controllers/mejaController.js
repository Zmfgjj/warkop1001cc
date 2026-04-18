const db = require('../config/database');

exports.getMeja = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM meja ORDER BY nomor'
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatusMeja = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ['kosong', 'terisi'];
    if (!status || !allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    await db.query('UPDATE meja SET status = ? WHERE id = ?', [status, id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('status_meja', { meja_id: id, status });
    }

    res.json({ message: 'Status meja diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
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
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.hapusMeja = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek meja ada dan sedang dipakai
    const [cek] = await db.query(
      'SELECT status FROM meja WHERE id = ?', [id]
    );
    if (cek.length === 0) {
      return res.status(404).json({ message: 'Meja tidak ditemukan' });
    }
    if (cek[0].status === 'terisi') {
      return res.status(400).json({ message: 'Meja sedang terisi, tidak bisa dihapus' });
    }

    await db.query('DELETE FROM meja WHERE id = ?', [id]);
    res.json({ message: 'Meja dihapus' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.generateQR = async (req, res) => {
  try {
    const { id } = req.params;
    const [meja] = await db.query('SELECT * FROM meja WHERE id = ?', [id]);

    if (meja.length === 0) {
      return res.status(404).json({ message: 'Meja tidak ditemukan' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const qr_url = `${baseUrl}/menu/${meja[0].nomor}`;
    
    await db.query('UPDATE meja SET qr_code = ? WHERE id = ?', [qr_url, id]);

    res.json({ 
      message: 'QR Code generated',
      qr_url,
      nomor_meja: meja[0].nomor
    });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};