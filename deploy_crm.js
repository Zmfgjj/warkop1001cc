const fs = require('fs');
const { execSync } = require('child_process');

console.log('1. Deploy crmController.js');
const crmContent = fs.readFileSync('backend/src/controllers/crmController.js');
fs.writeFileSync('temp_crm.b64', crmContent.toString('base64'));
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d > /var/www/backend/src/controllers/crmController.js" < temp_crm.b64', { stdio: 'inherit' });
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 restart warkop-backend"', { stdio: 'inherit' });

console.log('2. Deploy Frontend Bundle');
execSync('node deploy_frontend_base64.js', { stdio: 'inherit' });

console.log('3. Deploy APK');
const apkContent = fs.readFileSync('warkop-pos.apk');
fs.writeFileSync('temp_apk.b64', apkContent.toString('base64'));
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d > /root/warkop.apk" < temp_apk.b64', { stdio: 'inherit' });
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cp /root/warkop.apk /var/www/landing_page/warkop.apk && cp /root/warkop.apk /var/www/frontend/warkop.apk"', { stdio: 'inherit' });
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"', { stdio: 'inherit' });

console.log('DONE!');
