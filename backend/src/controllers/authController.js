const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPermissionsForRole } = require('./roleController');
const { logAction } = require('../services/logger');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    // Cek user
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? AND aktif = 1', 
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Username tidak ditemukan' });
    }

    const user = rows[0];

    // Cek password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Password salah' });
    }

    // Fetch permissions from roles table
    const permissions = await getPermissionsForRole(user.role);

    // Buat token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'warkop_secret_123',
      { expiresIn: process.env.JWT_EXPIRES_IN || '4h' }
    );

    // Set HttpOnly Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000 // 4 hours
    });

    // Set user object inside req temporarily for logger
    req.user = { id: user.id, username: user.username, role: user.role };
    
    // Log Activity (akan mengambil IP dan User-Agent dari req)
    await logAction(req, 'SYSTEM', 'users', `User ${user.username} berhasil login`);

    res.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role,
        permissions: permissions || {}
      }
    });

  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout berhasil' });
};

exports.getMe = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, username, role FROM users WHERE id = ? AND aktif = 1', 
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const user = rows[0];
    const permissions = await getPermissionsForRole(user.role);

    res.json({ 
      user: {
        ...user,
        permissions: permissions || {}
      }
    });
  } catch (err) {
    next(err);
  }
};