// test-db.js
const pool = require('./db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados', err);
  } else {
    console.log('Conexão com o banco de dados bem-sucedida');
  }
  pool.end(); // Encerra a conexão
});
