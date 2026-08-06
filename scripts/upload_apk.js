const { execSync } = require('child_process');

console.log('Copying APK to workspace root...');
execSync('powershell -Command "Copy-Item -Path frontend\\\\android\\\\app\\\\build\\\\outputs\\\\apk\\\\debug\\\\app-debug.apk -Destination warkop-pos.apk -Force"');

console.log('Uploading APK to landing page folder...');
execSync('scp -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no warkop-pos.apk root@202.155.157.13:/var/www/landing_page/warkop.apk', {stdio: 'inherit'});

console.log('Uploading APK to frontend folder...');
execSync('scp -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no warkop-pos.apk root@202.155.157.13:/var/www/frontend/warkop.apk', {stdio: 'inherit'});

console.log('Fixing permissions...');
execSync('ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"', {stdio: 'inherit'});

console.log('✅ APK Uploaded!');
