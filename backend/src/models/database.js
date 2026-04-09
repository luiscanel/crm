const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:R.U4,%g4fTzt+UV@db.kfohysmglpsdmobldsnk.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
function convertParams(sql, params) {
  if (!params || params.length === 0) return { sql, params };
  
  let paramIndex = 1;
  const newSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
  return { sql: newSql, params };
}

// Query helper - returns a single row
function get(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const { sql: newSql, params: newParams } = convertParams(sql, params);
      const result = await pool.query(newSql, newParams);
      resolve(result.rows[0] || null);
    } catch (err) {
      reject(err);
    }
  });
}

// Query helper - returns all rows
function all(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const { sql: newSql, params: newParams } = convertParams(sql, params);
      const result = await pool.query(newSql, newParams);
      resolve(result.rows);
    } catch (err) {
      reject(err);
    }
  });
}

// Run helper - INSERT, UPDATE, DELETE
function run(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const { sql: newSql, params: newParams } = convertParams(sql, params);
      const result = await pool.query(newSql, newParams);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

// Initialize database
async function initDatabase() {
  console.log('✅ Database connected to Supabase PostgreSQL');
  return { get, all, run };
}

module.exports = { initDatabase, getDb: () => ({ get, all, run }), pool };
