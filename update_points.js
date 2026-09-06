const { execSync } = require('child_process');

const scriptContent = `
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/var/www/backend/.env' });
async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warkop'
  });
  
  const data = [
    { no: '089512411988', nama: 'Rani', point: 2250 },
    { no: '085772227311', nama: 'Risma', point: 1270 },
    { no: '085183100596', nama: 'Reza', point: 900 },
    { no: '089673745628', nama: 'Naufal', point: 220 }
  ];

  try {
    // 1. Update the 4 numbers
    for (const item of data) {
      const [rows] = await conn.query('SELECT * FROM members WHERE no_hp = ?', [item.no]);
      if (rows.length > 0) {
        await conn.query('UPDATE members SET point = ?, nama = ? WHERE no_hp = ?', [item.point, item.nama, item.no]);
        console.log(\`Updated \${item.nama} (\${item.no}) to \${item.point} points.\`);
      } else {
        await conn.query('INSERT INTO members (nama, nama_panggilan, no_hp, point) VALUES (?, ?, ?, ?)', [item.nama, item.nama, item.no, item.point]);
        console.log(\`Inserted \${item.nama} (\${item.no}) with \${item.point} points.\`);
      }
    }
    
    // 2. Set Isti and Yunus to 0
    const [resIsti] = await conn.query('UPDATE members SET point = 0 WHERE nama LIKE ? OR nama_panggilan LIKE ?', ['%isti%', '%isti%']);
    console.log(\`Updated Isti point to 0, matched: \${resIsti.affectedRows}\`);

    const [resYunus] = await conn.query('UPDATE members SET point = 0 WHERE nama LIKE ? OR nama_panggilan LIKE ?', ['%yunus%', '%yunus%']);
    console.log(\`Updated Yunus point to 0, matched: \${resYunus.affectedRows}\`);

  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    conn.end();
  }
}
run();
`;

const base64Content = Buffer.from(scriptContent).toString('base64');

try {
  console.log('Running points update script on VPS...');
  execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo ${base64Content} | base64 -d > /var/www/backend/fix_points.js && cd /var/www/backend && node fix_points.js && rm fix_points.js"`, { stdio: 'inherit' });
  console.log('Update Poin Berhasil!');
} catch (e) {
  console.error('Error:', e.message);
}
