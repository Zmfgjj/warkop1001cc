const { execSync } = require('child_process');

console.log('--- DEPLOY ALL ---');

try {
  console.log('1. Deploy Backend to VPS...');
  execSync('node deploy_app_js.js', { stdio: 'inherit' });

  console.log('1.5. Deploy Frontend Web to VPS...');
  execSync('node deploy_frontend_base64.js', { stdio: 'inherit' });

  console.log('2. Sync Capacitor & Build Android APK...');
  execSync('cd frontend && npx cap sync android && cd android && gradlew assembleDebug', { stdio: 'inherit' });

  console.log('3. Move APK...');
  execSync('copy /Y frontend\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk warkop-pos.apk', { stdio: 'inherit' });

  console.log('4. Upload APK via File.io...');
  execSync('node upload_apk_fileio.js', { stdio: 'inherit' });

  console.log('5. Commit and Push...');
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Update password wifi di struk kasir"', { stdio: 'inherit' });
  execSync('git push origin revisi', { stdio: 'inherit' });

  console.log('--- ALL DEPLOYMENTS FINISHED SUCCESSFULLY ---');
} catch (e) {
  console.error('Deployment Failed!', e);
}
