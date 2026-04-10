const initSqlJs = require('sql.js');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/crm.db');

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  
  // Check existing users
  console.log('📋 Usuarios actuales:');
  const stmt = db.prepare('SELECT id, email, name, role FROM users');
  while(stmt.step()) {
    const row = stmt.getAsObject();
    console.log(`  - ${row.email} (${row.name}) - ${row.role}`);
  }
  stmt.free();
  
  // Add user if not exists
  const email = 'luis.c@teknao.com.gt';
  const existing = db.exec(`SELECT id FROM users WHERE email = '${email}'`);
  
  if (existing.length > 0 && existing[0].values.length > 0) {
    console.log('👤 Usuario ya existe, actualizando password...');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
  } else {
    console.log('➕ Creando usuario nuevo...');
    const { v4: uuidv4 } = require('uuid');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run(
      "INSERT INTO users (id, email, password, name, role, puntos) VALUES (?, ?, ?, ?, ?, ?)",
      [uuidv4(), email, hashedPassword, 'Luis Cifuentes', 'admin', 0]
    );
  }
  
  // Save
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  console.log('✅ Usuario configurado: luis.c@teknao.com.gt / admin123');
  
  db.close();
})();