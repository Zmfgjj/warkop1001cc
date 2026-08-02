const { execSync } = require('child_process');
const out = execSync('ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "mysql -u root -e \\"SHOW STATUS LIKE \'Max_used_connections\'; SHOW STATUS LIKE \'Threads_connected\'; SHOW VARIABLES LIKE \'max_connections\';\\"" 2>&1').toString();
console.log(out);
