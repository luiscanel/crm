const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'teknao-crm-secret-key-2024';

module.exports = {
  authenticateToken: async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
  },
  JWT_SECRET
};
