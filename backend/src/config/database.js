const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'emr_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Return DATE columns as strings ("YYYY-MM-DD") — MySQL2 pool.execute()
  // returns Date objects for DATE cols by default (interpreted as UTC),
  // which caused date values to shift by 8 hours. Using dateStrings fixes this.
  dateStrings: true,
});

module.exports = pool;
