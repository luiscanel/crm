const Database = require('better-sqlite3');
const db = new Database('./data/crm.db');

console.log('=== ESTRUCTURA RETOS ===');
const retosCols = db.prepare("PRAGMA table_info(retos)").all();
console.log('Columnas:', retosCols.map(c => c.name));

console.log('\n=== ESTRUCTURA PREMIOS ===');
const premiosCols = db.prepare("PRAGMA table_info(premios)").all();
console.log('Columnas:', premiosCols.map(c => c.name));

console.log('\n=== PROBANDO SELECT RETOS ===');
try {
  const retos = db.prepare('SELECT * FROM retos LIMIT 2').all();
  console.log('Retos:', retos);
} catch(e) {
  console.log('ERROR:', e.message);
}

console.log('\n=== PROBANDO SELECT PREMIOS ===');
try {
  const premios = db.prepare('SELECT * FROM premios LIMIT 2').all();
  console.log('Premios:', premios);
} catch(e) {
  console.log('ERROR:', e.message);
}

db.close();