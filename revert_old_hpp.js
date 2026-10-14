const { execSync } = require('child_process');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    console.log("🔄 Mengembalikan HPP transaksi sebelum 1 Oktober 2026 menjadi 35% (GP 65%)...");
    
    // Update HPP di tabel detail_pesanan dengan melakukan JOIN ke pesanan untuk mengecek tanggal
    const query = \`
      UPDATE detail_pesanan dp 
      JOIN pesanan p ON dp.pesanan_id = p.id 
      SET dp.hpp = dp.harga * 0.35 
      WHERE p.created_at < '2026-10-01 00:00:00' 
      AND dp.harga > 0
    \`;
    
    const [resDetail] = await conn.query(query);
    console.log("✅ Berhasil mengembalikan HPP " + resDetail.affectedRows + " baris detail_pesanan ke 35%.");

    // Menu akan dibiarkan 45% agar pesanan ke depannya tetap 45%.
    console.log("✅ Tabel menu (master data) tetap dibiarkan menggunakan HPP 45%.");

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
console.log("⏳ Mengirim script perbaikan HPP ke server live (mohon masukkan password SSH jika diminta)...");
try {
    const output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/revert_old_hpp.js && cd /var/www/backend && node revert_old_hpp.js"`, { encoding: 'utf-8', stdio: 'inherit' });
    if (output) console.log(output);
} catch(e) {
    console.error("Gagal terhubung atau query error:", e.message);
}
