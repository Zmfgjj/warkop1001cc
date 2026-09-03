const { execSync } = require('child_process');
const ExcelJS = require('exceljs');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [detail] = await conn.query(\`
      SELECT 
        DATE(p.created_at) as tanggal,
        CASE WHEN m.nama LIKE '%Sweet honey tea%' AND dp.harga < 15000 THEN 'Teh Manis' ELSE m.nama END as nama_menu,
        m.hpp as hpp,
        CASE WHEN m.nama LIKE '%Milky love%' THEN 15000 ELSE dp.harga END as harga_jual,
        SUM(dp.qty) as total_qty,
        SUM(dp.qty * (CASE WHEN m.nama LIKE '%Milky love%' THEN 15000 ELSE dp.harga END)) as omset,
        SUM(dp.qty * m.hpp) as total_hpp,
        SUM(dp.qty * (CASE WHEN m.nama LIKE '%Milky love%' THEN 15000 ELSE dp.harga END)) - SUM(dp.qty * m.hpp) as gross_profit
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      JOIN menu m ON dp.menu_id = m.id
      WHERE (m.nama LIKE '%Milky love%' OR m.nama LIKE '%Creamy tea%' OR m.nama LIKE '%Sweet honey tea%' OR m.nama LIKE '%Lemon tea%' OR m.nama LIKE '%Peach tea%')
        AND p.status = 'selesai'
      GROUP BY DATE(p.created_at), CASE WHEN m.nama LIKE '%Sweet honey tea%' AND dp.harga < 15000 THEN 'Teh Manis' ELSE m.nama END, CASE WHEN m.nama LIKE '%Milky love%' THEN 15000 ELSE dp.harga END, m.hpp
      ORDER BY DATE(p.created_at) DESC, nama_menu, harga_jual
    \`);

    const result = { detail };
    console.log("###DATA_START###");
    console.log(JSON.stringify(result));
    console.log("###DATA_END###");
  } catch(e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
} run();
`;

async function main() {
  const b64 = Buffer.from(scriptVPS).toString('base64');
  console.log("⏳ Mengambil data lengkap (beserta HPP & Profit) dari VPS...");
  let output;
  try {
    output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/export_excel_spesifik.js && cd /var/www/backend && node export_excel_spesifik.js"`, { encoding: 'utf-8' });
  } catch(e) {
    console.error("❌ Gagal terhubung:", e.message);
    return;
  }
  
  const startIndex = output.indexOf('###DATA_START###') + 16;
  const endIndex = output.indexOf('###DATA_END###');
  const data = JSON.parse(output.substring(startIndex, endIndex).trim());
  
  const workbook = new ExcelJS.Workbook();
  const sheet1 = workbook.addWorksheet('Rincian Keuangan Menu Baru');
  
  sheet1.columns = [
    { header: 'Tanggal', key: 'tanggal', width: 15 },
    { header: 'Nama Menu', key: 'nama_menu', width: 25 },
    { header: 'HPP', key: 'hpp', width: 15 },
    { header: 'Harga Jual', key: 'harga_jual', width: 15 },
    { header: 'Qty (Gelas)', key: 'qty', width: 12 },
    { header: 'Omset', key: 'omset', width: 20 },
    { header: 'Total HPP', key: 'total_hpp', width: 20 },
    { header: 'Gross Profit', key: 'gross_profit', width: 20 }
  ];
  sheet1.getRow(1).font = { bold: true };
  
  let totalQty = 0, totalOmset = 0, totalHPP = 0, totalGP = 0;
  
  for (const r of data.detail) {
    const d = new Date(r.tanggal);
    const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    sheet1.addRow({
      tanggal: tgl,
      nama_menu: r.nama_menu,
      hpp: Number(r.hpp),
      harga_jual: Number(r.harga_jual),
      qty: Number(r.total_qty),
      omset: Number(r.omset),
      total_hpp: Number(r.total_hpp),
      gross_profit: Number(r.gross_profit)
    });
    
    totalQty += Number(r.total_qty);
    totalOmset += Number(r.omset);
    totalHPP += Number(r.total_hpp);
    totalGP += Number(r.gross_profit);
  }
  
  sheet1.addRow([]);
  const lastRow = sheet1.addRow({
    tanggal: 'TOTAL KESELURUHAN',
    qty: totalQty,
    omset: totalOmset,
    total_hpp: totalHPP,
    gross_profit: totalGP
  });
  lastRow.font = { bold: true };
  
  const fileName = 'Laporan_Keuangan_Menu_Baru.xlsx';
  await workbook.xlsx.writeFile(fileName);
  console.log(`✅ Berhasil membuat ${fileName}!`);
}
main();
