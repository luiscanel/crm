/**
 * Integration tests for empresas endpoints - without database
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Create mock Express app
const createApp = () => {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  app.locals.db = null;
  
  // Mock data stores
  const empresas = new Map();
  const contactos = new Map();
  
  // Seed test data
  const testUserId = 'test-user-id';
  const testEmpresaId = uuidv4();
  empresas.set(testEmpresaId, {
    id: testEmpresaId,
    nombre: 'Empresa Test',
    industria: 'Tecnología',
    tamano: 'Pequeña',
    telefono: '+50212345678',
    email: 'test@empresa.com',
    direccion: 'Ciudad',
    ciudad: 'Guatemala',
    estado: 'nuevo',
    created_by: testUserId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  // Auth middleware
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, 'test-secret');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: 'Token inválido' });
    }
  };
  
  // Validation helpers
  const validateEmail = (email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validStates = ['nuevo', 'contactado', 'interesado', 'cita_agendada', 'seguimiento', 'cerrado'];
  
  // List empresas
  app.get('/api/empresas', authenticateToken, (req, res) => {
    const { estado, search } = req.query;
    let result = Array.from(empresas.values());
    
    if (estado) {
      result = result.filter(e => e.estado === estado);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(e => 
        e.nombre.toLowerCase().includes(searchLower) ||
        (e.industria && e.industria.toLowerCase().includes(searchLower))
      );
    }
    
    res.json(result);
  });
  
  // Get single empresa
  app.get('/api/empresas/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const empresa = empresas.get(id);
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    res.json(empresa);
  });
  
  // Create empresa
  app.post('/api/empresas', authenticateToken, (req, res) => {
    const { nombre, industria, tamano, telefono, email, direccion, ciudad, notas } = req.body;
    
    // Validation
    const errors = [];
    if (!nombre || nombre.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }
    if (nombre && nombre.length > 200) {
      errors.push('El nombre no puede exceder 200 caracteres');
    }
    if (email && !validateEmail(email)) {
      errors.push('Email inválido');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    const id = uuidv4();
    const newEmpresa = {
      id,
      nombre,
      industria,
      tamano,
      telefono,
      email,
      direccion,
      ciudad,
      estado: 'nuevo',
      created_by: req.user.id,
      notas,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    empresas.set(id, newEmpresa);
    
    res.status(201).json(newEmpresa);
  });
  
  // Update empresa
  app.put('/api/empresas/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nombre, industria, estado, telefono, email, notas } = req.body;
    
    const empresa = empresas.get(id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    // Validation
    if (nombre !== undefined && nombre.trim().length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }
    if (estado && !validStates.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    if (email && !validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    
    // Update fields
    if (nombre) empresa.nombre = nombre;
    if (industria) empresa.industria = industria;
    if (estado) empresa.estado = estado;
    if (telefono) empresa.telefono = telefono;
    if (email) empresa.email = email;
    if (notas) empresa.notas = notas;
    empresa.updated_at = new Date().toISOString();
    
    empresas.set(id, empresa);
    
    res.json(empresa);
  });
  
  // Delete empresa
  app.delete('/api/empresas/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    if (!empresas.has(id)) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    empresas.delete(id);
    res.json({ message: 'Empresa eliminada' });
  });
  
  return app;
};

const app = createApp();

// Generate test token
const testToken = jwt.sign(
  { id: 'test-user-id', email: 'test@teknao.com', role: 'vendedor' },
  'test-secret',
  { expiresIn: '24h' }
);
const authHeader = { Authorization: `Bearer ${testToken}` };

// Get empresa ID for tests
let testEmpresaId;
const empresas = Array.from(require('uuid').v4()); // Just for generating IDs

describe('Empresas API', () => {
  describe('GET /api/empresas', () => {
    test('should return 401 without token', async () => {
      const res = await request(app).get('/api/empresas');
      expect(res.status).toBe(401);
    });

    test('should return empresas list with valid token', async () => {
      const res = await request(app).get('/api/empresas').set(authHeader);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('should filter by estado', async () => {
      const res = await request(app)
        .get('/api/empresas')
        .set(authHeader)
        .query({ estado: 'nuevo' });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/empresas/:id', () => {
    test('should return 404 for non-existent empresa', async () => {
      const res = await request(app)
        .get('/api/empresas/not-found-id')
        .set(authHeader);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/empresas', () => {
    test('should return 400 for short nombre', async () => {
      const res = await request(app)
        .post('/api/empresas')
        .set(authHeader)
        .send({ nombre: 'A' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('2 caracteres');
    });

    test('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/empresas')
        .set(authHeader)
        .send({ nombre: 'Test Company', email: 'invalid-email' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Email inválido');
    });

    test('should create empresa successfully', async () => {
      const res = await request(app)
        .post('/api/empresas')
        .set(authHeader)
        .send({ nombre: 'Nueva Empresa', industria: 'Retail' });
      
      expect(res.status).toBe(201);
      expect(res.body.nombre).toBe('Nueva Empresa');
      expect(res.body.estado).toBe('nuevo');
    });
  });

  describe('PUT /api/empresas/:id', () => {
    test('should return 400 for invalid estado', async () => {
      // First get valid empresa ID from list
      const listRes = await request(app).get('/api/empresas').set(authHeader);
      const validId = listRes.body[0].id;
      
      const res = await request(app)
        .put(`/api/empresas/${validId}`)
        .set(authHeader)
        .send({ estado: 'invalid_estado' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Estado inválido');
    });
  });

  describe('DELETE /api/empresas/:id', () => {
    test('should return 404 for non-existent empresa', async () => {
      const res = await request(app)
        .delete('/api/empresas/not-found-id')
        .set(authHeader);
      
      expect(res.status).toBe(404);
    });
  });
});