const mysql = require('mysql2/promise');
require('dotenv').config();

async function reset() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    // Hash of 'password'
    const newHash = '$2b$10$F7nqn0np3UJgip5/CIBXOO2l7fMC6NEqJDB/xGTQIjCGUCrDVYN5K';
    
    console.log('Updating passwords in users table...');
    const [result] = await connection.query(
      'UPDATE users SET password = ?',
      [newHash]
    );
    
    console.log(`✅ Success! Updated ${result.affectedRows} users.`);
    console.log('All user passwords are now reset to: password');
    
    // Try to reset is_logged_in separately
    try {
      await connection.query('UPDATE users SET is_logged_in = 0');
      console.log('✅ Success! Reset is_logged_in to 0.');
    } catch (e) {
      console.log('⚠️ Could not reset is_logged_in:', e.message);
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error during reset:', error);
  }
}

reset();
