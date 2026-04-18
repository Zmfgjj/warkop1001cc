const jwt = require('jsonwebtoken');

module.exports = (roles = []) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Token tidak ada' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      console.log('Auth Check - Role:', decoded.role, '| Allowed:', roles, '| Check:', roles.length > 0 && !roles.includes(decoded.role));

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Akses ditolak', requiredRoles: roles, userRole: decoded.role });
      }

      next();
    } catch (err) {
      res.status(401).json({ message: 'Token tidak valid' });
    }
  };
};