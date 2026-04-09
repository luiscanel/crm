const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/crm.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;
let dbHelpers = null;

// Initialize database asynchronously
async function initDatabase() {
  try {
    const SQL = await initSqlJs();
    
    // Load or create database
    if (fs.existsSync(dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
      } catch (e) {
        console.log('Error loading existing db, creating new one');
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
    }

    // Create tables

    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'vendedor',
        avatar TEXT,
        puntos INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Empresas (Leads) table
    db.run(`
      CREATE TABLE IF NOT EXISTS empresas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        industria TEXT,
        tamano TEXT,
        ubicacion TEXT,
        telefono TEXT,
        estado TEXT DEFAULT 'nuevo',
        vendedor_id TEXT,
        fecha_seguimiento DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendedor_id) REFERENCES users(id)
      )
    `);

    // Contactos table
    db.run(`
      CREATE TABLE IF NOT EXISTS contactos (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        nombre TEXT NOT NULL,
        cargo TEXT,
        telefono TEXT,
        email TEXT,
        canal_preferido TEXT,
        nivel_interes TEXT DEFAULT 'bajo',
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    // Llamadas table
    db.run(`
      CREATE TABLE IF NOT EXISTS llamadas (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        contacto_id TEXT,
        vendedor_id TEXT NOT NULL,
        estado TEXT NOT NULL,
        observaciones TEXT,
        es_contacto_efectivo INTEGER DEFAULT 0,
        fecha_llamada DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (contacto_id) REFERENCES contactos(id),
        FOREIGN KEY (vendedor_id) REFERENCES users(id)
      )
    `);

    // Citas table
    db.run(`
      CREATE TABLE IF NOT EXISTS citas (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        contacto_id TEXT,
        vendedor_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        fecha_hora DATETIME NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (contacto_id) REFERENCES contactos(id),
        FOREIGN KEY (vendedor_id) REFERENCES users(id)
      )
    `);

    // Badges table
    db.run(`
      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        icono TEXT,
        tipo TEXT NOT NULL,
        requisito INTEGER NOT NULL
      )
    `);

    // User badges junction table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_badges (
        user_id TEXT NOT NULL,
        badge_id TEXT NOT NULL,
        obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, badge_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (badge_id) REFERENCES badges(id)
      )
    `);

    // Retos table
    db.run(`
      CREATE TABLE IF NOT EXISTS retos (
        id TEXT PRIMARY KEY,
        tipo TEXT NOT NULL,
        objetivo TEXT NOT NULL,
        meta INTEGER NOT NULL,
        puntos INTEGER NOT NULL,
        fecha_inicio DATE,
        fecha_fin DATE,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User retos junction table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_retos (
        user_id TEXT NOT NULL,
        reto_id TEXT NOT NULL,
        progreso INTEGER DEFAULT 0,
        completado INTEGER DEFAULT 0,
        completed_at DATETIME,
        PRIMARY KEY (user_id, reto_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reto_id) REFERENCES retos(id)
      )
    `);

    // Premios/Recompensas table
    db.run(`
      CREATE TABLE IF NOT EXISTS premios (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        icono TEXT,
        tipo TEXT NOT NULL,
        puntos_requeridos INTEGER NOT NULL,
        cantidad_disponible INTEGER DEFAULT -1,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User premios table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_premios (
        user_id TEXT NOT NULL,
        premio_id TEXT NOT NULL,
       canjeado_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, premio_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (premio_id) REFERENCES premios(id)
      )
    `);

    // Solicitudes de premios (para autorización admin)
    db.run(`
      CREATE TABLE IF NOT EXISTS solicitudes_premios (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        premio_id TEXT NOT NULL,
        puntos_gastados INTEGER NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        solicitada_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resuelta_at DATETIME,
        resuelta_por TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (premio_id) REFERENCES premios(id)
      )
    `);

    // Activity log for audit
    db.run(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Helper function to persist database
    function saveDb() {
      try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
      } catch (error) {
        console.error('Error saving database:', error);
      }
    }

    // Helper functions for sql.js
    dbHelpers = {
      // Run a query and return all results
      all: (sql, params = []) => {
        try {
          const stmt = db.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params);
          }
          const results = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        } catch (error) {
          console.error('SQL Error (all):', sql, params, error);
          return [];
        }
      },

      // Run a query and return first result
      get: (sql, params = []) => {
        try {
          const stmt = db.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params);
          }
          let result = null;
          if (stmt.step()) {
            result = stmt.getAsObject();
          }
          stmt.free();
          return result;
        } catch (error) {
          console.error('SQL Error (get):', sql, params, error);
          return null;
        }
      },

      // Run an insert/update/delete
      run: (sql, params = []) => {
        try {
          db.run(sql, params);
          saveDb();
          return { changes: db.getRowsModified() };
        } catch (error) {
          console.error('SQL Error (run):', sql, params, error);
          return { changes: 0 };
        }
      },

      // Get last insert id
      lastInsertRowId: () => {
        return db.getRowsModified();
      }
    };

    // Seed initial badges
    const existingBadges = dbHelpers.get('SELECT COUNT(*) as count FROM badges');
    if (!existingBadges || existingBadges.count === 0) {
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      
      dbHelpers.run(`INSERT INTO badges (id, nombre, descripcion, icono, tipo, requisito) VALUES (?, ?, ?, ?, ?, ?)`,
        ['badge_llamadas_100', 'Máquina de Llamadas', 'Realiza 100 llamadas', '📞', 'llamadas', 100]);
      dbHelpers.run(`INSERT INTO badges (id, nombre, descripcion, icono, tipo, requisito) VALUES (?, ?, ?, ?, ?, ?)`,
        ['badge_citas_20', 'Cazador de Citas', 'Agenda 20 citas', '📅', 'citas', 20]);
      dbHelpers.run(`INSERT INTO badges (id, nombre, descripcion, icono, tipo, requisito) VALUES (?, ?, ?, ?, ?, ?)`,
        ['badge_conversion_30', 'Conversión Pro', 'Logra más de 30% de tasa de interés', '🎯', 'conversion', 30]);
    }

    // Seed default admin user (password: admin123)
    const existingUsers = dbHelpers.get('SELECT COUNT(*) as count FROM users');
    if (!existingUsers || existingUsers.count === 0) {
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      dbHelpers.run(`INSERT INTO users (id, email, password, name, role, puntos) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'admin@crm.com', hashedPassword, 'Admin Principal', 'admin', 0]);
      dbHelpers.run(`INSERT INTO users (id, email, password, name, role, puntos) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'vendedor1@crm.com', hashedPassword, 'Vendedor 1', 'vendedor', 0]);
      dbHelpers.run(`INSERT INTO users (id, email, password, name, role, puntos) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'vendedor2@crm.com', hashedPassword, 'Vendedor 2', 'vendedor', 0]);
    }

    // Seed daily challenge
    const existingRetos = dbHelpers.get('SELECT COUNT(*) as count FROM retos');
    if (!existingRetos || existingRetos.count === 0) {
      const { v4: uuidv4 } = require('uuid');
      const hoy = new Date().toISOString().split('T')[0];
      const finSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      dbHelpers.run(`INSERT INTO retos (id, tipo, objetivo, meta, puntos, fecha_inicio, fecha_fin, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'diario', 'Llamadas diarias', 25, 50, hoy, hoy, 1]);
      dbHelpers.run(`INSERT INTO retos (id, tipo, objetivo, meta, puntos, fecha_inicio, fecha_fin, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'semanal', 'Empresas contactadas', 100, 100, hoy, finSemana, 1]);
    }

    // Seed default premios/rewards
    const existingPremios = dbHelpers.get('SELECT COUNT(*) as count FROM premios');
    if (!existingPremios || existingPremios.count === 0) {
      const { v4: uuidv4 } = require('uuid');
      
      // Premios semanales - más difíciles
      dbHelpers.run(`INSERT INTO premios (id, nombre, descripcion, icono, tipo, puntos_requeridos) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), '🍕 Pizza Familiar', 'Canjea una pizza familiar cuando cumplas tu meta semanal', 'pizza', 'semanal', 500]);
      dbHelpers.run(`INSERT INTO premios (id, nombre, descripcion, icono, tipo, puntos_requeridos) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), '🎬 Boleto Cine', 'Un boleto de cine por lograr tus objetivos', 'cine', 'semanal', 800]);
      dbHelpers.run(`INSERT INTO premios (id, nombre, descripcion, icono, tipo, puntos_requeridos) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), '☕ Desayuno Gratis', 'Desayuno en la oficina por tu esfuerzo', 'desayuno', 'semanal', 350]);
      
      // Premios mensuales
      dbHelpers.run(`INSERT INTO premios (id, nombre, descripcion, icono, tipo, puntos_requeridos) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), '🎁 Tarjeta de $500', 'Tarjeta de regalo de $500 por meta mensual', 'tarjeta', 'mensual', 2500]);
      dbHelpers.run(`INSERT INTO premios (id, nombre, descripcion, icono, tipo, puntos_requeridos) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), '🛒 Lunch con el Equipo', 'Lunch para ti y tu equipo por logro excepcional', 'lunch', 'mensual', 1800]);
    }

    console.log('✅ Database initialized successfully');
    return dbHelpers;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export async initialization function
module.exports = { initDatabase };
module.exports.getDb = () => dbHelpers;