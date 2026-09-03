const { execSync } = require('child_process');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  let conn;
  try {
    conn = await db.getConnection();
    const query = \`
      SELECT m.nama, dp.harga, SUM(dp.qty) as total_qty, COUNT(dp.id) as total_order
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      JOIN menu m ON dp.menu_id = m.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at <= '2026-08-31 23:59:59'
      AND (
        LOWER(m.nama) LIKE '%milky love%'
        OR LOWER(m.nama) LIKE '%creamy tea%'
        OR LOWER(m.nama) LIKE '%teh manis%'
        OR LOWER(m.nama) LIKE '%lemon tea%'
        OR LOWER(m.nama) LIKE '%peach tea%'
        OR LOWER(m.nama) LIKE '%brown sugar latte%'
      )
      GROUP BY m.nama, dp.harga
      ORDER BY m.nama, dp.harga
    \`;
    const [rows] = await conn.query(query);
    console.log("=== HASIL ===");
    console.log(JSON.stringify(rows, null, 2));
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
  console.log("Menjalankan query di VPS...");
  const output = execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cat > /var/www/backend/cek_lama.js && cd /var/www/backend && node cek_lama.js"', {
    input: scriptVPS,
    encoding: 'utf-8'
  });
  console.log(output);
} catch (e) {
  console.error("Error:", e.message);
  if (e.stdout) console.log("STDOUT:", e.stdout);
  if (e.stderr) console.log("STDERR:", e.stderr);
}
