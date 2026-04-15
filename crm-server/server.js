const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============ BASE DE DATOS SQLITE ============
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, 'data', 'crm.db');
const fs = require('fs');

// Crear directorio data si no existe
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('✅ Base de datos SQLite iniciada:', dbPath);

// ============ INICIALIZAR TABLAS ============
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'vendedor',
    avatar TEXT,
    puntos INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS empresas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    industria TEXT,
    tamano TEXT,
    ubicacion TEXT,
    telefono TEXT,
    email TEXT,
    sitio_web TEXT,
    direccion TEXT,
    estado TEXT DEFAULT 'nuevo',
    vendedor_id TEXT,
    notas TEXT,
    fecha_seguimiento TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contactos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    cargo TEXT,
    telefono TEXT,
    email TEXT,
    notas TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS llamadas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    contacto_id TEXT,
    vendedor_id TEXT NOT NULL,
    estado TEXT,
    observaciones TEXT,
    es_contacto_efectivo INTEGER DEFAULT 0,
    fecha_llamada TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS citas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    vendedor_id TEXT NOT NULL,
    contacto_id TEXT,
    fecha_hora TEXT NOT NULL,
    tipo TEXT,
    motivo TEXT,
    estado TEXT DEFAULT 'pendiente',
    link_videollamada TEXT,
    notas TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    vendedor_id TEXT NOT NULL,
    contenido TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS actividad (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    accion TEXT NOT NULL,
    entidad_tipo TEXT,
    entidad_id TEXT,
    detalles TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    icono TEXT,
    tipo TEXT NOT NULL,
    requisito INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS retos (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    objetivo TEXT NOT NULL,
    meta INTEGER NOT NULL,
    activo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS premios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    icono TEXT,
    tipo TEXT NOT NULL,
    puntos_requeridos INTEGER NOT NULL,
    cantidad_disponible INTEGER,
    activo INTEGER DEFAULT 1
  );
`);

// Insertar usuario admin si no existe
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@teknao.com.gt');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, email, password, name, role, puntos) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(), 'admin@teknao.com.gt', hashedPassword, 'Admin Teknao', 'admin', 0
  );
  console.log('✅ Usuario admin creado: admin@teknao.com.gt / admin123');
}

// Insertar badges por defecto
const badgesCount = db.prepare('SELECT COUNT(*) as count FROM badges').get();
if (badgesCount.count === 0) {
  const badges = [
    ['b1', 'Primera Llamada', 'Realiza tu primera llamada', 'phone', 'llamada', 1],
    ['b2', 'Llamadas 10', 'Realiza 10 llamadas', 'phone', 'llamada', 10],
    ['b3', 'Primer Contacto', 'Primer contacto efectivo', 'handshake', 'contacto', 1],
    ['b4', 'Primera Cita', 'Agenda tu primera cita', 'calendar', 'cita', 1],
  ];
  const insert = db.prepare('INSERT INTO badges (id, nombre, descripcion, icono, tipo, requisito) VALUES (?, ?, ?, ?, ?, ?)');
  badges.forEach(b => insert.run(...b));
}

// Insertar retos por defecto
const retosCount = db.prepare('SELECT COUNT(*) as count FROM retos').get();
if (retosCount.count === 0) {
  const retos = [
    ['r1', 'diario', 'Llamadas diarias', 25],
    ['r2', 'semanal', 'Contactos semanales', 15],
  ];
  const insert = db.prepare('INSERT INTO retos (id, tipo, objetivo, meta) VALUES (?, ?, ?, ?)');
  retos.forEach(r => insert.run(...r));
}

console.log('✅ Tablas inicializadas');

// ============ MIDDLEWARE AUTH ============
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, 'teknao-secret-key-2024');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// ============ RUTAS API ============

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, 'teknao-secret-key-2024', { expiresIn: '7d' });
  
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, puntos: user.puntos } });
});

// GET USERS
app.get('/api/users', authenticateToken, (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, puntos, created_at FROM users').all();
  res.json(users);
});

// EMPRESAS - GET ALL
app.get('/api/empresas', authenticateToken, (req, res) => {
  const { estado, search } = req.query;
  let query = 'SELECT * FROM empresas WHERE 1=1';
  const params = [];
  
  if (estado) {
    query += ' AND estado = ?';
    params.push(estado);
  }
  if (search) {
    query += ' AND (nombre LIKE ? OR industria LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  const empresas = db.all(query, params);
  res.json(empresas);
});

// EMPRESAS - GET ONE
app.get('/api/empresas/:id', authenticateToken, (req, res) => {
  const empresa = db.prepare('SELECT * FROM empresas WHERE id = ?').get(req.params.id);
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
  
  const contactos = db.prepare('SELECT * FROM contactos WHERE empresa_id = ?').all(req.params.id);
  const llamadas = db.prepare('SELECT * FROM llamadas WHERE empresa_id = ? ORDER BY fecha_llamada DESC').all(req.params.id);
  const citas = db.prepare('SELECT * FROM citas WHERE empresa_id = ? ORDER BY fecha_hora DESC').all(req.params.id);
  const notas = db.prepare('SELECT * FROM notas WHERE empresa_id = ? ORDER BY created_at DESC').all(req.params.id);
  
  res.json({ ...empresa, contactos, llamadas, citas, notas });
});

// EMPRESAS - CREATE
app.post('/api/empresas', authenticateToken, (req, res) => {
  const { nombre, industria, tamano, ubicacion, telefono, email } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO empresas (id, nombre, industria, tamano, ubicacion, telefono, email, estado, vendedor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'nuevo', ?)
  `).run(id, nombre, industria || '', tamano || '', ubicacion || '', telefono || '', email || '', req.user.id);
  
  // Agregar punto
  db.prepare('UPDATE users SET puntos = puntos + 1 WHERE id = ?').run(req.user.id);
  
  res.status(201).json({ message: 'Empresa creada', id });
});

