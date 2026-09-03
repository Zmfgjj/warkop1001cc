const { execSync } = require('child_process');

console.log("🚀 Menyimpan perubahan ke sistem lokal...");
try {
  execSync('git add frontend/src/pages/ManajemenMenu.jsx backend/src/controllers/menuController.js', { stdio: 'inherit' });
  execSync('git commit -m "Update HPP massal menjadi 35%"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
} catch(e) {
  console.log("⚠️ Gagal git push (Mungkin tidak ada perubahan baru atau konflik), lanjut ke VPS...");
}

console.log("🌐 Menghubungkan ke VPS Warkop1001CC...");

const scriptMigrasi = `
const db = require('./src/config/database');

async function run() {
  let conn;
  try {
    conn = await db.getConnection();
    console.log("Memulai migrasi HPP menjadi 35%...");
    
    // 1. Update Master Menu
    console.log("1. Mengupdate master menu...");
    const [res1] = await conn.query('UPDATE menu SET hpp = harga * 0.35 WHERE is_deleted = FALSE');
    console.log(\`✅ \${res1.affectedRows} menu berhasil diupdate HPP-nya.\`);
    
    // 2. Update Histori Pesanan (Hanya dari 1 September 2026 dan seterusnya)
    console.log("2. Mengupdate histori pesanan dari 1 September 2026...");
    const [res2] = await conn.query(\`
      UPDATE detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      SET dp.hpp = dp.harga * 0.35
      WHERE p.created_at >= '2026-09-01 00:00:00'
    \`);
    console.log(\`✅ \${res2.affectedRows} item pesanan (sejak 1 Sept 2026) berhasil diupdate HPP-nya.\`);
    
    console.log("🎉 Migrasi HPP 35% Selesai!");
  } catch(e) {
    console.error("❌ Error saat migrasi:", e);
  } finally {
    if(conn) conn.release();
    process.exit(0);
  }
}
run();
`;

const b64Migrasi = Buffer.from(scriptMigrasi).toString('base64');

const scriptVPS = `
cd /var/www || cd /var/www/warkop1001cc
echo "⬇️ Menarik kode terbaru dari GitHub..."
git pull

echo "♻️ Restarting Backend API..."
cd backend && pm2 restart all

echo "🗄️ Menjalankan Migrasi Database HPP 35%..."
echo '${b64Migrasi}' | base64 -d > migrasi_hpp_35.js
node migrasi_hpp_35.js

echo "🏗️ Membangun ulang Website (Mohon tunggu 1-2 menit)..."
cd ../frontend
npm run build

echo "✅ SELESAI! Silakan refresh website kasir Anda."
`;

const b64 = Buffer.from(scriptVPS).toString('base64');
try {
  execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d | bash"`, { stdio: 'inherit' });
} catch(e) {
  console.error("❌ Gagal mendeploy ke VPS:", e.message);
}
