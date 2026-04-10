const dbModule = require('./src/models/database');
const db = dbModule.getDb();
console.log('DB opened:', db.open);

try {
  const users = db.prepare('SELECT * FROM users LIMIT 5').all();
  console.log('Users:', users);
  console.log('Total users:', users.length);
} catch(e) {
  console.error('Error:', e.message);
}
