const { execSync } = require('child_process');
execSync('ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "find /var/www/frontend -type d -exec chmod 755 {} \\; ; find /var/www/frontend -type f -exec chmod 644 {} \\;"');
console.log('Permissions fixed!');
