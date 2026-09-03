const { execSync } = require('child_process');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query("SELECT MIN(DATE(p.created_at)) as tgl_awal, MAX(DATE(p.created_at)) as tgl_akhir FROM detail_pesanan dp JOIN pesanan p ON dp.pesanan_id = p.id JOIN menu m ON dp.menu_id = m.id WHERE m.nama LIKE '%Brown sugar latte%' AND dp.harga = 22000 AND p.status = 'selesai'");
    console.log("-----------------------------------------");
    console.log("📅 Rentang Waktu Pesanan (Harga 22k):");
    console.log("Dari Tanggal   :", rows[0].tgl_awal);
    console.log("Sampai Tanggal :", rows[0].tgl_akhir);
    console.log("-----------------------------------------");
  } catch(e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
}
run();
`;

const b64 = Buffer.from(scriptVPS).toString('base64');
console.log("⏳ Sedang melacak rentang tanggal ke database...");
try {
    const output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/cek_22k_tgl.js && cd /var/www/backend && node cek_22k_tgl.js"`, { encoding: 'utf-8' });
    console.log(output);
} catch(e) {
    console.error("Gagal terhubung:", e.message);
}
