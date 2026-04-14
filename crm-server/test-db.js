const initDatabase = require('./src/models/database').initDatabase;

console.log('=== INICIANDO TEST ===');
try {
  const db = initDatabase();
  console.log('✅ DB Init OK');
  
  console.log('Probando SELECT users...');
  const user1 = db.get('SELECT * FROM users WHERE email = ?', ['admin@teknao.com.gt']);
  console.log('User 1:', user1 ? 'found' : 'not found');
  
  console.log('Probando SELECT empresas...');
  const emp1 = db.get('SELECT COUNT(*) as c FROM empresas');
  console.log('Empresas count:', emp1.c);
  
  console.log('=== TEST COMPLETADO ===');
} catch(e) {
  console.log('ERROR:', e.message);
  console.log('STACK:', e.stack);
}