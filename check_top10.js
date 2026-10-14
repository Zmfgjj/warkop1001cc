const { execSync } = require('child_process');
const cmd = `ssh -o StrictHostKeyChecking=no root@202.155.157.13 "mysql -D warkop1001cc -e \\"SELECT id, nama, no_hp, point FROM members ORDER BY point DESC LIMIT 10;\\""`;
try {
  console.log(execSync(cmd, { encoding: 'utf-8' }));
} catch (e) {
  console.error(e.message);
}
