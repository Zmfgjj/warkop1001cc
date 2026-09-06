const { execSync } = require('child_process');

try {
  // Upload the file
  console.log('Uploading script to VPS...');
  execSync('scp -o StrictHostKeyChecking=no update_points_2.js root@202.155.157.13:/var/www/backend/update_points_2.js', { stdio: 'inherit' });

  // Run the file
  console.log('Running script on VPS...');
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cd /var/www/backend && node update_points_2.js"', { stdio: 'inherit' });

  console.log('Done!');
} catch (e) {
  console.error('Error:', e);
}
