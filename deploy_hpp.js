const { execSync } = require('child_process');

console.log("🚀 Menyimpan perubahan ke sistem lokal...");
try {
  execSync('git add frontend/src/pages/ManajemenMenu.jsx backend/src/controllers/menuController.js', { stdio: 'inherit' });
  execSync('git commit -m "Fix logic dan teks set massal HPP menjadi 24%"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
} catch(e) {
  console.log("⚠️ Gagal git push (Mungkin tidak ada perubahan baru atau konflik), lanjut ke VPS...");
}

console.log("🌐 Menghubungkan ke VPS Warkop1001CC...");
const scriptVPS = `
cd /var/www || cd /var/www/warkop1001cc
echo "⬇️ Menarik kode terbaru dari GitHub..."
git pull

echo "♻️ Restarting Backend API..."
cd backend && pm2 restart all

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
