const { execSync } = require('child_process');
const fs = require('fs');

console.log('Writing SFTP batch file...');
fs.writeFileSync('sftp_batch.txt', `
put warkop-pos.apk /tmp/warkop-pos.apk
exit
`);

console.log('Uploading via SFTP...');
try {
  execSync('sftp -o StrictHostKeyChecking=no -b sftp_batch.txt root@202.155.157.13', {stdio: 'inherit'});
  
  console.log('Copying to web directories...');
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cp /tmp/warkop-pos.apk /var/www/landing_page/warkop.apk && cp /tmp/warkop-pos.apk /var/www/frontend/warkop.apk && chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"', {stdio: 'inherit'});
  console.log('Done uploading via SFTP!');
} catch (err) {
  console.error('SFTP failed:', err.message);
}
