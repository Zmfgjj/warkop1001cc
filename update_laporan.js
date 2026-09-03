const { execSync } = require('child_process');
const fs = require('fs');
let ExcelJS;

try {
  ExcelJS = require('exceljs');
} catch (e) {
  console.error("❌ Module 'exceljs' belum terinstal. Jalankan: npm install exceljs");
  process.exit(1);
}

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query(\`
      SELECT 
        p.id as id_pesanan,
        p.created_at as waktu_pesan,
        m.nama as nama_menu,
        dp.qty as qty,
        dp.harga as harga_jual,
        (dp.qty * dp.harga) as omset
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      JOIN menu m ON dp.menu_id = m.id
      WHERE p.status = 'selesai'
        AND (
          m.nama LIKE '%Milky love%' OR 
          m.nama LIKE '%Creamy tea%' OR 
          m.nama LIKE '%Sweet honey tea%' OR 
          m.nama LIKE '%Lemon tea%' OR 
          m.nama LIKE '%Peach tea%' OR 
          m.nama LIKE '%Brown sugar latte%'
        )
      ORDER BY p.created_at ASC
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

async function main() {
  console.log("⏳ Menghubungkan ke VPS Warkop1001CC dan mengecek pesanan satu per satu...");
  const b64 = Buffer.from(scriptVPS).toString('base64');
  
  let output = "";
  try {
    // Jalankan lewat SSH. Stdio setup agar password prompt jalan di terminal lokal
    output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/cek_pesanan.js && cd /var/www/backend && node cek_pesanan.js"`, { encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] });
  } catch (e) {
    console.error("❌ Gagal menarik data dari VPS:", e.message);
    process.exit(1);
  }

  const match = output.match(/###DATA_START###([\s\S]*?)###DATA_END###/);
  if (!match) {
    console.error("❌ Gagal memparsing data dari output VPS.");
    process.exit(1);
  }

  const rawData = JSON.parse(match[1].trim());
  console.log(`✅ Berhasil menarik ${rawData.length} transaksi pesanan dari database live.`);

  const fileName = 'Laporan_Keuangan_Menu_Baru3 (2).xlsx';
  console.log(`⏳ Membuka file Excel: ${fileName}...`);
  const workbook = new ExcelJS.Workbook();
  
  if (fs.existsSync(fileName)) {
    await workbook.xlsx.readFile(fileName);
  } else {
    console.log("⚠️ File Excel tidak ditemukan, akan membuat file baru...");
  }

  // --- SHEET 1: DETAIL SATU PER SATU PESANAN ---
  const sheetDetailName = 'Detail Pesanan per Transaksi';
  if (workbook.getWorksheet(sheetDetailName)) {
    workbook.removeWorksheet(sheetDetailName);
  }
  const wsDetail = workbook.addWorksheet(sheetDetailName);
  
  wsDetail.columns = [
    { header: 'ID Pesanan', key: 'id_pesanan', width: 12 },
    { header: 'Waktu Pesan', key: 'waktu', width: 20 },
    { header: 'Nama Menu', key: 'nama_menu', width: 25 },
    { header: 'Qty', key: 'qty', width: 10 },
    { header: 'Harga Jual', key: 'harga_jual', width: 15 },
    { header: 'Total Omset', key: 'omset', width: 15 },
    { header: 'HPP (24%)', key: 'hpp', width: 15 },
    { header: 'Gross Profit', key: 'profit', width: 15 }
  ];
  wsDetail.getRow(1).font = { bold: true };
  wsDetail.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

  let summary = {};
  
  rawData.forEach(row => {
    // Kita filter dan rapikan data
    // Pastikan HPP murni 24% dari harga jual asli seperti yang diminta
    const hpp_satuan = row.harga_jual * 0.24;
    const hpp_total = row.omset * 0.24;
    const gross_profit = row.omset - hpp_total;
    
    // Waktu format
    const dt = new Date(row.waktu_pesan);
    const strTime = dt.toLocaleString('id-ID');

    wsDetail.addRow({
      id_pesanan: row.id_pesanan,
      waktu: strTime,
      nama_menu: row.nama_menu,
      qty: row.qty,
      harga_jual: row.harga_jual,
      omset: row.omset,
      hpp: hpp_total,
      profit: gross_profit
    });

    // Buat data summary/rekap
    if(!summary[row.nama_menu]) {
      summary[row.nama_menu] = { qty: 0, omset: 0, hpp: 0, profit: 0 };
    }
    summary[row.nama_menu].qty += Number(row.qty);
    summary[row.nama_menu].omset += Number(row.omset);
    summary[row.nama_menu].hpp += hpp_total;
    summary[row.nama_menu].profit += gross_profit;
  });

  ['harga_jual', 'omset', 'hpp', 'profit'].forEach(col => {
    wsDetail.getColumn(col).numFmt = '"Rp"#,##0';
  });

  // --- SHEET 2: REKAPITULASI TOTAL ---
  const sheetRekapName = 'Rekap Total (HPP 24%)';
  if (workbook.getWorksheet(sheetRekapName)) {
    workbook.removeWorksheet(sheetRekapName);
  }
  const wsRekap = workbook.addWorksheet(sheetRekapName);
  
  wsRekap.columns = [
    { header: 'Nama Menu', key: 'nama_menu', width: 25 },
    { header: 'Total Qty Terjual', key: 'qty', width: 20 },
    { header: 'Total Omset', key: 'omset', width: 20 },
    { header: 'Total HPP (24%)', key: 'hpp', width: 20 },
    { header: 'Total Gross Profit', key: 'profit', width: 20 }
  ];
  wsRekap.getRow(1).font = { bold: true };
  wsRekap.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };

  let tQty = 0, tOmset = 0, tHpp = 0, tProfit = 0;
  
  for(let menu in summary) {
    wsRekap.addRow({
      nama_menu: menu,
      qty: summary[menu].qty,
      omset: summary[menu].omset,
      hpp: summary[menu].hpp,
      profit: summary[menu].profit
    });
    tQty += summary[menu].qty;
    tOmset += summary[menu].omset;
    tHpp += summary[menu].hpp;
    tProfit += summary[menu].profit;
  }
  
  wsRekap.addRow({});
  const lastRow = wsRekap.addRow({
    nama_menu: 'TOTAL KESELURUHAN',
    qty: tQty,
    omset: tOmset,
    hpp: tHpp,
    profit: tProfit
  });
  lastRow.font = { bold: true };
  
  ['omset', 'hpp', 'profit'].forEach(col => {
    wsRekap.getColumn(col).numFmt = '"Rp"#,##0';
  });

  console.log("⏳ Menyimpan ke file Excel...");
  try {
    await workbook.xlsx.writeFile(fileName);
    console.log(`✅ BERHASIL! Seluruh data pesanan satu per satu dan rekapitulasi HPP 24% telah ditambahkan ke dalam "${fileName}"`);
  } catch (err) {
    if (err.message.includes('EBUSY')) {
      console.error(`❌ GAGAL: File ${fileName} sedang terbuka di Microsoft Excel. Harap tutup file tersebut dulu lalu jalankan ulang perintah ini.`);
    } else {
      console.error(err);
    }
  }
}

main();
