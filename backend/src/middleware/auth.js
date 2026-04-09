const jwt = require('jsonwebtoken');

// JWT Secret from environment variable with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'teknao-crm-secret-key-change-in-production-2024';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    // Get fresh user data from database
    const userData = req.db.get('SELECT id, email, name, role, avatar, puntos FROM users WHERE id = ?', [user.id]);
    if (!userData) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = userData;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole, JWT_SECRET };