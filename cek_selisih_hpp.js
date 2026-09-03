const { execSync } = require('child_process');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  let conn;
  try {
    conn = await db.getConnection();
    
    // Ambil tanggal hari ini (waktu lokal server)
    const filter = new Date().toISOString().split('T')[0];
    const startDate = \`\${filter} 00:00:00\`;
    const endDate = \`\${filter} 23:59:59\`;
    
    console.log("Mengecek transaksi tanggal:", filter);
    
    const query = \`
      SELECT 
        p.id as pesanan_id, 
        m.nama as menu,
        dp.harga, 
        dp.hpp, 
        dp.qty,
        (dp.harga * 0.24) as hpp_seharusnya,
        dp.hpp - (dp.harga * 0.24) as selisih_per_item
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      JOIN menu m ON dp.menu_id = m.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      AND ABS(dp.hpp - (dp.harga * 0.24)) > 1
    \`;
    
    const [rows] = await conn.query(query, [startDate, endDate]);
    console.log("=== ITEM DENGAN HPP TIDAK SAMA DENGAN 24% ===");
    console.table(rows);
    
    // Check also if there are any discounts
    const discountQuery = \`
      SELECT p.id, p.total, p.discount_value, p.point_used, 
        (SELECT SUM(dp.qty * dp.harga) FROM detail_pesanan dp WHERE dp.pesanan_id = p.id) as subtotal
      FROM pesanan p
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      AND (p.discount_value > 0 OR p.point_used > 0)
    \`;
    const [diskonRows] = await conn.query(discountQuery, [startDate, endDate]);
    console.log("\\n=== TRANSAKSI DENGAN DISKON / POIN ===");
    console.table(diskonRows);
    
  } catch(e) {
    console.error(e);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}
run();
`;

try {
  console.log("Menjalankan analisis HPP harian di VPS...");
  const output = execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cat > /var/www/backend/cek_selisih_hpp.js && cd /var/www/backend && node cek_selisih_hpp.js"', {
    input: scriptVPS,
    encoding: 'utf-8'
  });
  console.log(output);
} catch (e) {
  console.error("Error:", e.message);
  if (e.stdout) console.log("STDOUT:", e.stdout);
  if (e.stderr) console.log("STDERR:", e.stderr);
}
