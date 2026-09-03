const { execSync } = require('child_process');

const script = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query("DESCRIBE menu");
    console.log("=== STRUKTUR TABEL MENU ===");
    console.table(rows);
    
    const [pesanan] = await conn.query("DESCRIBE detail_pesanan");
    console.log("=== STRUKTUR TABEL DETAIL PESANAN ===");
    console.table(pesanan);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
} run();
`;

const b64 = Buffer.from(script).toString('base64');
try {
  console.log(execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/check_db.js && cd /var/www/backend && node check_db.js"`, {encoding: 'utf-8'}));
} catch(e) {
  console.error("Error:", e.message);
}
