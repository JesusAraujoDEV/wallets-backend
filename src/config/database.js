const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('connect', () => {
  console.log('Base de datos conectada exitosamente!');
});

pool.on('error', (err) => {
    console.error('Error inesperado en el cliente de la base de datos', err);
    process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
