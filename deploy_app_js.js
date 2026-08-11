const fs = require('fs');
const { execSync } = require('child_process');

const content = fs.readFileSync('backend/src/app.js');
const b64 = content.toString('base64');
fs.writeFileSync('temp_app.b64', b64);

console.log('Deploying app.js via base64...');
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d > /var/www/backend/src/app.js" < temp_app.b64', { stdio: 'inherit' });
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 restart warkop-backend"', { stdio: 'inherit' });
console.log('Deployed app.js!');
