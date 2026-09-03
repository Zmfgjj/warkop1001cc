const { execSync } = require('child_process');
const ExcelJS = require('exceljs');
const path = require('path');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  let conn;
  try {
    conn = await db.getConnection();
    const query = \`
      SELECT m.nama, dp.harga, SUM(dp.qty) as total_qty, COUNT(dp.id) as total_order, SUM(dp.qty * dp.harga) as total_pendapatan
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      JOIN menu m ON dp.menu_id = m.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at <= '2026-08-31 23:59:59'
      AND (
        (LOWER(m.nama) LIKE '%milky love%' AND dp.harga = 15000)
        OR (LOWER(m.nama) LIKE '%creamy tea%' AND dp.harga = 15000)
        OR (LOWER(m.nama) LIKE '%sweet honey tea%' AND dp.harga = 15000)
        OR (LOWER(m.nama) LIKE '%lemon tea%' AND dp.harga = 15000)
        OR (LOWER(m.nama) LIKE '%peach tea%' AND dp.harga = 15000)
        OR (LOWER(m.nama) LIKE '%brown sugar latte%' AND dp.harga = 23000)
      )
      GROUP BY m.nama, dp.harga
      ORDER BY m.nama, dp.harga
    \`;
    const [rows] = await conn.query(query);
    console.log("===JSON_START===");
    console.log(JSON.stringify(rows));
    console.log("===JSON_END===");
  } catch(e) {
    console.error("ERROR:", e);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}
run();
`;

async function updateExcel() {
  try {
    console.log("⏳ Mengambil data pesanan (harga baru) dari database live...");
    const output = execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cat > /var/www/backend/cek_baru.js && cd /var/www/backend && node cek_baru.js"', {
      input: scriptVPS,
      encoding: 'utf-8'
    });
    
    // Find JSON output
    let jsonStr = null;
    if (output.includes("===JSON_START===") && output.includes("===JSON_END===")) {
      jsonStr = output.split("===JSON_START===")[1].split("===JSON_END===")[0].trim();
    }
    if (!jsonStr) {
      console.log("Gagal membaca hasil JSON dari VPS:", output);
      return;
    }
    const data = JSON.parse(jsonStr);
    console.log("✅ Berhasil mengambil " + data.length + " baris data pesanan.");

    const filePath = path.join(__dirname, 'Laporan_Keuangan_Menu_Baru3.xlsx');
    
    // Bikin workbook dari nol, timpa (replace) isi file lama
    console.log("🧹 Mengganti isi excel lama sepenuhnya...");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Menu Baru');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Menu', key: 'nama', width: 25 },
      { header: 'Harga Satuan', key: 'harga', width: 15 },
      { header: 'Total Qty Terjual', key: 'qty', width: 20 },
      { header: 'Total Pendapatan', key: 'pendapatan', width: 20 },
      { header: 'HPP (24%)', key: 'hpp', width: 20 },
      { header: 'Profit Kotor', key: 'profit', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    let totalPendapatanAll = 0;
    let totalHppAll = 0;
    let totalProfitAll = 0;

    data.forEach((item, index) => {
      const pendapatan = Number(item.total_pendapatan);
      const hpp = pendapatan * 0.24;
      const profit = pendapatan - hpp;
      
      totalPendapatanAll += pendapatan;
      totalHppAll += hpp;
      totalProfitAll += profit;

      worksheet.addRow({
        no: index + 1,
        nama: item.nama,
        harga: Number(item.harga),
        qty: Number(item.total_qty),
        pendapatan: pendapatan,
        hpp: hpp,
        profit: profit
      });
    });

    // Baris Total
    worksheet.addRow([]); // spasi kosong
    const totalRow = worksheet.addRow({
      no: '',
      nama: 'TOTAL KESELURUHAN',
      harga: '',
      qty: '',
      pendapatan: totalPendapatanAll,
      hpp: totalHppAll,
      profit: totalProfitAll
    });
    totalRow.font = { bold: true };

    // Formatting Uang Rupiah 
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.getCell(3).numFmt = '"Rp"#,##0';
        row.getCell(5).numFmt = '"Rp"#,##0';
        row.getCell(6).numFmt = '"Rp"#,##0';
        row.getCell(7).numFmt = '"Rp"#,##0';
      }
    });

    await workbook.xlsx.writeFile(filePath);
    console.log("🎉 SUKSES! File Laporan_Keuangan_Menu_Baru3.xlsx berhasil diganti seluruh isinya dengan data pesanan terbaru.");
  } catch(e) {
    console.error("❌ ERROR UPDATE EXCEL:", e.message);
  }
}

updateExcel();
