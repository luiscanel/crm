const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  const result = await pool.query('SELECT id, email, password FROM users WHERE email = $1', ['luis.c@teknao.com.gt']);
  console.log('User:', JSON.stringify(result.rows));
  if (result.rows.length > 0) {
    const bcrypt = require('bcryptjs');
    console.log('Password hash from DB:', result.rows[0].password);
    console.log('Test admin123:', bcrypt.compareSync('admin123', result.rows[0].password));
  }
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
