const { execSync } = require('child_process');

console.log('--- DEPLOY ALL ---');

try {
  console.log('1. Deploy Backend to VPS...');
  execSync('node deploy_backend_base64.js', { stdio: 'inherit' });

  console.log('1.5. Deploy Frontend Web to VPS...');
  execSync('node deploy_frontend_base64.js', { stdio: 'inherit' });

  console.log('2. Sync Capacitor & Build Android APK...');
  execSync('cd frontend && npx cap sync android && cd android && gradlew assembleDebug', { stdio: 'inherit' });

  console.log('3. Move APK...');
  execSync('copy /Y frontend\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk warkop-pos.apk', { stdio: 'inherit' });

  console.log('4. Upload APK ke VPS Server...');
  const fs = require('fs');
  const apkContent = fs.readFileSync('warkop-pos.apk');
  fs.writeFileSync('temp_apk.b64', apkContent.toString('base64'));
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d > /var/www/landing_page/warkop.apk" < temp_apk.b64', { stdio: 'inherit' });
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cp /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"', { stdio: 'inherit' });
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"', { stdio: 'inherit' });

  console.log('5. Commit and Push...');
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "chore: deploy update CRM filter bulan dan HPP massal"', { stdio: 'inherit' });
  execSync('git push origin revisi', { stdio: 'inherit' });

  console.log('--- ALL DEPLOYMENTS FINISHED SUCCESSFULLY ---');
} catch (e) {
  console.error('Deployment Failed!', e);
}
