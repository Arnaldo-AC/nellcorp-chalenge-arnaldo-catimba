// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'db_nellcorp',
  password: 'Caxilemba3',
  port: 5432, // Porta padrão do PostgreSQL
});

module.exports = pool;


