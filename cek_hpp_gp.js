const { execSync } = require('child_process');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query("SELECT nama, harga, hpp FROM menu WHERE is_deleted = FALSE ORDER BY nama");
    console.log("-------------------------------------------------------------------------");
    console.log("🔍 DAFTAR HARGA, HPP & GROSS PROFIT SELURUH MENU (LIVE DI DATABASE):");
    console.log("-------------------------------------------------------------------------");
    rows.forEach(r => {
      // Hitung persentase HPP
      const hppPersen = r.harga > 0 ? ((r.hpp / r.harga) * 100).toFixed(1) : 0;
      
      // Hitung Gross Profit
      const grossProfit = r.harga - r.hpp;
      const gpPersen = r.harga > 0 ? ((grossProfit / r.harga) * 100).toFixed(1) : 0;
      
      console.log(\`- \${r.nama.padEnd(25)} | Harga: Rp \${String(r.harga).padEnd(6)} | HPP: Rp \${String(r.hpp).padEnd(5)} (\${hppPersen}%) | GP: Rp \${String(grossProfit).padEnd(6)} (\${gpPersen}%)\`);
    });
    console.log("-------------------------------------------------------------------------");
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
console.log("⏳ Mengambil data HPP dan Gross Profit dari server live...");
try {
    const output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/cek_hpp_gp.js && cd /var/www/backend && node cek_hpp_gp.js"`, { encoding: 'utf-8' });
    console.log(output);
} catch(e) {
    console.error("Gagal terhubung atau query error:", e.message);
}
