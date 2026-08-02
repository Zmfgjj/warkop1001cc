const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function test() {
  console.log('Connecting with config:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✅ Connection successful!');
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:', tables);
    
    const [users] = await connection.query('SELECT id, nama, username, role, aktif FROM users');
    console.log('Users in database:', users);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

test();
