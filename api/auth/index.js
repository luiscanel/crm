const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../../db');
const { authenticateToken, JWT_SECRET } = require('./middleware');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
    
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, puntos: user.puntos }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'vendedor' } = req.body;
    
    const existingUser = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    
    await query(
      'INSERT INTO users (id, email, password, name, role, puntos) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, email, hashedPassword, name, role, 0]
    );
    
    const token = jwt.sign(
      { id, email, role, name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: { id, name, email, role, puntos: 0 }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, name, email, role, puntos, puntos_mes FROM users WHERE id = $1', [req.user.id]);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Get all users (admin)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const users = await query('SELECT id, name, email, role, puntos, created_at FROM users ORDER BY name');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Update user
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, role, puntos } = req.body;
    
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(name); }
    if (avatar !== undefined) { updates.push(`avatar = $${paramIndex++}`); values.push(avatar); }
    if (role !== undefined && req.user.role === 'admin') { updates.push(`role = $${paramIndex++}`); values.push(role); }
    if (puntos !== undefined && req.user.role === 'admin') { updates.push(`puntos = $${paramIndex++}`); values.push(puntos); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    values.push(id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
    
    const updatedUser = await queryOne('SELECT id, email, name, role, avatar, puntos FROM users WHERE id = $1', [id]);
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

module.exports = router;
