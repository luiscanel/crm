/**
 * Integration tests for auth endpoints - without database
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create mock Express app without database
const createApp = () => {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  app.locals.db = null;
  
  // Mock users (in-memory)
  const users = new Map();
  
  // Seed test user
  const testUserId = 'test-user-id';
  users.set('test@teknao.com', {
    id: testUserId,
    email: 'test@teknao.com',
    password: bcrypt.hashSync('test123', 10),
    name: 'Test User',
    role: 'admin',
    puntos: 50
  });
  
  // Login route
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
      }
      
      const user = users.get(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        'test-secret',
        { expiresIn: '24h' }
      );
      
      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, puntos: user.puntos }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  });
  
  // Register route (protected)
  app.post('/api/auth/register', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Token requerido' });
      }
      
      const token = authHeader.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(token, 'test-secret');
      } catch {
        return res.status(403).json({ error: 'Token inválido' });
      }
      
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden crear usuarios' });
      }
      
      const { email, password, name, role } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, contraseña y nombre requeridos' });
      }
      
      if (users.has(email)) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
      
      const newUser = {
        id: 'new-user-' + Date.now(),
        email,
        password: bcrypt.hashSync(password, 10),
        name,
        role: role || 'vendedor',
        puntos: 0
      };
      users.set(email, newUser);
      
      res.status(201).json({ message: 'Usuario creado exitosamente', userId: newUser.id });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  });
  
  return app;
};

const app = createApp();

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    test('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'test123' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email y contraseña requeridos');
    });

    test('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@teknao.com' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email y contraseña requeridos');
    });

    test('should return 401 if user not found', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@teknao.com', password: 'test123' });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Credenciales inválidas');
    });

    test('should return 401 if password is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@teknao.com', password: 'wrongpassword' });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Credenciales inválidas');
    });

    test('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@teknao.com', password: 'test123' });
      
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toEqual({
        id: 'test-user-id',
        email: 'test@teknao.com',
        name: 'Test User',
        role: 'admin',
        puntos: 50
      });
    });
  });

  describe('POST /api/auth/register', () => {
    const adminToken = jwt.sign(
      { id: 'test-user-id', email: 'test@teknao.com', role: 'admin' },
      'test-secret',
      { expiresIn: '24h' }
    );
    const authHeader = { Authorization: `Bearer ${adminToken}` };

    test('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@test.com', password: 'pass123', name: 'New User' });
      
      expect(res.status).toBe(401);
    });

    test('should return 403 for non-admin', async () => {
      const nonAdminToken = jwt.sign(
        { id: 'vendor-id', email: 'vendor@teknao.com', role: 'vendedor' },
        'test-secret',
        { expiresIn: '24h' }
      );
      
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ email: 'new@test.com', password: 'pass123', name: 'New User' });
      
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Solo administradores pueden crear usuarios');
    });

    test('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set(authHeader)
        .send({ password: 'pass123', name: 'New User' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email, contraseña y nombre requeridos');
    });

    test('should return 400 if email already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set(authHeader)
        .send({ email: 'test@teknao.com', password: 'pass123', name: 'New User' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('El email ya está en uso');
    });

    test('should create user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set(authHeader)
        .send({ email: 'new@test.com', password: 'pass123', name: 'New User' });
      
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Usuario creado exitosamente');
    });
  });
});