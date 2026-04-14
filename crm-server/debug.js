const Database = require('better-sqlite3');
const db = new Database('./data/crm.db');

console.log('=== TABLAS EN DB ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name));

console.log('\n=== TABLA USERS ===');
const cols = db.prepare("PRAGMA table_info(users)").all();
console.log(cols.map(c => c.name));

console.log('\n=== CONSULTAS DE PRUEBA ===');
try {
  const test1 = db.prepare("SELECT COUNT(*) as total FROM users").get();
  console.log('SELECT COUNT users:', test1);
} catch(e) {
  console.log('ERROR:', e.message);
}

try {
  const test2 = db.prepare("SELECT puntos FROM users LIMIT 1").get();
  console.log('SELECT puntos:', test2);
} catch(e) {
  console.log('ERROR:', e.message);
}

db.close();