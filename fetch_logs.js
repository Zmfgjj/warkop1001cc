const { execSync } = require('child_process');
try {
  const out = execSync('ssh root@103.253.213.177 "tail -n 50 /root/.pm2/logs/warkop-backend-error.log"');
  console.log(out.toString());
} catch (e) {
  console.error(e.message);
}