// EMPRESAS - UPDATE
app.put('/api/empresas/:id', authenticateToken, (req, res) => {
  const { nombre, industria, tamano, ubicacion, telefono, email, estado } = req.body;
  
  db.prepare(`
    UPDATE empresas SET
      nombre = COALESCE(?, nombre),
      industria = COALESCE(?, industria),
      tamano = COALESCE(?, tamano),
      ubicacion = COALESCE(?, ubicacion),
      telefono = COALESCE(?, telefono),
      email = COALESCE(?, email),
      estado = COALESCE(?, estado),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nombre, industria, tamano, ubicacion, telefono, email, estado, req.params.id);
  
  res.json({ message: 'Empresa actualizada' });
});

// EMPRESAS - DELETE
app.delete('/api/empresas/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM empresas WHERE id = ?').run(req.params.id);
  res.json({ message: 'Empresa eliminada' });
});

// CONTACTOS
app.get('/api/empresas/:empresaId/contactos', authenticateToken, (req, res) => {
  const contactos = db.prepare('SELECT * FROM contactos WHERE empresa_id = ?').all(req.params.empresaId);
  res.json(contactos);
});

app.post('/api/contactos', authenticateToken, (req, res) => {
  const { empresa_id, nombre, cargo, telefono, email } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO contactos (id, empresa_id, nombre, cargo, telefono, email) VALUES (?, ?, ?, ?, ?, ?)').run(id, empresa_id, nombre, cargo || '', telefono || '', email || '');
  res.status(201).json({ message: 'Contacto creado', id });
});

// LLAMADAS
app.post('/api/llamadas', authenticateToken, (req, res) => {
  const { empresa_id, contacto_id, estado, observaciones, es_contacto_efectivo } = req.body;
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO llamadas (id, empresa_id, contacto_id, vendedor_id, estado, observaciones, es_contacto_efectivo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, empresa_id, contacto_id || null, req.user.id, estado || 'completada', observaciones || '', es_contacto_efectivo ? 1 : 0);
  
  // Puntos: 1 por llamada, +3 si contacto efectivo
  let puntos = 1;
  if (es_contacto_efectivo) puntos += 3;
  db.prepare('UPDATE users SET puntos = puntos + ? WHERE id = ?').run(puntos, req.user.id);
  
  res.status(201).json({ message: 'Llamada registrada', puntos_ganados: puntos });
});

// CITAS
app.get('/api/citas', authenticateToken, (req, res) => {
  const citas = db.all(`
    SELECT c.*, e.nombre as empresa_nombre
    FROM citas c
    LEFT JOIN empresas e ON c.empresa_id = e.id
    WHERE c.vendedor_id = ?
    ORDER BY c.fecha_hora ASC
  `, [req.user.id]);
  res.json(citas);
});

app.post('/api/citas', authenticateToken, (req, res) => {
  const { empresa_id, fecha_hora, tipo, motivo } = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO citas (id, empresa_id, vendedor_id, fecha_hora, tipo, motivo, estado)
    VALUES (?, ?, ?, ?, ?, ?, 'pendiente')
  `).run(id, empresa_id, req.user.id, fecha_hora, tipo || 'reunion', motivo || '');
  
  // 10 puntos por cita
  db.prepare('UPDATE users SET puntos = puntos + 10 WHERE id = ?').run(req.user.id);
  
  res.status(201).json({ message: 'Cita agendada' });
});

