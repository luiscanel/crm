const initSqlJs = require('sql.js');
const fs = require('fs');
const bcrypt = require('bcryptjs');

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync('./data/crm.db'));
  
  const stmt = db.prepare('SELECT id, email, password FROM users WHERE email = ?');
  stmt.bind(['luis.c@teknao.com.gt']);
  stmt.step();
  const user = stmt.getAsObject();
  
  console.log('User from DB:', JSON.stringify(user));
  console.log('Password:', user.password);
  console.log('Password length:', user.password?.length);
  
  if (user.password) {
    const valid = bcrypt.compareSync('admin123', user.password);
    console.log('Password valid:', valid);
  } else {
    console.log('NO PASSWORD IN DB!');
  }
  
  stmt.free();
  db.close();
})();