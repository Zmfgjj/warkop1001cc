const { execSync } = require('child_process');
const fs = require('fs');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query(\`
      SELECT 
        DATE(p.created_at) as tanggal,
        CASE WHEN m.nama LIKE '%Sweet honey tea%' AND dp.harga < 15000 THEN 'Teh Manis' ELSE m.nama END as nama_menu,
        CASE WHEN m.nama LIKE '%Milky love%' THEN 15000 ELSE dp.harga END as harga_jual,
        SUM(dp.qty) as total_qty,
        SUM(dp.qty * (CASE WHEN m.nama LIKE '%Milky love%' THEN 15000 ELSE dp.harga END)) as total_pendapatan
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      JOIN menu m ON dp.menu_id = m.id
      WHERE (m.nama LIKE '%Milky love%' OR m.nama LIKE '%Creamy tea%' OR m.nama LIKE '%Sweet honey tea%' OR m.nama LIKE '%Lemon tea%' OR m.nama LIKE '%Peach tea%')
        AND p.status = 'selesai'
      GROUP BY DATE(p.created_at), CASE WHEN m.nama LIKE '%Sweet honey tea%' AND dp.harga < 15000 THEN 'Teh Manis' ELSE m.nama END, CASE WHEN m.nama LIKE '%Milky love%' THEN 15000 ELSE dp.harga END
      ORDER BY DATE(p.created_at) DESC, nama_menu, harga_jual
    \`);
    console.log("###DATA_START###");
    console.log(JSON.stringify(rows));
    console.log("###DATA_END###");
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

try {
  console.log("⏳ Menghubungkan ke VPS dan menarik data Laporan Penjualan...");
  const output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/export_temp.js && cd /var/www/backend && node export_temp.js"`, { encoding: 'utf-8' });
  
  // Extract JSON output safely
  const startIndex = output.indexOf('###DATA_START###') + 16;
  const endIndex = output.indexOf('###DATA_END###');
  if (startIndex < 16 || endIndex === -1) {
    throw new Error("Gagal mengekstrak data JSON dari server.");
  }
  
  const jsonStr = output.substring(startIndex, endIndex).trim();
  const data = JSON.parse(jsonStr);

  let csvContent = "Tanggal Penjualan,Nama Menu,Harga Jual,Qty (Gelas),Total Pendapatan\n";
  for(const row of data) {
     // Format tanggal ke bentuk rapi YYYY-MM-DD
     const d = new Date(row.tanggal);
     const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
     
     csvContent += `${tgl},${row.nama_menu},${row.harga_jual},${row.total_qty},${row.total_pendapatan}\n`;
  }

  const filename = 'Laporan_Menu_Baru.csv';
  fs.writeFileSync(filename, csvContent);
  console.log(`\n✅ SUKSES! Data berhasil di-download.`);
  console.log(`📂 File tersimpan di: ${__dirname}\\${filename}`);
  console.log(`\nCara buka: Double-klik file Laporan_Menu_Baru.csv, file ini akan otomatis terbuka di Microsoft Excel!`);

} catch(e) {
  console.error("❌ Gagal menarik data:", e.message);
}
