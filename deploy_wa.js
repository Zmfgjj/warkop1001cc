const fs = require('fs');
const { execSync } = require('child_process');

const content = fs.readFileSync('backend/src/services/waGateway.js');
const b64 = content.toString('base64');
fs.writeFileSync('temp_wa.b64', b64);

console.log('Deploying waGateway.js via base64...');
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d > /var/www/backend/src/services/waGateway.js" < temp_wa.b64', { stdio: 'inherit' });

console.log('Deleting .wwebjs_auth session on VPS...');
try {
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "rm -rf /var/www/backend/.wwebjs_auth"', { stdio: 'inherit' });
} catch (e) { console.error('Failed to rm auth'); }

try {
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "rm -rf /var/www/backend/.wwebjs_cache"', { stdio: 'inherit' });
} catch (e) { console.error('Failed to rm cache'); }

try {
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "pkill -f chrome"', { stdio: 'inherit' });
} catch (e) { console.error('Failed to kill chrome'); }

console.log('Restarting PM2 backend...');
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 restart warkop-backend"', { stdio: 'inherit' });

console.log('Deploy & Reset Complete!');
