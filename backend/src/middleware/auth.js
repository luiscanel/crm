const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET not set! Using fallback for development only.');
}

const SECRET = JWT_SECRET || 'dev-secret-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de acceso requerido' });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token inválido o expirado' });
    }

    try {
      const userData = req.db.get('SELECT id, email, name, role, avatar, puntos FROM users WHERE id = ?', [user.id]);
      if (!userData) {
        return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
      }
      req.user = userData;
      next();
    } catch (dbError) {
      console.error('DB error in auth:', dbError.message);
      res.status(500).json({ success: false, error: 'Error de base de datos' });
    }
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para esta acción' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole, JWT_SECRET: SECRET };