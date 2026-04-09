const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  try {
    const db = req.db;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        puntos: user.puntos
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Register (admin only)
router.post('/register', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre requeridos' });
    }

    const existingUser = db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    db.run(
      `INSERT INTO users (id, email, password, name, role, puntos) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, email, hashedPassword, name, role || 'vendedor', 0]
    );

    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'create_user', 'user', id, `Created user: ${name}`]
    );

    res.status(201).json({ message: 'Usuario creado exitosamente', userId: id });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Get all users (admin/supervisor)
router.get('/users', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const users = db.all(
      `SELECT id, email, name, role, avatar, puntos, created_at FROM users ORDER BY created_at DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Update user profile
router.put('/users/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;
    const { name, avatar, role, puntos } = req.body;

    // Only allow users to update their own profile (except admins)
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    // Admin can change role and puntos, regular users cannot
    if (req.user.role === 'admin') {
      // Build update query dynamically based on what's provided
      const updates = [];
      const values = [];
      
      if (name !== undefined) { updates.push('name = ?'); values.push(name); }
      if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar); }
      if (role !== undefined) { updates.push('role = ?'); values.push(role); }
      if (puntos !== undefined) { updates.push('puntos = ?'); values.push(puntos); }
      
      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
      }
    } else {
      db.run(
        `UPDATE users SET name = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, avatar, id]
      );
    }

    const updatedUser = db.get('SELECT id, email, name, role, avatar, puntos FROM users WHERE id = ?', [id]);
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

module.exports = router;