const { execSync } = require('child_process');
try {
  const out = execSync('ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "tail -n 300 /root/.pm2/logs/warkop-backend-error.log"');
  console.log(out.toString());
} catch (e) {
  console.error(e.message);
  if (e.stdout) console.log('STDOUT:', e.stdout.toString());
  if (e.stderr) console.log('STDERR:', e.stderr.toString());
}

