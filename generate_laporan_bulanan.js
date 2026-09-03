const { execSync } = require('child_process');
const fs = require('fs');
let ExcelJS;

try {
  ExcelJS = require('exceljs');
} catch (e) {
  console.error("❌ Pustaka 'exceljs' belum terinstal. Tolong jalankan perintah: npm install exceljs");
  process.exit(1);
}

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  const conn = await db.getConnection();
  try {
    const [[ringkasan]] = await conn.query(\`
      SELECT 
        SUM(total + discount_value + point_used) as gross_revenue,
        SUM(discount_value) as total_diskon,
        COUNT(*) as jumlah_transaksi
      FROM pesanan 
      WHERE status = 'selesai' AND MONTH(created_at) = 8 AND YEAR(created_at) = 2026
    \`);
    
    const [pembayaran] = await conn.query(\`
      SELECT 
        pemb.metode as metode, 
        COUNT(*) as qty, 
        SUM(pemb.jumlah) as total 
      FROM pembayaran pemb
      JOIN pesanan p ON pemb.pesanan_id = p.id
      WHERE p.status = 'selesai' AND pemb.status = 'sukses' AND MONTH(p.created_at) = 8 AND YEAR(p.created_at) = 2026 
      GROUP BY pemb.metode
    \`);

    const [menuSales] = await conn.query(\`
      SELECT 
        m.nama as Menu, 
        COALESCE(k.nama, 'Others') as Kategori, 
        m.hpp as HPP_Asli, 
        dp.harga as Harga_Jual, 
        SUM(dp.qty) as Terjual, 
        SUM(dp.qty * dp.harga) as Omset, 
        SUM(dp.qty * m.hpp) as Total_HPP, 
        SUM(dp.qty * dp.harga) - SUM(dp.qty * m.hpp) as Gross_Profit 
      FROM detail_pesanan dp 
      JOIN pesanan p ON dp.pesanan_id = p.id 
      JOIN menu m ON dp.menu_id = m.id 
      LEFT JOIN kategori k ON m.kategori_id = k.id
      WHERE p.status = 'selesai' AND MONTH(p.created_at) = 8 AND YEAR(p.created_at) = 2026 
      GROUP BY m.nama, m.hpp, dp.harga, k.nama 
      ORDER BY Terjual DESC
    \`);
    
    const [detailSelisih] = await conn.query(\`
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
        AND p.status = 'selesai' AND MONTH(p.created_at) = 8 AND YEAR(p.created_at) = 2026
      GROUP BY DATE(p.created_at), CASE WHEN m.nama LIKE '%Sweet honey tea%' AND dp.harga < 15000 THEN 'Teh Manis' ELSE m.nama END, CASE WHEN m.nama LIKE '%Milky love%' THEN 15000 ELSE dp.harga END
      ORDER BY DATE(p.created_at) DESC, nama_menu, harga_jual
    \`);

    const result = { ringkasan, pembayaran, menuSales, detailSelisih };
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
  console.log("⏳ [1/4] Menghubungkan ke server VPS dan menarik data Agustus 2026...");
  
  let output;
  try {
    output = execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "echo '${b64}' | base64 -d > /var/www/backend/export_bulanan.js && cd /var/www/backend && node export_bulanan.js"`, { encoding: 'utf-8' });
  } catch(e) {
    console.error("❌ Gagal mengambil data dari VPS:", e.message);
    return;
  }
  
  const startIndex = output.indexOf('###DATA_START###') + 16;
  const endIndex = output.indexOf('###DATA_END###');
  if (startIndex < 16 || endIndex === -1) {
    console.error("❌ Gagal mengekstrak JSON dari output SSH.");
    return;
  }
  
  const data = JSON.parse(output.substring(startIndex, endIndex).trim());
  console.log("✅ Data berhasil ditarik!");
  
  console.log("⏳ [2/4] Membuka template Laporan-Harian-2026-08-30.xlsx...");
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile('Laporan-Harian-2026-08-30.xlsx');
  } catch(e) {
    console.error("❌ Gagal membaca template Excel. Pastikan file tidak sedang dibuka di Microsoft Excel!");
    return;
  }
  
  const sheet1 = workbook.getWorksheet(1);
  
  console.log("⏳ [3/4] Menulis data ke Sheet 1 (Ringkasan & HPP)...");
  sheet1.getCell('B3').value = "2026-08-01 s/d 2026-08-31";
  
  const gross = Number(data.ringkasan.gross_revenue) || 0;
  const diskon = Number(data.ringkasan.total_diskon) || 0;
  const net = gross - diskon;
  const trx = Number(data.ringkasan.jumlah_transaksi) || 0;
  const aov = trx > 0 ? Math.round(net / trx) : 0;
  
  sheet1.getCell('B7').value = gross;
  sheet1.getCell('B8').value = diskon;
  sheet1.getCell('B9').value = 0; // Service Charge
  sheet1.getCell('B10').value = net;
  sheet1.getCell('B11').value = trx;
  sheet1.getCell('B12').value = aov;
  
  // Metode Pembayaran
  let cashQty = 0, cashTotal = 0, qrisQty = 0, qrisTotal = 0;
  for (const p of data.pembayaran) {
    if (p.metode.toLowerCase().includes('cash')) { cashQty += p.qty; cashTotal += Number(p.total); }
    else { qrisQty += p.qty; qrisTotal += Number(p.total); }
  }
  sheet1.getCell('B16').value = cashQty; sheet1.getCell('C16').value = cashTotal; sheet1.getCell('D16').value = net > 0 ? (cashTotal/net) : 0;
  sheet1.getCell('B17').value = qrisQty; sheet1.getCell('C17').value = qrisTotal; sheet1.getCell('D17').value = net > 0 ? (qrisTotal/net) : 0;
  sheet1.getCell('B18').value = trx; sheet1.getCell('C18').value = net; sheet1.getCell('D18').value = 1;
  
  // Top 5 Menu Terlaris
  const top5 = data.menuSales.slice(0, 5);
  for (let i = 0; i < 5; i++) {
    if (top5[i]) {
      sheet1.getCell(`A${22 + i}`).value = top5[i].Menu;
      sheet1.getCell(`B${22 + i}`).value = `${top5[i].Terjual} porsi`;
    }
  }
  
  // Penjualan Per Menu (Mulai Baris 30)
  const templateStyleRow = sheet1.getRow(30);
  let rowIdx = 30;
  let sumOmset = 0, sumTotalHPP = 0, sumGross = 0;
  
  for (const item of data.menuSales) {
    const row = sheet1.getRow(rowIdx);
    row.getCell(1).value = item.Menu;
    row.getCell(2).value = item.Kategori;
    row.getCell(3).value = Number(item.HPP_Asli);
    row.getCell(4).value = Number(item.Harga_Jual);
    row.getCell(5).value = Number(item.Terjual);
    row.getCell(6).value = Number(item.Omset);
    row.getCell(7).value = Number(item.Total_HPP);
    row.getCell(8).value = Number(item.Gross_Profit);
    
    // Copy style
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
       const templateCell = templateStyleRow.getCell(colNumber);
       if (templateCell.style) cell.style = templateCell.style;
    });
    row.commit();
    
    sumOmset += Number(item.Omset);
    sumTotalHPP += Number(item.Total_HPP);
    sumGross += Number(item.Gross_Profit);
    rowIdx++;
  }
  
  // Clear any remaining old rows (up to 150 to be safe)
  for (let i = rowIdx; i <= 150; i++) {
    const r = sheet1.getRow(i);
    r.values = [];
    r.commit();
  }
  
  // Baris TOTAL
  const totalRow = sheet1.getRow(rowIdx);
  totalRow.getCell(1).value = "TOTAL";
  totalRow.getCell(6).value = sumOmset;
  totalRow.getCell(7).value = sumTotalHPP;
  totalRow.getCell(8).value = sumGross;
  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const templateCell = templateStyleRow.getCell(colNumber);
      if (templateCell.style) {
          cell.style = JSON.parse(JSON.stringify(templateCell.style)); // deep copy style
          cell.font = { bold: true };
      }
  });
  totalRow.commit();
  
  console.log("⏳ [4/4] Membuat Sheet Menu Baru & Rekap Selisih...");
  
  const sheet2 = workbook.addWorksheet('Rincian Menu Baru');
  sheet2.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Nama Menu', key: 'nama', width: 25 },
      { header: 'Harga Jual', key: 'harga', width: 15 },
      { header: 'Qty (Gelas)', key: 'qty', width: 15 },
      { header: 'Total Pendapatan', key: 'total', width: 20 }
  ];
  sheet2.getRow(1).font = { bold: true };
  
  const recap = {};
  for (const r of data.detailSelisih) {
     const d = new Date(r.tanggal);
     const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
     sheet2.addRow({
         tanggal: tgl,
         nama: r.nama_menu,
         harga: r.harga_jual,
         qty: r.total_qty,
         total: r.total_pendapatan
     });
     
     const nama = r.nama_menu;
     if (!recap[nama]) recap[nama] = { qtyLama: 0, qtyBaru: 0, pendLama: 0, pendBaru: 0 };
     if (r.harga_jual < 15000) {
         recap[nama].qtyLama += r.total_qty;
         recap[nama].pendLama += r.total_pendapatan;
     } else {
         recap[nama].qtyBaru += r.total_qty;
         recap[nama].pendBaru += r.total_pendapatan;
     }
  }
  
  const sheet3 = workbook.addWorksheet('Rekap Selisih Minus');
  sheet3.columns = [
      { header: 'Nama Menu', width: 20 },
      { header: 'Terjual (Harga Lama)', width: 20 },
      { header: 'Terjual (Harga Baru 15k)', width: 25 },
      { header: 'Total Gelas', width: 15 },
      { header: 'Selisih / Minus', width: 20 }
  ];
  sheet3.getRow(1).font = { bold: true };
  
  let sumTotalQty = 0, sumTotalMinus = 0;
  const order = ['Milky Love ', 'Creamy Tea', 'Peach Tea', 'Lemon Tea', 'Sweet Honey Tea', 'Teh Manis'];
  
  for (const nama of order) {
      if(!recap[nama]) continue;
      const r = recap[nama];
      const totalQty = r.qtyLama + r.qtyBaru;
      const totalPend = r.pendLama + r.pendBaru;
      let expectedPrice = 15000;
      if (nama === 'Teh Manis') expectedPrice = 7000;
      
      const selisih = (totalQty * expectedPrice) - totalPend;
      sumTotalQty += totalQty;
      sumTotalMinus += selisih;
      
      let labelLama = `${r.qtyLama} Gelas (13k)`;
      if (nama === 'Teh Manis') labelLama = `${r.qtyLama} Gelas (7k)`;
      else if (nama === 'Sweet Honey Tea') labelLama = `0 Gelas (13k)`;
      else if (nama === 'Milky Love ') labelLama = `0 Gelas (13k)`; // Always 15k
      
      sheet3.addRow([ nama, labelLama, `${r.qtyBaru} Gelas`, `${totalQty} Gelas`, selisih ]);
  }
  sheet3.addRow([]);
  sheet3.addRow(['TOTAL KESELURUHAN', '', '', `${sumTotalQty} Gelas`, sumTotalMinus]).font = { bold: true };
  
  const fileName = 'Laporan-Bulanan-Agustus-2026.xlsx';
  await workbook.xlsx.writeFile(fileName);
  console.log(`\n🎉 SUKSES! File ${fileName} berhasil dibuat di folder Anda!`);
}

main();
