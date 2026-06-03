const db = require('../config/database');
const { clearPermCache } = require('../middleware/auth');

// All available modules for the permission matrix
const ALL_MODULES = ['dashboard', 'pos', 'manajemen_menu', 'manajemen_meja', 'kds', 'laporan', 'user_manage'];

// Get all roles
exports.getRoles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles ORDER BY id ASC');
    // Parse JSON permissions
    const roles = rows.map(r => ({
      ...r,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions
    }));
    res.json({ roles, modules: ALL_MODULES });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single role
exports.getRole = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Role tidak ditemukan' });
    const role = rows[0];
    role.permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
    res.json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new role
exports.createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama role wajib diisi' });

    // Validate name uniqueness
    const [existing] = await db.query('SELECT id FROM roles WHERE name = ?', [name.toLowerCase().trim()]);
    if (existing.length > 0) return res.status(400).json({ message: 'Nama role sudah ada' });

    // Build default permissions if not provided
    const perms = permissions || {};
    ALL_MODULES.forEach(mod => {
      if (!perms[mod]) perms[mod] = { view: false, edit: false };
    });

    await db.query('INSERT INTO roles (name, permissions, is_system) VALUES (?, ?, 0)', [
      name.toLowerCase().trim(),
      JSON.stringify(perms)
    ]);

    clearPermCache();
    res.status(201).json({ message: 'Role berhasil dibuat' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update role permissions
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Role tidak ditemukan' });

    const role = rows[0];

    // For system roles, only allow editing permissions (not name)
    const updatedName = role.is_system ? role.name : (name || role.name).toLowerCase().trim();

    // Validate permissions structure
    const perms = permissions || (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions);
    ALL_MODULES.forEach(mod => {
      if (!perms[mod]) perms[mod] = { view: false, edit: false };
      // If edit is true, view must also be true
      if (perms[mod].edit) perms[mod].view = true;
    });

    // Check name uniqueness if changed
    if (updatedName !== role.name) {
      const [dup] = await db.query('SELECT id FROM roles WHERE name = ? AND id != ?', [updatedName, id]);
      if (dup.length > 0) return res.status(400).json({ message: 'Nama role sudah ada' });
    }

    await db.query('UPDATE roles SET name = ?, permissions = ? WHERE id = ?', [
      updatedName,
      JSON.stringify(perms),
      id
    ]);

    clearPermCache();
    res.json({ message: 'Role berhasil diupdate' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete role (only non-system roles)
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Role tidak ditemukan' });
    if (rows[0].is_system) return res.status(400).json({ message: 'Role bawaan sistem tidak dapat dihapus' });

    // Check if any users are using this role
    const [users] = await db.query('SELECT id FROM users WHERE role = ?', [rows[0].name]);
    if (users.length > 0) return res.status(400).json({ message: `Masih ada ${users.length} user menggunakan role ini. Ubah role mereka terlebih dahulu.` });

    await db.query('DELETE FROM roles WHERE id = ?', [id]);
    clearPermCache();
    res.json({ message: 'Role berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper: get permissions for a role name
exports.getPermissionsForRole = async (roleName) => {
  const [rows] = await db.query('SELECT permissions FROM roles WHERE name = ?', [roleName.toLowerCase().trim()]);
  if (rows.length === 0) return null;
  return typeof rows[0].permissions === 'string' ? JSON.parse(rows[0].permissions) : rows[0].permissions;
};
