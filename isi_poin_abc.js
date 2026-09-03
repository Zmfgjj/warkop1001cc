const { execSync } = require('child_process');
const fs = require('fs');
let ExcelJS;
try { ExcelJS = require('exceljs'); } catch (e) { process.exit(1); }

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [ringkasan] = await conn.query(\`
      SELECT 
        SUM(dp.qty * (CASE WHEN m.nama LIKE '%Brown sugar latte%' THEN dp.harga ELSE 15000 END)) as gross,
        COUNT(DISTINCT dp.pesanan_id) as trx
      FROM detail_pesanan dp
      JOIN menu m ON dp.menu_id = m.id
      JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE (m.nama LIKE '%Milky love%' OR m.nama LIKE '%Creamy tea%' OR m.nama LIKE '%Sweet honey tea%' OR m.nama LIKE '%Lemon tea%' OR m.nama LIKE '%Peach tea%' OR m.nama LIKE '%Brown sugar latte%')
      AND NOT (m.nama LIKE '%Sweet honey tea%' AND dp.harga < 15000)
      AND NOT (m.nama LIKE '%Brown sugar latte%' AND dp.harga < 23000)
      AND p.status = 'selesai'
    \`);

    const [pembayaran] = await conn.query(\`
      SELECT 
        pemb.metode, 
        COUNT(DISTINCT dp.pesanan_id) as qty, 
        SUM(dp.qty * (CASE WHEN m.nama LIKE '%Brown sugar latte%' THEN dp.harga ELSE 15000 END)) as total
      FROM detail_pesanan dp
      JOIN menu m ON dp.menu_id = m.id
      JOIN pesanan p ON dp.pesanan_id = p.id
      JOIN pembayaran pemb ON dp.pesanan_id = pemb.pesanan_id
      WHERE (m.nama LIKE '%Milky love%' OR m.nama LIKE '%Creamy tea%' OR m.nama LIKE '%Sweet honey tea%' OR m.nama LIKE '%Lemon tea%' OR m.nama LIKE '%Peach tea%' OR m.nama LIKE '%Brown sugar latte%')
      AND NOT (m.nama LIKE '%Sweet honey tea%' AND dp.harga < 15000)
      AND NOT (m.nama LIKE '%Brown sugar latte%' AND dp.harga < 23000)
      AND p.status = 'selesai' AND pemb.status = 'sukses'
      GROUP BY pemb.metode
    \`);

    const [terlaris] = await conn.query(\`
      SELECT 
        m.nama as menu, 
        SUM(dp.qty) as qty
      FROM detail_pesanan dp
      JOIN menu m ON dp.menu_id = m.id
      JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE (m.nama LIKE '%Milky love%' OR m.nama LIKE '%Creamy tea%' OR m.nama LIKE '%Sweet honey tea%' OR m.nama LIKE '%Lemon tea%' OR m.nama LIKE '%Peach tea%' OR m.nama LIKE '%Brown sugar latte%')
      AND NOT (m.nama LIKE '%Sweet honey tea%' AND dp.harga < 15000)
      AND NOT (m.nama LIKE '%Brown sugar latte%' AND dp.harga < 23000)
      AND p.status = 'selesai'
      GROUP BY m.nama
      ORDER BY qty DESC
    \`);

    const [detail] = await conn.query(\`
      SELECT 
        DATE(p.created_at) as tanggal,
        m.nama as nama_menu,
        ((CASE WHEN m.nama LIKE '%Brown sugar latte%' THEN dp.harga ELSE 15000 END) * 0.24) as hpp,
        (CASE WHEN m.nama LIKE '%Brown sugar latte%' THEN dp.harga ELSE 15000 END) as harga_jual,
        SUM(dp.qty) as total_qty,
        SUM(dp.qty * (CASE WHEN m.nama LIKE '%Brown sugar latte%' THEN dp.harga ELSE 15000 END)) as omset,
        SUM(dp.qty * ((CASE WHEN m.nama LIKE '%Brown sugar latte%' THEN dp.harga ELSE 15000 END) * 0.24)) as total_hpp,
        SUM(dp.qty * (CASE WHEN m.nama LIKE '%Brown sugar latte%' THEN dp.harga ELSE 15000 END)) - SUM(dp.qty * ((CASE WHEN m.nama LIKE '%Brown sugar latte%' THEN dp.harga ELSE 15000 END) * 0.24)) as gross_profit
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      JOIN menu m ON dp.menu_id = m.id
      WHERE (m.nama LIKE '%Milky love%' OR m.nama LIKE '%Creamy tea%' OR m.nama LIKE '%Sweet honey tea%' OR m.nama LIKE '%Lemon tea%' OR m.nama LIKE '%Peach tea%' OR m.nama LIKE '%Brown sugar latte%')
        AND NOT (m.nama LIKE '%Sweet honey tea%' AND dp.harga < 15000)
        AND NOT (m.nama LIKE '%Brown sugar latte%' AND dp.harga < 23000)
        AND p.status = 'selesai'
      GROUP BY DATE(p.created_at), m.nama
      ORDER BY DATE(p.created_at) DESC, nama_menu, harga_jual
    \`);

    const result = { ringkasan: ringkasan[0] || {gross:0, trx:0}, pembayaran, terlaris, detail };
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
  console.log("⏳ Menarik semua data secara LIVE untuk Laporan_Keuangan_Menu_Baru3.xlsx...");
  let output;
  try {
    output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/isi_abc.js && cd /var/www/backend && node isi_abc.js"`, { encoding: 'utf-8' });
  } catch(e) {
    console.error("❌ Gagal terhubung:", e.message);
    return;
  }
  
  const startIndex = output.indexOf('###DATA_START###') + 16;
  const endIndex = output.indexOf('###DATA_END###');
  const data = JSON.parse(output.substring(startIndex, endIndex).trim());
  
  const workbook = new ExcelJS.Workbook();
  // Menggunakan file Excel versi ke-3 sesuai instruksi
  await workbook.xlsx.readFile('Laporan_Keuangan_Menu_Baru3.xlsx');
  const sheet = workbook.getWorksheet(1);
  
  const gross = Number(data.ringkasan.gross) || 0;
  const trx = Number(data.ringkasan.trx) || 0;
  const aov = trx > 0 ? Math.round(gross / trx) : 0;
  
  // A. Ringkasan
  sheet.getCell('B7').value = gross;
  sheet.getCell('B10').value = gross;
  sheet.getCell('B11').value = trx;
  sheet.getCell('B12').value = aov;
  
  // B. Metode Pembayaran
  let cashQty = 0, cashTotal = 0, qrisQty = 0, qrisTotal = 0;
  for (const p of data.pembayaran) {
    const metode = String(p.metode).toLowerCase();
    if (metode.includes('cash') || metode.includes('tunai')) { 
      cashQty += p.qty; cashTotal += Number(p.total); 
    } else { 
      qrisQty += p.qty; qrisTotal += Number(p.total); 
    }
  }
  sheet.getCell('B16').value = cashQty; sheet.getCell('C16').value = cashTotal; sheet.getCell('D16').value = gross > 0 ? (cashTotal/gross) : 0;
  sheet.getCell('B17').value = qrisQty; sheet.getCell('C17').value = qrisTotal; sheet.getCell('D17').value = gross > 0 ? (qrisTotal/gross) : 0;
  sheet.getCell('B18').value = cashQty + qrisQty; sheet.getCell('C18').value = gross; sheet.getCell('D18').value = 1;
  
  // C. Menu Terlaris
  for (let i = 0; i < 6; i++) {
    sheet.getCell(`A${22 + i}`).value = "";
    sheet.getCell(`B${22 + i}`).value = "";
  }
  
  for (let i = 0; i < data.terlaris.length; i++) {
    sheet.getCell(`A${22 + i}`).value = data.terlaris[i].menu;
    sheet.getCell(`B${22 + i}`).value = `${data.terlaris[i].qty} porsi`;
  }
  
  // D. Rincian Keuangan
  sheet.getCell('A28').value = "D. RINCIAN KEUANGAN";
  sheet.getCell('A28').font = { bold: true };
  sheet.getCell('A29').value = "Tanggal";
  sheet.getCell('B29').value = "Nama Menu";
  sheet.getCell('C29').value = "HPP";
  sheet.getCell('D29').value = "Harga Jual";
  sheet.getCell('E29').value = "Qty";
  sheet.getCell('F29').value = "Omset";
  sheet.getCell('G29').value = "Total HPP";
  sheet.getCell('H29').value = "Gross Profit";
  sheet.getRow(29).font = { bold: true };
  
  // Bersihkan baris ke bawah karena Poin E sudah tidak ada, jadi aman sampai ratusan baris
  for(let i = 30; i <= 1000; i++) sheet.getRow(i).values = []; 
  
  let rowIdx = 30;
  let tQty = 0, tOmset = 0, tHpp = 0, tGp = 0;
  for (const r of data.detail) {
    const d = new Date(r.tanggal);
    const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    sheet.getCell(`A${rowIdx}`).value = tgl;
    sheet.getCell(`B${rowIdx}`).value = r.nama_menu;
    sheet.getCell(`C${rowIdx}`).value = Number(r.hpp);
    sheet.getCell(`D${rowIdx}`).value = Number(r.harga_jual);
    sheet.getCell(`E${rowIdx}`).value = Number(r.total_qty);
    sheet.getCell(`F${rowIdx}`).value = Number(r.omset);
    sheet.getCell(`G${rowIdx}`).value = Number(r.total_hpp);
    sheet.getCell(`H${rowIdx}`).value = Number(r.gross_profit);
    
    tQty += Number(r.total_qty); tOmset += Number(r.omset); tHpp += Number(r.total_hpp); tGp += Number(r.gross_profit);
    rowIdx++;
  }
  
  sheet.getCell(`A${rowIdx}`).value = "TOTAL";
  sheet.getCell(`E${rowIdx}`).value = tQty;
  sheet.getCell(`F${rowIdx}`).value = tOmset;
  sheet.getCell(`G${rowIdx}`).value = tHpp;
  sheet.getCell(`H${rowIdx}`).value = tGp;
  sheet.getRow(rowIdx).font = { bold: true };
  
  await workbook.xlsx.writeFile('Laporan_Keuangan_Menu_Baru3.xlsx');
  console.log("✅ SUKSES! Template Laporan_Keuangan_Menu_Baru3.xlsx diperbarui dengan Poin A, B, C, D murni.");
}
main();
