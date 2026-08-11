const { execSync } = require('child_process');

console.log('Copying APK to workspace root...');
execSync('copy /Y frontend\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk warkop-pos.apk', { stdio: 'inherit' });

console.log('Deploying APK via SCP...');
execSync('scp -o StrictHostKeyChecking=no warkop-pos.apk root@202.155.157.13:/tmp/warkop-pos.apk', { stdio: 'inherit' });
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cp /tmp/warkop-pos.apk /var/www/landing_page/warkop.apk && cp /tmp/warkop-pos.apk /var/www/frontend/warkop.apk && chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"', { stdio: 'inherit' });

console.log('Committing APK to git...');
execSync('git add warkop-pos.apk', { stdio: 'inherit' });
execSync('git commit -m "Update APK (version 1.0.62)"', { stdio: 'inherit' });
execSync('git push vps-repo revisi', { stdio: 'inherit' });

console.log('Done!');
