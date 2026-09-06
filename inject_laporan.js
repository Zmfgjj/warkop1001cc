const { execSync } = require('child_process');

const scriptContent = `
const db = require('./backend/src/config/database');
const fs = require('fs');
const controllerPath = './backend/src/controllers/laporanController.js';

let content = fs.readFileSync(controllerPath, 'utf8');

const newEndpoint = \`
exports.laporanBulananRange = async (req, res) => {
  try {
    let { startMonth, startYear, endMonth, endYear } = req.query;
    startMonth = parseInt(startMonth);
    startYear = parseInt(startYear);
    endMonth = parseInt(endMonth);
    endYear = parseInt(endYear);

    const results = [];

    let currentMonth = startMonth;
    let currentYear = startYear;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const bln = currentMonth;
      const thn = currentYear;
      const blnStr = String(bln).padStart(2, '0');
      const lastDay = new Date(thn, bln, 0).getDate();
      
      const startOfMonth = \\\`\${thn}-\${blnStr}-01 00:00:00\\\`;
      const endOfMonth = \\\`\${thn}-\${blnStr}-\${String(lastDay).padStart(2, '0')} 23:59:59\\\`;

      // Pendapatan harian dari pembayaran sukses
      const [harianPendapatan] = await db.query(\\\`
        SELECT 
          DATE_FORMAT(pb.created_at, '%Y-%m-%d') as tanggal,
          SUM(pb.jumlah) as pendapatan
        FROM pembayaran pb
        JOIN pesanan p ON pb.pesanan_id = p.id
        WHERE pb.status = 'sukses' AND p.status != 'batal'
        AND pb.created_at >= ? AND pb.created_at <= ?
        GROUP BY DATE_FORMAT(pb.created_at, '%Y-%m-%d')
        ORDER BY tanggal
      \\\`, [startOfMonth, endOfMonth]);

      // Total pesanan harian
      const [harianPesanan] = await db.query(\\\`
        SELECT 
          DATE_FORMAT(p.created_at, '%Y-%m-%d') as tanggal,
          COUNT(*) as total_pesanan
        FROM pesanan p
        WHERE p.payment_status = 'paid' AND p.status != 'batal'
        AND p.created_at >= ? AND p.created_at <= ?
        GROUP BY DATE_FORMAT(p.created_at, '%Y-%m-%d')
        ORDER BY tanggal
      \\\`, [startOfMonth, endOfMonth]);

      // Gabungkan data harian (petakan per tanggal)
      const pesananMap = {};
      harianPesanan.forEach(h => {
        pesananMap[h.tanggal] = h.total_pesanan;
      });

      const pendapatanMap = {};
      harianPendapatan.forEach(h => {
        pendapatanMap[h.tanggal] = h.pendapatan;
      });

      const harian = [];
      for (let d = 1; d <= lastDay; d++) {
        const dStr = String(d).padStart(2, '0');
        const dateStr = \\\`\${thn}-\${blnStr}-\${dStr}\\\`;
        harian.push({
          tanggal: dateStr,
          pendapatan: Number(pendapatanMap[dateStr] || 0),
          total_pesanan: Number(pesananMap[dateStr] || 0)
        });
      }

      const totalBulan = harian.reduce((sum, h) => sum + parseInt(h.pendapatan || 0), 0);
      const totalPesananBulan = harian.reduce((sum, h) => sum + parseInt(h.total_pesanan || 0), 0);

      // Metode pembayaran breakdown
      const [metodePembayaran] = await db.query(\\\`
        SELECT 
          pb.metode,
          COUNT(*) as jumlah_transaksi,
          COALESCE(SUM(pb.jumlah), 0) as total
        FROM pembayaran pb
        JOIN pesanan p ON pb.pesanan_id = p.id
        WHERE pb.status = 'sukses' AND p.status != 'batal'
        AND pb.created_at >= ? AND pb.created_at <= ?
        GROUP BY pb.metode
      \\\`, [startOfMonth, endOfMonth]);

      // Diskon Bulanan
      const [diskonRows] = await db.query(\\\`
        SELECT COALESCE(SUM(
          LEAST(
            p.discount_value + COALESCE(p.point_used, 0),
            (SELECT COALESCE(SUM(dp.qty * dp.harga), 0) FROM detail_pesanan dp WHERE dp.pesanan_id = p.id)
          )
        ), 0) as total_diskon
        FROM pesanan p
        WHERE p.payment_status = 'paid' AND p.status != 'batal'
        AND p.created_at >= ? AND p.created_at <= ?
      \\\`, [startOfMonth, endOfMonth]);
      const totalDiskon = Number(diskonRows[0]?.total_diskon || 0);

      // HPP Bulanan
      const [hppRows] = await db.query(\\\`
        SELECT SUM(dp.qty * COALESCE(dp.hpp, 0)) as total_hpp
        FROM detail_pesanan dp
        LEFT JOIN menu m ON dp.menu_id = m.id
        LEFT JOIN pesanan p ON dp.pesanan_id = p.id
        WHERE p.payment_status = 'paid' AND p.status != 'batal'
        AND p.created_at >= ? AND p.created_at <= ?
      \\\`, [startOfMonth, endOfMonth]);
      const grossProfit = totalBulan - (hppRows[0]?.total_hpp || 0);

      // Penjualan per menu
      const [menuDetail] = await db.query(\\\`
        SELECT 
          m.nama,
          k.nama as kategori,
          dp.harga as harga_jual,
          COALESCE(dp.hpp, 0) as hpp,
          SUM(dp.qty) as total_terjual,
          SUM(dp.qty * dp.harga) as total_pendapatan,
          SUM(dp.qty * COALESCE(dp.hpp, 0)) as total_hpp
        FROM detail_pesanan dp
        LEFT JOIN menu m ON dp.menu_id = m.id
        LEFT JOIN kategori k ON m.kategori_id = k.id
        LEFT JOIN pesanan p ON dp.pesanan_id = p.id
        WHERE p.payment_status = 'paid' AND p.status != 'batal'
        AND p.created_at >= ? AND p.created_at <= ?
        GROUP BY dp.menu_id, dp.harga, dp.harga
        ORDER BY total_terjual DESC
      \\\`, [startOfMonth, endOfMonth]);

      results.push({
        bulan: bln,
        tahun: thn,
        total_pendapatan: totalBulan,
        total_pesanan: totalPesananBulan,
        gross_profit: grossProfit,
        total_diskon: totalDiskon,
        net_revenue: totalBulan,
        metode_pembayaran: metodePembayaran,
        menu_detail: menuDetail,
        harian
      });

      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};
\`;

if (!content.includes('exports.laporanBulananRange')) {
  content += '\\n' + newEndpoint;
  fs.writeFileSync(controllerPath, content);
  console.log('Added laporanBulananRange to laporanController.js');
}

// Add route
const routePath = './backend/src/routes/laporanRoutes.js';
let routeContent = fs.readFileSync(routePath, 'utf8');
if (!routeContent.includes('/bulanan-range')) {
  routeContent = routeContent.replace(
    "router.get('/bulanan', authMiddleware, laporanController.laporanBulanan);",
    "router.get('/bulanan', authMiddleware, laporanController.laporanBulanan);\\nrouter.get('/bulanan-range', authMiddleware, laporanController.laporanBulananRange);"
  );
  fs.writeFileSync(routePath, routeContent);
  console.log('Added /bulanan-range to laporanRoutes.js');
}
`;

fs.writeFileSync('./add_range.js', scriptContent);
