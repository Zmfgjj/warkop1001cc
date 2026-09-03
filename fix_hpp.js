const { execSync } = require('child_process');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    // Memaksa HPP menjadi benar-benar 24% dari harga jual
    await conn.query("UPDATE menu SET hpp = harga * 0.24 WHERE harga > 0");
    console.log("✅ SUKSES! Seluruh HPP di database telah disetel ulang secara paksa menjadi murni 24%.");
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
console.log("⏳ Sedang memprogram ulang database VPS secara paksa...");
try {
    const output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/fix_hpp.js && cd /var/www/backend && node fix_hpp.js"`, { encoding: 'utf-8' });
    console.log(output);
} catch(e) {
    console.error("Gagal terhubung:", e.message);
}
