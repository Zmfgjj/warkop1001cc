const { execSync } = require('child_process');
execSync('scp -r -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no backend/src/* root@202.155.157.13:/var/www/backend/src/');
execSync('ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 restart warkop-backend"');
