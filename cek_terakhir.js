const { execSync } = require('child_process');
const b64 = Buffer.from(`
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query("SELECT m.nama, p.created_at, dp.qty FROM detail_pesanan dp JOIN pesanan p ON dp.pesanan_id = p.id JOIN menu m ON dp.menu_id = m.id WHERE m.nama LIKE '%Milky love%' OR m.nama LIKE '%Creamy tea%' OR m.nama LIKE '%Sweet honey tea%' OR m.nama LIKE '%Lemon tea%' OR m.nama LIKE '%Peach tea%' ORDER BY p.created_at DESC LIMIT 1");
    if(rows.length>0){
      const d = new Date(rows[0].created_at);
      const j = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
      console.log('🛎️ INFO PESANAN TERBARU: Minuman baru saja dipesan pada jam ' + j + ' WIB. Menu: ' + rows[0].qty + ' gelas ' + rows[0].nama);
    } else {
      console.log('Belum ada pesanan.');
    }
  } catch(e) {
  } finally {
    process.exit(0);
  }
} run();
`).toString('base64');
try {
  console.log(execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/cek_akhir.js && cd /var/www/backend && node cek_akhir.js"`, {encoding:'utf8'}));
} catch(e) {
  console.error("Gagal terhubung.");
}
