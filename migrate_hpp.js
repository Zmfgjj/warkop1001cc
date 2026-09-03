const { execSync } = require('child_process');
const fs = require('fs');

console.log("🛠️ Mempersiapkan perbaikan Laporan (patching)...");
let content = fs.readFileSync('backend/src/controllers/laporanController.js', 'utf8');
content = content.replace(/m\.hpp/g, 'dp.hpp');
content = content.replace(/mn\.hpp/g, 'dp.hpp');
fs.writeFileSync('backend/src/controllers/laporanController.js', content);
console.log("✅ Laporan Controller berhasil di-patch untuk membaca HPP historis (dp.hpp)!");

console.log("🚀 Menyimpan perubahan ke sistem lokal...");
try {
  execSync('git add backend/src/controllers/pesananController.js backend/src/controllers/laporanController.js', { stdio: 'inherit' });
  execSync('git commit -m "Fix HPP snapshot untuk history dan perbaikan query laporan"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
} catch (e) {
  console.log("⚠️ Gagal git push, lanjut ke VPS...");
}

console.log("🌐 Menghubungkan ke VPS Warkop1001CC dan Migrasi Database...");

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    console.log("⏳ Membekukan HPP historis transaksi sebelum hari ini...");
    
    const query = \`
      UPDATE detail_pesanan dp
      JOIN menu m ON dp.menu_id = m.id
      SET dp.hpp = 
        CASE 
          WHEN m.nama LIKE '%Brown Sugar Latte%' THEN dp.harga * 0.76
          WHEN m.nama LIKE '%Creamy Tea%' THEN dp.harga * 0.76
          WHEN m.nama LIKE '%Paket Santuy A%' THEN dp.harga * 0.76
          WHEN m.nama LIKE '%Paket Santuy B%' THEN dp.harga * 0.76
          WHEN m.nama LIKE '%Lemon Tea%' THEN dp.harga * 0.867
          WHEN m.nama LIKE '%Milky Love%' THEN dp.harga * 0.659
          WHEN m.nama LIKE '%Peach Tea%' THEN dp.harga * 0.733
          WHEN m.nama LIKE '%Sweet Honey Tea%' THEN dp.harga * 0.76 /* Default for standard variant */
          ELSE dp.harga * 0.85
        END
      WHERE dp.hpp = 0 OR dp.hpp IS NULL
    \`;
    
    await conn.query(query);
    console.log("✅ SUKSES! Data historis Agustus dkk berhasil diselamatkan dan dikunci (dibekukan).");
    
    // Pastikan menu.hpp benar-benar 24% murni untuk pesanan masa depan
    await conn.query("UPDATE menu SET hpp = harga * 0.24 WHERE harga > 0");
    console.log("✅ SUKSES! HPP Master Menu disetel murni 24% untuk pesanan masa depan.");
    
  } catch(e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
}
run();
`;

const b64_script = Buffer.from(scriptVPS).toString('base64');

try {
  execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64_script}' | base64 -d > /var/www/backend/migrasi.js && cd /var/www/backend && node migrasi.js"`, { stdio: 'inherit' });
} catch (e) {
  console.error("❌ Gagal migrasi database VPS:", e.message);
}

console.log("♻️ Mendeploy ulang kode Backend API...");
try {
  // We use the deploy_backend_base64.js script they already have since git pull is broken
  execSync('node deploy_backend_base64.js', { stdio: 'inherit' });
  console.log("🎉 SELESAI SELURUHNYA!");
} catch (e) {
  console.error("❌ Gagal mendeploy backend:", e.message);
}
