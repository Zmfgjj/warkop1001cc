const { execSync } = require('child_process');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query("DESCRIBE detail_pesanan");
    console.log("Struktur tabel detail_pesanan:");
    console.table(rows);
  } catch(e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
}
run();
`;

const b64 = Buffer.from(scriptVPS).toString('base64');
try {
    const output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/cek_kolom.js && cd /var/www/backend && node cek_kolom.js"`, { encoding: 'utf-8' });
    console.log(output);
} catch(e) {
    console.error("Gagal terhubung:", e.message);
}
