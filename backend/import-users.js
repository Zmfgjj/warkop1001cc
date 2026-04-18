const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function importUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to database');

    // Baca file SQL
    const sqlFile = path.join(__dirname, 'seed_users.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    // Execute query
    await connection.query(sql);
    console.log('✅ Users imported successfully!');

    // Verify
    const [users] = await connection.query('SELECT id, nama, username, role FROM users');
    console.log('\n📋 Users in database:');
    users.forEach(user => {
      console.log(`  - ${user.nama} (${user.username}) [${user.role}]`);
    });

    await connection.end();
    console.log('\n✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

importUsers();
