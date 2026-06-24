const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Cache permissions in memory for 60 seconds to avoid DB hits on every request
let permCache = {};
let cacheTime = 0;
const CACHE_TTL = 60000; // 60 seconds

async function loadPermissions() {
  const now = Date.now();
  if (now - cacheTime < CACHE_TTL && Object.keys(permCache).length > 0) {
    return permCache;
  }
  try {
    const [rows] = await db.query('SELECT name, permissions FROM roles');
    const cache = {};
    rows.forEach(r => {
      cache[r.name.toLowerCase().trim()] = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions;
    });
    permCache = cache;
    cacheTime = now;
    return cache;
  } catch {
    return permCache; // Return stale cache on error
  }
}

// Clear cache (call this after role updates)
function clearPermCache() {
  permCache = {};
  cacheTime = 0;
}

/**
 * Auth middleware with two modes:
 * 1. Legacy: auth(['owner', 'manager']) - checks role names (backward compatible)
 * 2. Permission: auth({ module: 'laporan', action: 'view' }) - checks dynamic permissions
 * 3. Empty: auth([]) - just verify token, any authenticated user
 */
module.exports = (config = []) => {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Token tidak ada' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'warkop_secret_123');
      req.user = decoded;

      const userRole = (decoded.role || '').toString().toLowerCase().trim();

      // Investor role globally restricted to GET only
      if (userRole === 'investor' && req.method !== 'GET') {
        return res.status(403).json({ message: 'Read-only: Investor tidak dapat melakukan perubahan data' });
      }

      // If config is empty array, just authenticate
      if (Array.isArray(config) && config.length === 0) {
        return next();
      }

      // Legacy mode: array of role names
      if (Array.isArray(config)) {
        const allowedRoles = config.map(r => r.toLowerCase().trim());
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ message: 'Akses ditolak' });
        }
        return next();
      }

      // Permission mode: { module: 'xxx', action: 'view'|'edit' }
      if (typeof config === 'object' && config.module) {
        const allPerms = await loadPermissions();
        const rolePerms = allPerms[userRole];
        
        if (!rolePerms) {
          return res.status(403).json({ message: 'Role tidak memiliki konfigurasi permission' });
        }

        const modulePerm = rolePerms[config.module];
        if (!modulePerm) {
          return res.status(403).json({ message: 'Akses ditolak untuk modul ini' });
        }

        const action = config.action || 'view';
        if (!modulePerm[action]) {
          return res.status(403).json({ message: `Anda tidak memiliki akses ${action} untuk modul ini` });
        }

        return next();
      }

      next();
    } catch (err) {
      res.status(401).json({ message: 'Token tidak valid' });
    }
  };
};

// Export cache clearer for use in roleController
module.exports.clearPermCache = clearPermCache;