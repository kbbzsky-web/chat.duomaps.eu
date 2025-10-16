const mysql = require('mysql2/promise');

// Datenbank-Pool erstellen
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'kbbzsky_admin',
  password: process.env.DB_PASSWORD || '#Skybecker',
  database: process.env.DB_NAME || 'chatapp_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test Connection
pool.getConnection()
  .then(connection => {
    console.log('📊 MySQL Pool erstellt');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL Pool Fehler:', err);
  });

module.exports = pool;