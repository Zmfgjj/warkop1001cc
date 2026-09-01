const ExcelJS = require('exceljs');
const { execSync } = require('child_process');
const path = require('path');

const scriptVPS = `
const db = require('./src/config/database');
async function run() {
  let conn;
  try {
    conn = await db.getConnection();
    const query = \`
      SELECT 
        DATE(p.created_at) as tanggal,
        m.nama as nama_menu,
        pb.metode as payment_method,
        p.id as pesanan_id,
        dp.harga as harga_jual,
        dp.qty
      FROM detail_pesanan dp
      JOIN pesanan p ON dp.pesanan_id = p.id
      JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN pembayaran pb ON p.id = pb.pesanan_id
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
    console.log("⏳ Mengambil data pesanan dari database live...");
    const output = execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cat > /var/www/backend/cek_baru_template.js && cd /var/www/backend && node cek_baru_template.js"', {
      input: scriptVPS,
      encoding: 'utf-8'
    });
    
    let jsonStr = null;
    if (output.includes("===JSON_START===") && output.includes("===JSON_END===")) {
      jsonStr = output.split("===JSON_START===")[1].split("===JSON_END===")[0].trim();
    }
    if (!jsonStr) {
      console.log("Gagal membaca hasil JSON dari VPS:", output);
      return;
    }
    const data = JSON.parse(jsonStr);
    console.log("✅ Berhasil mengambil data pesanan. Total row DB: " + data.length);

    let grossRevenue = 0;
    let transactions = new Set();
    
    let txCash = new Set();
    let txQris = new Set();
    let revCash = 0;
    let revQris = 0;

    let menuStats = {};
    let dailyStats = {};

    let minDate = '9999-99-99';

    data.forEach(row => {
        let menuName = row.nama_menu;
        if (menuName.toLowerCase().includes('milky love')) menuName = 'Milky Love';
        else if (menuName.toLowerCase().includes('creamy tea')) menuName = 'Creamy Tea';
        else if (menuName.toLowerCase().includes('sweet honey tea')) menuName = 'Sweet Honey Tea';
        else if (menuName.toLowerCase().includes('lemon tea')) menuName = 'Lemon Tea';
        else if (menuName.toLowerCase().includes('peach tea')) menuName = 'Peach Tea';
        else if (menuName.toLowerCase().includes('brown sugar latte')) menuName = 'Brown Sugar Latte';

        const qty = Number(row.qty);
        const harga = Number(row.harga_jual);
        const omset = qty * harga;
        const txId = row.pesanan_id;
        const method = (row.payment_method || '').toLowerCase();
        
        let d = new Date(row.tanggal);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const dateStr = d.toISOString().split('T')[0];
        
        if (dateStr < minDate) minDate = dateStr;

        grossRevenue += omset;
        transactions.add(txId);

        if (method.includes('qris')) {
            txQris.add(txId);
            revQris += omset;
        } else {
            txCash.add(txId);
            revCash += omset;
        }

        if (!menuStats[menuName]) menuStats[menuName] = 0;
        menuStats[menuName] += qty;

        const dailyKey = `${dateStr}_${menuName}`;
        if (!dailyStats[dailyKey]) {
            dailyStats[dailyKey] = {
                tanggal: dateStr,
                menu: menuName,
                harga: harga,
                qty: 0,
                omset: 0
            };
        }
        dailyStats[dailyKey].qty += qty;
        dailyStats[dailyKey].omset += omset;
    });

    if (minDate === '9999-99-99') minDate = '2026-08-01'; // fallback

    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, 'Laporan_Keuangan_Menu_Baru3.xlsx');
    await workbook.xlsx.readFile(filePath);
    const ws = workbook.worksheets[0];

    let grossRow=7, netRow=10, txRow=11, aovRow=12;
    let cashRow=16, qrisRow=17, totalMethodRow=18;
    let menuTerlarisHeaderRow = 21;
    let rincianHeaderRow = 30;

    ws.eachRow((row, rowNumber) => {
        const valA = String(row.getCell(1).value || '').trim().toUpperCase();
        if (valA.includes('GROSS REVENUE')) grossRow = rowNumber;
        if (valA.includes('NET REVENUE')) netRow = rowNumber;
        if (valA.includes('JUMLAH TRANSAKSI') && rowNumber < 15) txRow = rowNumber;
        if (valA.includes('AVERAGE ORDER VALUE')) aovRow = rowNumber;

        if (valA === 'CASH') cashRow = rowNumber;
        if (valA === 'QRIS') qrisRow = rowNumber;
        if (valA === 'TOTAL' && rowNumber > 15 && rowNumber < 25) totalMethodRow = rowNumber;

        if (valA.includes('C. MENU TERLARIS')) menuTerlarisHeaderRow = rowNumber + 1;
        if (valA.includes('D. RINCIAN KEUANGAN')) rincianHeaderRow = rowNumber + 1;
    });

    ws.getCell(`B3`).value = `(${minDate}) - (2026-08-31)`;
    ws.getCell(`B${grossRow}`).value = grossRevenue;
    ws.getCell(`B${netRow}`).value = grossRevenue; 
    ws.getCell(`B${txRow}`).value = transactions.size;
    ws.getCell(`B${aovRow}`).value = transactions.size > 0 ? (grossRevenue / transactions.size) : 0;

    ws.getCell(`B${cashRow}`).value = txCash.size;
    ws.getCell(`C${cashRow}`).value = revCash;
    ws.getCell(`D${cashRow}`).value = grossRevenue > 0 ? (revCash / grossRevenue) : 0;

    ws.getCell(`B${qrisRow}`).value = txQris.size;
    ws.getCell(`C${qrisRow}`).value = revQris;
    ws.getCell(`D${qrisRow}`).value = grossRevenue > 0 ? (revQris / grossRevenue) : 0;

    ws.getCell(`B${totalMethodRow}`).value = txCash.size + txQris.size;
    ws.getCell(`C${totalMethodRow}`).value = revCash + revQris;

    const sortedMenu = Object.entries(menuStats).sort((a,b) => b[1] - a[1]);
    let currentRow = menuTerlarisHeaderRow + 1;
    sortedMenu.forEach(([menu, qty]) => {
        ws.getCell(`A${currentRow}`).value = menu;
        ws.getCell(`B${currentRow}`).value = qty + ' porsi';
        currentRow++;
    });

    let rincianStart = rincianHeaderRow + 1;
    const sortedDaily = Object.values(dailyStats).sort((a,b) => b.tanggal.localeCompare(a.tanggal) || a.menu.localeCompare(b.menu));
    
    let totalRincianQty = 0;
    let totalRincianOmset = 0;
    let totalRincianHPP = 0;
    let totalRincianProfit = 0;

    const maxExistingRows = ws.rowCount;
    
    let rowIndex = rincianStart;
    sortedDaily.forEach(item => {
        const hpp = item.omset * 0.24;
        const profit = item.omset - hpp;
        const hppSatuan = item.harga * 0.24;

        totalRincianQty += item.qty;
        totalRincianOmset += item.omset;
        totalRincianHPP += hpp;
        totalRincianProfit += profit;

        let row = ws.getRow(rowIndex);
        row.getCell(1).value = item.tanggal;
        row.getCell(2).value = item.menu;
        row.getCell(3).value = hppSatuan;
        row.getCell(4).value = item.harga;
        row.getCell(5).value = item.qty;
        row.getCell(6).value = item.omset;
        row.getCell(7).value = hpp;
        row.getCell(8).value = profit;
        rowIndex++;
    });

    let row = ws.getRow(rowIndex);
    row.getCell(1).value = 'TOTAL';
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = '';
    row.getCell(3).value = '';
    row.getCell(4).value = '';
    row.getCell(5).value = totalRincianQty;
    row.getCell(5).font = { bold: true };
    row.getCell(6).value = totalRincianOmset;
    row.getCell(6).font = { bold: true };
    row.getCell(7).value = totalRincianHPP;
    row.getCell(7).font = { bold: true };
    row.getCell(8).value = totalRincianProfit;
    row.getCell(8).font = { bold: true };
    rowIndex++;

    while (rowIndex <= maxExistingRows + 5) {
        let r = ws.getRow(rowIndex);
        for(let c=1; c<=8; c++) r.getCell(c).value = null;
        rowIndex++;
    }

    await workbook.xlsx.writeFile(filePath);
    console.log("✅ Berhasil update Laporan_Keuangan_Menu_Baru3.xlsx sesuai template!");
}
updateExcel().catch(console.error);
