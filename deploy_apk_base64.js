const fs = require('fs');
const { execSync } = require('child_process');

console.log('Copying APK to workspace root...');
execSync('copy /Y frontend\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk warkop-pos.apk', { stdio: 'inherit' });

console.log('Deploying APK via base64...');
const apkContent = fs.readFileSync('warkop-pos.apk');
fs.writeFileSync('temp_apk.b64', apkContent.toString('base64'));

try {
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d > /tmp/warkop-pos.apk" < temp_apk.b64', { stdio: 'inherit' });
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cp /tmp/warkop-pos.apk /var/www/landing_page/warkop.apk && cp /tmp/warkop-pos.apk /var/www/frontend/warkop.apk && chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to deploy APK', e);
  process.exit(1);
}

try {
  fs.unlinkSync('temp_apk.b64');
} catch (e) {}

console.log('APK deployed successfully!');
