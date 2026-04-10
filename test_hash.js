const bcrypt = require('bcryptjs');

const hash = '$2a$10$lisp.c5satINuijJUhFLnOpMlEYVxfrGeSw7Yo69YYJA3Dp6YX8na';

console.log('Testing password "admin123":');
console.log(bcrypt.compareSync('admin123', hash));
