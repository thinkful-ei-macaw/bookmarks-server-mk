require('dotenv').config();
const { NODE_ENV, DB_URL, TEST_DB_URL } = require('./src/config');

module.exports = {
  'migrationDirectory': 'migrations',
  'driver': 'pg',
  'connectionString': NODE_ENV === 'test'
    ? TEST_DB_URL
    : DB_URL
};