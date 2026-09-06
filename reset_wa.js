const { execSync } = require('child_process');

try {
  console.log('Resetting WhatsApp Gateway Session...');
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cd /var/www/backend && rm -rf .wwebjs_auth && pm2 restart warkop-backend"', { stdio: 'inherit' });
  console.log('Session reset successfully. Please refresh the CRM page and scan the new QR code quickly.');
} catch (e) {
  console.error('Error:', e.message);
}
