const fs = require('fs');
const { execSync } = require('child_process');

console.log('Deploying app.js...');
const appContent = fs.readFileSync('backend/src/app.js');
fs.writeFileSync('temp_app.b64', appContent.toString('base64'));
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d > /var/www/backend/src/app.js" < temp_app.b64', { stdio: 'inherit' });
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 restart warkop-backend"', { stdio: 'inherit' });
console.log('DONE deploying app.js');
