const { execSync } = require('child_process');
execSync('scp -o StrictHostKeyChecking=no backend/src/app.js root@202.155.157.13:/var/www/backend/src/app.js', { stdio: 'inherit' });
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 restart warkop-backend"', { stdio: 'inherit' });
console.log('App.js deployed!');
