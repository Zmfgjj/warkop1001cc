const { execSync } = require('child_process');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query("SELECT nama, harga, hpp FROM menu ORDER BY nama");
    console.log("--------------------------------------------------");
    console.log("🔍 DAFTAR HARGA & HPP SELURUH MENU (LIVE DI DATABASE):");
    console.log("--------------------------------------------------");
    rows.forEach(r => {
      // Hitung persentase HPP
      const persen = r.harga > 0 ? ((r.hpp / r.harga) * 100).toFixed(1) : 0;
      console.log(\`- \${r.nama.padEnd(20)} | Harga: Rp \${String(r.harga).padEnd(6)} | HPP: Rp \${String(r.hpp).padEnd(5)} (\${persen}%)\`);
    });
    console.log("--------------------------------------------------");
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
console.log("⏳ Sedang menyusup ke Manajemen Menu untuk mengecek nilai HPP...");
try {
    const output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/cek_hpp.js && cd /var/www/backend && node cek_hpp.js"`, { encoding: 'utf-8' });
    console.log(output);
} catch(e) {
    console.error("Gagal terhubung:", e.message);
}
