const { execSync } = require('child_process');
execSync('scp -o StrictHostKeyChecking=no backend/src/routes/laporan.js root@202.155.157.13:/var/www/backend/src/routes/laporan.js', { stdio: 'inherit' });
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 restart warkop-backend"', { stdio: 'inherit' });
console.log('laporan.js deployed!');
