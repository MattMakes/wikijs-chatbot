const knex = require('knex');
const config = require('./config');

const db = knex({
  client: 'pg',
  connection: config.database,
  pool: {
    min: 2,
    max: 10
  }
});

// Test connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✓ Database connection established');
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
  });

module.exports = db;
