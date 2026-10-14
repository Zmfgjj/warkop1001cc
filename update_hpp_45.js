const { execSync } = require('child_process');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    console.log("🔄 Memperbarui HPP menjadi 45% (Gross Profit 55%) untuk semua menu...");
    
    // Update HPP di tabel menu
    const [resMenu] = await conn.query("UPDATE menu SET hpp = harga * 0.45 WHERE harga > 0");
    console.log("✅ Berhasil memperbarui " + resMenu.affectedRows + " baris di tabel menu.");
    
    // Update HPP di tabel detail_pesanan (historis)
    const [resDetail] = await conn.query("UPDATE detail_pesanan SET hpp = harga * 0.45 WHERE harga > 0");
    console.log("✅ Berhasil memperbarui " + resDetail.affectedRows + " baris di tabel detail_pesanan (histori transaksi).");

    // Tampilkan ulang beberapa data untuk konfirmasi
    const [rows] = await conn.query("SELECT nama, harga, hpp FROM menu WHERE is_deleted = FALSE ORDER BY nama LIMIT 5");
    console.log("\\n🔍 CONTOH HASIL UPDATE (5 MENU):");
    console.log("-------------------------------------------------------------------------");
    rows.forEach(r => {
      const hppPersen = r.harga > 0 ? ((r.hpp / r.harga) * 100).toFixed(1) : 0;
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
console.log("⏳ Mengirim script update HPP ke server live (mohon masukkan password SSH jika diminta)...");
try {
    const output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/update_hpp_45.js && cd /var/www/backend && node update_hpp_45.js"`, { encoding: 'utf-8', stdio: 'inherit' });
    if (output) console.log(output);
} catch(e) {
    console.error("Gagal terhubung atau query error:", e.message);
}
