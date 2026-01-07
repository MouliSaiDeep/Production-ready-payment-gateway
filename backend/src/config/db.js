const { Pool } = require('pg');
require('dotenv').config()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('Database connected successfully');
});

pool.on('error', (err) => {
    console.log('Unexpected error on idle client', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};