const fs = require('fs');
const { execSync } = require('child_process');

console.log('Packaging backend src directory...');
try {
  // Compress the entire src folder so we never miss a file again
  execSync('tar -czf backend_src.tar.gz -C backend src', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to compress backend src', e);
  process.exit(1);
}

console.log('Deploying backend files via base64...');
const tarContent = fs.readFileSync('backend_src.tar.gz');
fs.writeFileSync('temp_backend.b64', tarContent.toString('base64'));

// Send base64 to VPS, decode, extract, and restart PM2
try {
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d > /tmp/backend_src.tar.gz && tar -xzf /tmp/backend_src.tar.gz -C /var/www/backend && rm /tmp/backend_src.tar.gz" < temp_backend.b64', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to deploy', e);
  process.exit(1);
}

execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 restart warkop-backend"', { stdio: 'inherit' });

// Cleanup
try {
  fs.unlinkSync('backend_src.tar.gz');
  fs.unlinkSync('temp_backend.b64');
} catch (e) {}

console.log('Backend deployed successfully!');
