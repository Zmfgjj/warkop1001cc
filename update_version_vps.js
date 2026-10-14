const { execSync } = require('child_process');

console.log('⏳ Mengupdate versi ke 1.0.87 di server VPS...');
try {
  const cmd = `ssh -o StrictHostKeyChecking=no root@202.155.157.13 "sed -i 's/APP_VERSION=.*/APP_VERSION=1.0.87/g' /var/www/backend/.env 2>/dev/null; sed -i 's/1.0.85/1.0.87/g' /var/www/backend/.env 2>/dev/null; pm2 restart warkop-backend --update-env"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('✅ Berhasil update versi ke 1.0.87 dan PM2 restarted!');
} catch (e) {
  console.error('Gagal:', e.message);
}
