const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Cek user
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? AND aktif = 1', 
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const user = rows[0];

    // Cek password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    // Buat token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Set HttpOnly Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout berhasil' });
};

exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, username, role FROM users WHERE id = ? AND aktif = 1', 
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};