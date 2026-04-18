const db = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, username, role, aktif, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.tambahUser = async (req, res) => {
  try {
    const { nama, username, password, role } = req.body;

    if (!nama || !username || !password || !role) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    const allowedRoles = ['owner', 'manager', 'kasir', 'dapur'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }

    // Cek username sudah ada
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username sudah dipakai' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)',
      [nama, username, hashed, role]
    );

    res.status(201).json({ message: 'User ditambahkan', id: result.insertId });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, username, password, role, aktif } = req.body;

    // Cek username sudah dipakai user lain
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username sudah dipakai' });
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET nama=?, username=?, password=?, role=?, aktif=? WHERE id=?',
        [nama, username, hashed, role, aktif, id]
      );
    } else {
      await db.query(
        'UPDATE users SET nama=?, username=?, role=?, aktif=? WHERE id=?',
        [nama, username, role, aktif, id]
      );
    }

    res.json({ message: 'User diupdate' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.hapusUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Jangan hapus diri sendiri
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Tidak bisa hapus akun sendiri' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User dihapus' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.gantiPassword = async (req, res) => {
  try {
    const { password_lama, password_baru } = req.body;
    const id = req.user.id;

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    const valid = await bcrypt.compare(password_lama, rows[0].password);

    if (!valid) {
      return res.status(400).json({ message: 'Password lama salah' });
    }

    const hashed = await bcrypt.hash(password_baru, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);

    res.json({ message: 'Password berhasil diganti' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};