const Database = require('better-sqlite3');
const dbPath = './data/crm.db';
const db = new Database(dbPath);

console.log('Agregando columnas a users...');
try {
  db.exec("ALTER TABLE users ADD COLUMN puntos INTEGER DEFAULT 0");
  console.log('✅ puntos agregada');
} catch(e) {
  console.log('puntos ya existe o error:', e.message);
}

try {
  db.exec("ALTER TABLE users ADD COLUMN puntos_mes INTEGER DEFAULT 0");
  console.log('✅ puntos_mes agregada');
} catch(e) {
  console.log('puntos_mes ya existe o error:', e.message);
}

console.log('✅ Migración completada');
db.close();