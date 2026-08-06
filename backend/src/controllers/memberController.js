const db = require('../config/database');

exports.registerMember = async (req, res) => {
  try {
    const { nama, nama_panggilan, no_hp, tgl_lahir } = req.body;
    
    if (!nama || !nama_panggilan || !no_hp) {
      return res.status(400).json({ message: 'Nama Lengkap, Nama Panggilan, dan Nomor HP wajib diisi' });
    }

    // Cek apakah nomor HP sudah terdaftar
    const [existing] = await db.query('SELECT * FROM members WHERE no_hp = ?', [no_hp]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Nomor HP sudah terdaftar sebagai member' });
    }

    const [result] = await db.query(
      'INSERT INTO members (nama, nama_panggilan, no_hp, tgl_lahir, point) VALUES (?, ?, ?, ?, 0)',
      [nama, nama_panggilan, no_hp, tgl_lahir || null]
    );

    res.status(201).json({
      message: 'Member berhasil didaftarkan',
      member_id: result.insertId
    });
  } catch (err) {
    console.error('Error registerMember:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMemberByPhone = async (req, res) => {
  try {
    const { no_hp } = req.params;
    const [rows] = await db.query('SELECT * FROM members WHERE no_hp = ?', [no_hp]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Member tidak ditemukan' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error getMemberByPhone:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllMembers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM members ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error getAllMembers:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMemberHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT h.*, p.total as pesanan_total FROM member_points_history h LEFT JOIN pesanan p ON h.pesanan_id = p.id WHERE h.member_id = ? ORDER BY h.created_at DESC',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error getMemberHistory:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, nama_panggilan, no_hp, tgl_lahir } = req.body;
    
    if (!nama || !no_hp) {
      return res.status(400).json({ message: 'Nama dan Nomor HP wajib diisi' });
    }

    const [existing] = await db.query('SELECT id FROM members WHERE no_hp = ? AND id != ?', [no_hp, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Nomor HP sudah digunakan member lain' });
    }

    await db.query(
      'UPDATE members SET nama = ?, nama_panggilan = ?, no_hp = ?, tgl_lahir = ? WHERE id = ?',
      [nama, nama_panggilan || null, no_hp, tgl_lahir || null, id]
    );

    res.json({ message: 'Member berhasil diupdate' });
  } catch (err) {
    console.error('Error updateMember:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM members WHERE id = ?', [id]);
    res.json({ message: 'Member berhasil dihapus' });
  } catch (err) {
    console.error('Error deleteMember:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
