const fs = require('fs');
try {
  const log = fs.readFileSync('/root/.pm2/logs/warkop-backend-error.log', 'utf8');
  const lines = log.split('\n');
  const last50 = lines.slice(Math.max(lines.length - 50, 0));
  console.log(last50.join('\n'));
} catch(e) { console.log(e); }
