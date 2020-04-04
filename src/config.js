const { PORT, NODE_ENV, DB_URL, TEST_DB_URL } = process.env;

module.exports = {
  PORT: PORT || 8000,
  NODE_ENV,
  DB_URL,
  TEST_DB_URL
};