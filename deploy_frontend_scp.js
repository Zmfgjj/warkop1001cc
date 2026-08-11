const { execSync } = require('child_process');

console.log('Building frontend...');
execSync('cd frontend && npm run build', {stdio: 'inherit'});

console.log('Zipping dist...');
execSync('cd frontend && tar -czf dist.tar.gz dist', {stdio: 'inherit'});

console.log('Deploying via SCP...');
execSync('scp -o StrictHostKeyChecking=no frontend/dist.tar.gz root@202.155.157.13:/tmp/dist.tar.gz', { stdio: 'inherit' });
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cd /tmp && tar -xzf dist.tar.gz && rm -rf /var/www/frontend/assets/* && cp -r dist/* /var/www/frontend/ && cp /var/www/frontend/capacitor.config.json /var/www/frontend/ || true"', { stdio: 'inherit' });

console.log('Creating OTA bundle.zip on VPS directly...');
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "mkdir -p /tmp/ota && cp -r /var/www/frontend/assets /var/www/frontend/index.html /var/www/frontend/manifest.json /var/www/frontend/sw.js /var/www/frontend/logo* /tmp/ota/ && cp /var/www/frontend/capacitor.config.json /tmp/ota/ && cd /tmp/ota && rm -f /var/www/landing_page/bundle.zip && zip -r /var/www/landing_page/bundle.zip * && rm -rf /tmp/ota"', {stdio: 'inherit'});

execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "chmod -R 755 /var/www/frontend && chown -R www-data:www-data /var/www/frontend"', {stdio: 'inherit'});
console.log('Deployed frontend fallback!');
