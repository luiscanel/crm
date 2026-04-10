const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:R.U4,%g4fTzt+UV@db.kfohysmglpsdmobldsnk.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Get user
    const r = await pool.query('SELECT email, password FROM users WHERE email = $1', ['luis.c@teknao.com.gt']);
    const user = r.rows[0];
    console.log('User from DB:', user);
    console.log('Password from DB:', user?.password);
    console.log('Password length:', user?.password?.length);
    
    // Test password
    const valid = bcrypt.compareSync('admin123', user.password);
    console.log('Password valid:', valid);
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
})();