const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  try {
    // Connection configuration
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'animeBackend',
    });

    console.log('Connection successful!');

    // Test query
    const [rows] = await connection.execute('SELECT * FROM user LIMIT 1');
    console.log('Query result:', rows);

    // Get connection information
    const [connectionInfo] = await connection.execute(
      'SELECT USER(), CURRENT_USER(), DATABASE()',
    );
    console.log('Connection info:', connectionInfo);

    // Get all tables in the database
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Available tables:', tables);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

testDatabaseConnection();
