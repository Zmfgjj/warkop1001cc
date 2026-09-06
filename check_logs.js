const { execSync } = require('child_process');

try {
  console.log('Fetching PM2 logs from VPS...');
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 logs warkop-backend --lines 50 --nostream"', { stdio: 'inherit' });
} catch (e) {
  console.error('Error:', e.message);
}
