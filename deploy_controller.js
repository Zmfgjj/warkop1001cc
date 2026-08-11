const fs = require('fs');
const { execSync } = require('child_process');

const content = fs.readFileSync('backend/src/controllers/laporanController.js');
const b64 = content.toString('base64');
fs.writeFileSync('temp.b64', b64);

console.log('Deploying via base64...');
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d > /var/www/backend/src/controllers/laporanController.js" < temp.b64', { stdio: 'inherit' });
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 restart warkop-backend"', { stdio: 'inherit' });
console.log('Deployed!');
