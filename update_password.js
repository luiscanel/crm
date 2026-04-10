const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:R.U4,%g4fTzt+UV@db.kfohysmglpsdmobldsnk.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const bcrypt = require('bcryptjs');

// Usar el hash correcto del SQL original
const hash = '$2a$10$lisp.c5satINuijJUhFLnOpMlEYVxfrGeSw7Yo69YYJA3Dp6YX8na';

async function updatePassword() {
  console.log('Setting password with hash:', hash);
  console.log('Verify password:', bcrypt.compareSync('admin123', hash));
  
  await pool.query(
    'UPDATE public.users SET password = $1 WHERE email = $2',
    [hash, 'luis.c@teknao.com.gt']
  );
  
  console.log('Password updated!');
}

updatePassword().then(() => process.exit()).catch(err => { console.error(err); process.exit(1); });
