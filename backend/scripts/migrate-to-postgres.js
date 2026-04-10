/**
 * PostgreSQL Migration Script
 * 
 * Usage:
 * 1. Create PostgreSQL database: createdb teknao_crm
 * 2. Run: node scripts/migrate-to-postgres.js
 * 
 * Environment variables:
 * - DATABASE_URL (postgres://user:pass@host:5432/dbname)
 * - LOG_DIR (optional - for log files)
 */

const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Or individual params:
  // host: process.env.PGHOST || 'localhost',
  // port: process.env.PGPORT || 5432,
  // database: process.env.PGDATABASE || 'teknao_crm',
  // user: process.env.PGUSER || 'postgres',
  // password: process.env.PGPASSWORD,
});

// PostgreSQL Schema (compatible with existing app)
const SCHEMA = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'vendedor',
  avatar TEXT,
  puntos INTEGER DEFAULT 0,
  puntos_mes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Empresas table
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
  vendedor_id TEXT REFERENCES users(id),
  notas TEXT,
  fecha_seguimiento TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contactos table
CREATE TABLE IF NOT EXISTS contactos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  cargo TEXT,
  telefono TEXT,
  email TEXT,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Llamadas table
CREATE TABLE IF NOT EXISTS llamadas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE,
  contacto_id TEXT REFERENCES contactos(id),
  vendedor_id TEXT REFERENCES users(id),
  estado TEXT NOT NULL,
  observaciones TEXT,
  es_contacto_efectivo BOOLEAN DEFAULT FALSE,
  fecha_llamada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Citas table
CREATE TABLE IF NOT EXISTS citas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE,
  vendedor_id TEXT REFERENCES users(id),
  titulo TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  lugar TEXT,
  estado TEXT DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Retos table
CREATE TABLE IF NOT EXISTS retos (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL,
  meta INTEGER NOT NULL,
  puntos INTEGER NOT NULL,
  inicio TIMESTAMP NOT NULL,
  fin TIMESTAMP NOT NULL,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Premios table
CREATE TABLE IF NOT EXISTS premios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  puntos_requeridos INTEGER NOT NULL,
  stock INTEGER DEFAULT 1,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User retos (user progress on challenges)
CREATE TABLE IF NOT EXISTS user_retos (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  reto_id TEXT REFERENCES retos(id) ON DELETE CASCADE,
  progreso INTEGER DEFAULT 0,
  completado BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  UNIQUE(user_id, reto_id)
);

-- User premios (claimed rewards)
CREATE TABLE IF NOT EXISTS user_premios (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  premio_id TEXT REFERENCES premios(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, premio_id)
);

-- Solicitudes premios table
CREATE TABLE IF NOT EXISTS solicitudes_premios (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  premio_id TEXT REFERENCES premios(id) ON DELETE CASCADE,
  puntos_gastados INTEGER NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  resuelta_por TEXT,
  resuelta_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_empresas_estado ON empresas(estado);
CREATE INDEX IF NOT EXISTS idx_empresas_vendedor ON empresas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_llamadas_fecha ON llamadas(fecha_llamada);
CREATE INDEX IF NOT EXISTS idx_llamadas_vendedor ON llamadas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
`;

// Run migration
async function migrate() {
  console.log('🔄 Starting PostgreSQL migration...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Create schema
    console.log('📦 Creating tables...');
    await client.query(SCHEMA);
    console.log('✅ Schema created');
    
    // Create indexes
    console.log('📑 Creating indexes...');
    // (indexes are in SCHEMA above)
    
    client.release();
    console.log('✅ Migration complete');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Export for use in database.js
module.exports = { pool, SCHEMA, migrate };

// Run if called directly
if (require.main === module) {
  migrate();
}