// NOTAS
app.post('/api/notas', authenticateToken, (req, res) => {
  const { empresa_id, contenido } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO notas (id, empresa_id, vendedor_id, contenido) VALUES (?, ?, ?, ?)').run(id, empresa_id, req.user.id, contenido);
  res.status(201).json({ message: 'Nota guardada' });
});

// DASHBOARD STATS
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const totalEmpresas = db.prepare('SELECT COUNT(*) as count FROM empresas').get().count;
  const empresasPorEstado = db.prepare('SELECT estado, COUNT(*) as count FROM empresas GROUP BY estado').all();
  
  const misEmpresas = db.prepare('SELECT COUNT(*) as count FROM empresas WHERE vendedor_id = ?').get(req.user.id).count;
  const misLlamadas = db.prepare('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ?').get(req.user.id).count;
  const misContactos = db.prepare('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND es_contacto_efectivo = 1').get(req.user.id).count;
  const misCitas = db.prepare('SELECT COUNT(*) as count FROM citas WHERE vendedor_id = ?').get(req.user.id).count;
  
  const user = db.prepare('SELECT puntos FROM users WHERE id = ?').get(req.user.id);
  
  res.json({
    totalEmpresas,
    empresasPorEstado,
    misEmpresas,
    misLlamadas,
    misContactos,
    misCitas,
    misPuntos: user.puntos
  });
});

// GAMIFICACIÓN - BADGES
app.get('/api/gamificacion/badges', authenticateToken, (req, res) => {
  const badges = db.prepare('SELECT * FROM badges').all();
  res.json(badges);
});

// GAMIFICACIÓN - PREMIOS
app.get('/api/gamificacion/premios', authenticateToken, (req, res) => {
  const premios = db.prepare('SELECT * FROM premios WHERE activo = 1').all();
  res.json(premios);
});

// STATS GENERALES (admin)
app.get('/api/stats', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  
  const vendedores = db.prepare(`
    SELECT u.name, u.puntos,
      (SELECT COUNT(*) FROM empresas WHERE vendedor_id = u.id) as empresas,
      (SELECT COUNT(*) FROM llamadas WHERE vendedor_id = u.id) as llamadas
    FROM users u WHERE u.role = 'vendedor'
  `).all();
  
  res.json({ vendedores });
});

// ============ ARCHIVOS ESTÁTICOS (FRONTEND) ============
// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ INICIAR SERVIDOR ============
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║   🚀 CRM Teknao Corriendo en Puerto ${PORT}               ║
  ║   📍 http://192.168.0.16:${PORT}                      ║
  ║   👤 Admin: admin@teknao.com.gt / admin123           ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = app;