const fs = require('fs');
const { execSync } = require('child_process');

try {
  console.log('Menyiapkan file migrasi_opsi_a.js...');
  const content = fs.readFileSync('migrasi_opsi_a.js');
  const b64 = content.toString('base64');
  fs.writeFileSync('temp_migrasi.b64', b64);

  console.log('Meng-upload ke VPS...');
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d > /var/www/backend/migrasi_opsi_a.js" < temp_migrasi.b64', { stdio: 'inherit' });
  
  console.log('\nUpload sukses! Menjalankan script di database VPS...');
  execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cd /var/www/backend && node migrasi_opsi_a.js"', { stdio: 'inherit' });
  
  console.log('\n✅ EKSEKUSI SELESAI!');
} catch(e) {
  console.error('\n❌ Gagal saat menjalankan script di VPS:', e.message);
}
