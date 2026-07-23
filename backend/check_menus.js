const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMenus() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    const [menus] = await connection.query('SELECT * FROM menu');
    console.log('Total menus in database:', menus.length);
    console.log('Menus:', menus);
    
    const [categories] = await connection.query('SELECT * FROM kategori');
    console.log('Total categories in database:', categories.length);
    console.log('Categories:', categories);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMenus();
