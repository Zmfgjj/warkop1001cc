const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function resetAndImport() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to database');

    // Disable foreign key check sementara
    console.log('🗑️  Disabling foreign key check...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete semua related data
    console.log('🗑️  Deleting old data...');
    await connection.query('DELETE FROM pesanan');
    await connection.query('DELETE FROM users');
    
    // Enable foreign key check kembali
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ All old data deleted');

    // Baca file SQL
    const sqlFile = path.join(__dirname, 'seed_users.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    // Execute query
    console.log('📥 Importing new users...');
    await connection.query(sql);
    console.log('✅ New users imported successfully!');

    // Verify
    const [users] = await connection.query('SELECT id, nama, username, role FROM users');
    console.log('\n📋 Users in database:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, ${user.nama} (${user.username}) [${user.role}]`);
    });

    await connection.end();
    console.log('\n✅ Done! Silakan login dengan akun baru');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

resetAndImport();
