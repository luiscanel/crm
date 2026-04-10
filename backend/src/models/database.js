const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/crm.db');
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
// Enable foreign keys
db.pragma('foreign_keys = ON');

// Convert PostgreSQL syntax to SQLite
function convertToSQLite(sql) {
  // Remove ::type casting
  let converted = sql.replace(/::\w+/g, '');
  // Replace CURRENT_DATE with date('now')
  converted = converted.replace(/CURRENT_DATE/g, "date('now')");
  // Replace CURRENT_TIMESTAMP with datetime('now')
  converted = converted.replace(/CURRENT_TIMESTAMP/g, "datetime('now')");
  // Replace COALESCE with IFNULL
  converted = converted.replace(/COALESCE/gi, 'IFNULL');
  // Replace entidad_tipo with entity_type
  converted = converted.replace(/entidad_tipo/gi, 'entity_type');
  // Replace entidad_id with entity_id (already same, but for consistency)
  converted = converted.replace(/entidad_id/gi, 'entity_id');
  // Replace detalles with details
  converted = converted.replace(/detalles/gi, 'details');
  // Replace status with estado in some queries
  converted = converted.replace(/status/gi, 'estado');
  // Replace double quotes around values with single quotes (SQLite uses single quotes)
  converted = converted.replace(/"([^"]+)"/g, "'$1'");
  return converted;
}

// Initialize database
function initDatabase() {
  console.log('✅ Database connected to SQLite:', dbPath);
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'vendedor',
      avatar TEXT,
      puntos INTEGER DEFAULT 0,
      puntos_mes INTEGER DEFAULT 0,
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
      canal_preferido TEXT,
      nivel_interes TEXT,
      notas TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
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
      updated_at TEXT,
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

    CREATE TABLE IF NOT EXISTS tareas (
      id TEXT PRIMARY KEY,
      empresa_id TEXT,
      vendedor_id TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      prioridad TEXT DEFAULT 'media',
      estado TEXT DEFAULT 'pendiente',
      fecha_limite TEXT,
      updated_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
      FOREIGN KEY (vendedor_id) REFERENCES users(id)
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
      puntos INTEGER NOT NULL,
      fecha_inicio TEXT,
      fecha_fin TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS premios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      icono TEXT,
      tipo TEXT NOT NULL,
      puntos_requeridos INTEGER NOT NULL,
      cantidad_disponible INTEGER,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      obtained_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS user_premios (
      user_id TEXT NOT NULL,
      premio_id TEXT NOT NULL,
      canjeado_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, premio_id)
    );

    CREATE TABLE IF NOT EXISTS user_retos (
      user_id TEXT NOT NULL,
      reto_id TEXT NOT NULL,
      progreso INTEGER DEFAULT 0,
      completado INTEGER DEFAULT 0,
      completed_at TEXT,
      PRIMARY KEY (user_id, reto_id)
    );

    CREATE TABLE IF NOT EXISTS solicitudes_premios (
      id TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL,
      premio_id TEXT NOT NULL,
      estado TEXT DEFAULT 'pendiente',
      puntos_gastados INTEGER DEFAULT 0,
      solicitud_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resuelto_at TEXT,
      resuelta_por TEXT,
      FOREIGN KEY (usuario_id) REFERENCES users(id),
      FOREIGN KEY (premio_id) REFERENCES premios(id)
    );
  `);

  // Insert default admin user if not exists
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('luis.c@teknao.com.gt');
  if (!existingUser) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(
      'INSERT INTO users (id, email, password, name, role, puntos) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(uuidv4(), 'luis.c@teknao.com.gt', hashedPassword, 'Luis Cifuentes', 'admin', 0);
    console.log('✅ Default admin user created');
  }

  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_empresas_vendedor ON empresas(vendedor_id)',
    'CREATE INDEX IF NOT EXISTS idx_empresas_estado ON empresas(estado)',
    'CREATE INDEX IF NOT EXISTS idx_empresas_created ON empresas(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_llamadas_empresa ON llamadas(empresa_id)',
    'CREATE INDEX IF NOT EXISTS idx_llamadas_vendedor ON llamadas(vendedor_id)',
    'CREATE INDEX IF NOT EXISTS idx_llamadas_fecha ON llamadas(fecha_llamada)',
    'CREATE INDEX IF NOT EXISTS idx_citas_empresa ON citas(empresa_id)',
    'CREATE INDEX IF NOT EXISTS idx_citas_vendedor ON citas(vendedor_id)',
    'CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_hora)',
    'CREATE INDEX IF NOT EXISTS idx_contactos_empresa ON contactos(empresa_id)',
    'CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_notas_empresa ON notas(empresa_id)',
    'CREATE INDEX IF NOT EXISTS idx_tareas_vendedor ON tareas(vendedor_id)',
    'CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado)',
  ];

  for (const idx of indexes) {
    try {
      db.exec(idx);
    } catch (e) {
      // Ignore if index already exists
    }
  }
  console.log('✅ Database indexes created');

  // Insert default badges if not exists
  const existingBadges = db.prepare('SELECT COUNT(*) as count FROM badges').get();
  if (existingBadges.count === 0) {
    const badges = [
      ['b1', 'Primera Llamada', 'Realiza tu primera llamada', 'phone', 'llamada', 1],
      ['b2', 'Llamadas 10', 'Realiza 10 llamadas', 'phone', 'llamada', 10],
      ['b3', 'Llamadas 50', 'Realiza 50 llamadas', 'phone', 'llamada', 50],
      ['b4', 'Llamadas 100', 'Realiza 100 llamadas', 'phone', 'llamada', 100],
      ['b5', 'Primer Contacto', 'Primer contacto efectivo', 'handshake', 'contacto', 1],
      ['b6', 'Contactos 10', '10 contactos efectivos', 'handshake', 'contacto', 10],
      ['b7', 'Primera Cita', 'Agenda tu primera cita', 'calendar', 'cita', 1],
      ['b8', 'Citas 10', '10 citas agendadas', 'calendar', 'cita', 10],
      ['b9', 'Empresas 5', 'Gestiona 5 empresas', 'building', 'empresa', 5],
      ['b10', 'Empresas 20', 'Gestiona 20 empresas', 'building', 'empresa', 20],
    ];
    const insertBadge = db.prepare('INSERT INTO badges (id, nombre, descripcion, icono, tipo, requisito) VALUES (?, ?, ?, ?, ?, ?)');
    badges.forEach(b => insertBadge.run(...b));
    console.log('✅ Default badges created');
  }

  // Return wrapper with same interface as before
  return {
    get: (sql, params = []) => {
      try {
        const sqliteSql = convertToSQLite(sql);
        const stmt = db.prepare(sqliteSql);
        return params.length > 0 ? stmt.get(...params) : stmt.get();
      } catch (err) {
        console.error('DB get error:', err.message, 'SQL:', sql);
        throw err;
      }
    },
    all: (sql, params = []) => {
      try {
        const sqliteSql = convertToSQLite(sql);
        const stmt = db.prepare(sqliteSql);
        return params.length > 0 ? stmt.all(...params) : stmt.all();
      } catch (err) {
        console.error('DB all error:', err.message, 'SQL:', sql);
        throw err;
      }
    },
    run: (sql, params = []) => {
      try {
        const sqliteSql = convertToSQLite(sql);
        const stmt = db.prepare(sqliteSql);
        return params.length > 0 ? stmt.run(...params) : stmt.run();
      } catch (err) {
        console.error('DB run error:', err.message, 'SQL:', sql);
        throw err;
      }
    }
  };
}

module.exports = { initDatabase, getDb: () => db, db };