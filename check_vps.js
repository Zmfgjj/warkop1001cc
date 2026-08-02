const { execSync } = require('child_process');
const out = execSync('ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "cat /proc/cpuinfo | grep processor | wc -l; vmstat 1 3; iostat -x 1 2 2>/dev/null || echo no_iostat; netstat -an | grep :80 | wc -l; netstat -an | grep :443 | wc -l; nginx -v 2>&1; node --version"').toString();
console.log(out);
