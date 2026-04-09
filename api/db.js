const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:R.U4,%g4fTzt+UV@db.kfohysmglpsdmobldsnk.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

function convertParams(sql, params) {
  if (!params || params.length === 0) return { sql, params };
  let paramIndex = 1;
  const newSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
  return { sql: newSql, params };
}

async function query(sql, params = []) {
  const { sql: newSql, params: newParams } = convertParams(sql, params);
  const result = await pool.query(newSql, newParams);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = { pool, query, queryOne };
