const { execSync } = require('child_process');

const scriptContent = `
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/var/www/backend/.env' });
async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warkop'
  });
  try {
    const [pembayaran] = await conn.query("UPDATE pembayaran SET status = 'sukses' WHERE status = 'pending'");
    console.log('Total Pembayaran (Pending -> Sukses) yang berhasil diperbaiki:', pembayaran.affectedRows);
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    conn.end();
  }
}
run();
`;

const base64Content = Buffer.from(scriptContent).toString('base64');

try {
  console.log('Running script on VPS...');
  const output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo ${base64Content} | base64 -d > /var/www/backend/fix_db_temp.js && cd /var/www/backend && node fix_db_temp.js && rm fix_db_temp.js"`, { encoding: 'utf-8' });
  console.log('Output:', output);
} catch (e) {
  console.error('Error:', e.message);
}
