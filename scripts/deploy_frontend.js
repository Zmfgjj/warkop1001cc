const { execSync } = require('child_process');

// Build first
console.log('Building frontend...');
execSync('cd frontend && npm run build', {stdio: 'inherit'});

// Clean old assets on VPS so cached HTML files are forced to reload
console.log('Cleaning old assets on VPS...');
execSync('ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "rm -rf /var/www/frontend/assets/*"');

// Upload files
console.log('Uploading frontend dist...');
execSync('scp -r -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no frontend/dist/* root@202.155.157.13:/var/www/frontend/');
execSync('scp -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no frontend/capacitor.config.json root@202.155.157.13:/var/www/frontend/');

// Create and upload OTA bundle.zip
console.log('Creating OTA bundle.zip on VPS directly...');
execSync('ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "mkdir -p /tmp/ota && cp -r /var/www/frontend/assets /var/www/frontend/index.html /var/www/frontend/manifest.json /var/www/frontend/sw.js /var/www/frontend/logo* /tmp/ota/ && cp /var/www/frontend/capacitor.config.json /tmp/ota/ && cd /tmp/ota && rm -f /var/www/landing_page/bundle.zip && zip -r /var/www/landing_page/bundle.zip * && rm -rf /tmp/ota"');

// Fix permissions so nginx (www-data) can read all files
console.log('Fixing file permissions...');
execSync('ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "chmod -R 755 /var/www/frontend && chown -R www-data:www-data /var/www/frontend"');

console.log('✅ Deployed and permissions set!');
