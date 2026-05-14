const db = require('../config/database');

exports.ringkasan = async (req, res) => {
  try {
    const { tanggal } = req.query;
    const filter = tanggal || new Date().toISOString().split('T')[0];

    // Total pendapatan hari ini (gross revenue)
    const [pendapatan] = await db.query(`
      SELECT COALESCE(SUM(pb.jumlah), 0) as total
      FROM pembayaran pb
      WHERE pb.status = 'sukses'
      AND DATE(pb.created_at) = ?
    `, [filter]);

    // Total pesanan hari ini
    const [pesanan] = await db.query(`
      SELECT COUNT(*) as total
      FROM pesanan
      WHERE DATE(created_at) = ?
      AND status != 'batal'
    `, [filter]);

    // Menu terlaris
    const [terlaris] = await db.query(`
      SELECT m.nama, SUM(dp.qty) as total_terjual
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE DATE(p.created_at) = ?
      AND p.status != 'batal'
      GROUP BY dp.menu_id
      ORDER BY total_terjual DESC
      LIMIT 5
    `, [filter]);

    // Pendapatan per jam
    const [perJam] = await db.query(`
      SELECT HOUR(pb.created_at) as jam, 
             SUM(pb.jumlah) as total
      FROM pembayaran pb
      WHERE pb.status = 'sukses'
      AND DATE(pb.created_at) = ?
      GROUP BY HOUR(pb.created_at)
      ORDER BY jam
    `, [filter]);

    // Metode pembayaran breakdown
    const [metodePembayaran] = await db.query(`
      SELECT 
        pb.metode,
        COUNT(*) as jumlah_transaksi,
        COALESCE(SUM(pb.jumlah), 0) as total
      FROM pembayaran pb
      WHERE pb.status = 'sukses'
      AND DATE(pb.created_at) = ?
      GROUP BY pb.metode
    `, [filter]);

    // PPN rate from settings
    const [ppnRows] = await db.query("SELECT nilai FROM settings WHERE `key` = 'ppn' LIMIT 1");
    const ppnRate = ppnRows.length > 0 ? parseFloat(ppnRows[0].nilai) : 11;

    const grossRevenue = Number(pendapatan[0].total);
    const ppnAmount = Math.round(grossRevenue * ppnRate / (100 + ppnRate));
    const netRevenue = grossRevenue - ppnAmount;
    const aov = pesanan[0].total > 0 ? Math.round(grossRevenue / pesanan[0].total) : 0;

    // Penjualan per menu (detail menu + hpp + profit)
    const [menuDetail] = await db.query(`
      SELECT 
        m.nama,
        k.nama as kategori,
        m.harga as harga_jual,
        COALESCE(m.hpp, 0) as hpp,
        SUM(dp.qty) as total_terjual,
        SUM(dp.qty * dp.harga) as total_pendapatan,
        SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN kategori k ON m.kategori_id = k.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.status != 'batal'
      AND DATE(p.created_at) = ?
      GROUP BY dp.menu_id
      ORDER BY total_terjual DESC
    `, [filter]);

    res.json({
      tanggal: filter,
      pendapatan: grossRevenue,
      ppn_rate: ppnRate,
      ppn_amount: ppnAmount,
      net_revenue: netRevenue,
      total_pesanan: pesanan[0].total,
      aov,
      menu_terlaris: terlaris,
      pendapatan_per_jam: perJam,
      metode_pembayaran: metodePembayaran,
      menu_detail: menuDetail
    });

  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.laporanBulanan = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const bln = bulan || new Date().getMonth() + 1;
    const thn = tahun || new Date().getFullYear();

    // Pendapatan harian dari pembayaran sukses
    const [harianPendapatan] = await db.query(`
      SELECT 
        DATE(pb.created_at) as tanggal,
        SUM(pb.jumlah) as pendapatan
      FROM pembayaran pb
      WHERE pb.status = 'sukses'
      AND MONTH(pb.created_at) = ?
      AND YEAR(pb.created_at) = ?
      GROUP BY DATE(pb.created_at)
      ORDER BY tanggal
    `, [bln, thn]);

    // Total pesanan harian (termasuk yang belum bayar, kecuali batal)
    const [harianPesanan] = await db.query(`
      SELECT 
        DATE(p.created_at) as tanggal,
        COUNT(*) as total_pesanan
      FROM pesanan p
      WHERE p.status != 'batal'
      AND MONTH(p.created_at) = ?
      AND YEAR(p.created_at) = ?
      GROUP BY DATE(p.created_at)
      ORDER BY tanggal
    `, [bln, thn]);

    // Gabungkan data harian
    const pesananMap = {};
    harianPesanan.forEach(h => {
      const tgl = new Date(h.tanggal).toISOString().split('T')[0];
      pesananMap[tgl] = h.total_pesanan;
    });

    const harian = harianPendapatan.map(h => {
      const tgl = new Date(h.tanggal).toISOString().split('T')[0];
      return {
        tanggal: h.tanggal,
        pendapatan: h.pendapatan,
        total_pesanan: pesananMap[tgl] || 0,
      };
    });

    // Tambahkan tanggal yang ada pesanan tapi belum ada pembayaran
    harianPesanan.forEach(h => {
      const tgl = new Date(h.tanggal).toISOString().split('T')[0];
      if (!harian.find(d => new Date(d.tanggal).toISOString().split('T')[0] === tgl)) {
        harian.push({
          tanggal: h.tanggal,
          pendapatan: 0,
          total_pesanan: h.total_pesanan,
        });
      }
    });

    // Sort by tanggal
    harian.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    const totalBulan = harian.reduce((sum, h) => sum + parseInt(h.pendapatan || 0), 0);
    const totalPesananBulan = harian.reduce((sum, h) => sum + parseInt(h.total_pesanan || 0), 0);

    // Metode pembayaran breakdown bulan ini
    const [metodePembayaran] = await db.query(`
      SELECT 
        pb.metode,
        COUNT(*) as jumlah_transaksi,
        COALESCE(SUM(pb.jumlah), 0) as total
      FROM pembayaran pb
      WHERE pb.status = 'sukses'
      AND MONTH(pb.created_at) = ?
      AND YEAR(pb.created_at) = ?
      GROUP BY pb.metode
    `, [bln, thn]);

    // PPN rate
    const [ppnRows] = await db.query("SELECT nilai FROM settings WHERE `key` = 'ppn' LIMIT 1");
    const ppnRate = ppnRows.length > 0 ? parseFloat(ppnRows[0].nilai) : 11;
    const ppnAmount = Math.round(totalBulan * ppnRate / (100 + ppnRate));

    // Penjualan per menu bulan ini
    const [menuDetail] = await db.query(`
      SELECT 
        m.nama,
        k.nama as kategori,
        m.harga as harga_jual,
        COALESCE(m.hpp, 0) as hpp,
        SUM(dp.qty) as total_terjual,
        SUM(dp.qty * dp.harga) as total_pendapatan,
        SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN kategori k ON m.kategori_id = k.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.status != 'batal'
      AND MONTH(p.created_at) = ?
      AND YEAR(p.created_at) = ?
      GROUP BY dp.menu_id
      ORDER BY total_terjual DESC
    `, [bln, thn]);

    res.json({
      bulan: parseInt(bln),
      tahun: parseInt(thn),
      total_pendapatan: totalBulan,
      total_pesanan: totalPesananBulan,
      ppn_rate: ppnRate,
      ppn_amount: ppnAmount,
      net_revenue: totalBulan - ppnAmount,
      metode_pembayaran: metodePembayaran,
      menu_detail: menuDetail,
      harian
    });

  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.laporanMenu = async (req, res) => {
  try {
    const { dari, sampai } = req.query;
    const dari_filter = dari || new Date().toISOString().split('T')[0];
    const sampai_filter = sampai || new Date().toISOString().split('T')[0];

    const [rows] = await db.query(`
      SELECT 
        m.nama,
        k.nama as kategori,
        m.harga as harga_jual,
        COALESCE(m.hpp, 0) as hpp,
        SUM(dp.qty) as total_terjual,
        SUM(dp.qty * dp.harga) as total_pendapatan,
        SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN kategori k ON m.kategori_id = k.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.status != 'batal'
      AND DATE(p.created_at) BETWEEN ? AND ?
      GROUP BY dp.menu_id
      ORDER BY total_terjual DESC
    `, [dari_filter, sampai_filter]);

    // Get PPN rate
    const [ppnRows] = await db.query("SELECT nilai FROM settings WHERE `key` = 'ppn' LIMIT 1");
    const ppnRate = ppnRows.length > 0 ? parseFloat(ppnRows[0].nilai) : 2;

    res.json({
      dari: dari_filter,
      sampai: sampai_filter,
      ppn: ppnRate,
      data: rows
    });

  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

// Histori pembelian (semua pesanan selesai + detail)
exports.historiPembelian = async (req, res) => {
  try {
    const { dari, sampai, page = 1, limit = 20 } = req.query;
    const dari_filter = dari || new Date().toISOString().split('T')[0];
    const sampai_filter = sampai || new Date().toISOString().split('T')[0];
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Count total
    const [countRows] = await db.query(`
      SELECT COUNT(*) as total FROM pesanan
      WHERE status IN ('selesai')
      AND DATE(created_at) BETWEEN ? AND ?
    `, [dari_filter, sampai_filter]);

    // Get pesanan with details
    const [rows] = await db.query(`
      SELECT p.id, p.meja_id, p.tipe, p.catatan, p.total, p.status, p.created_at,
        m.nomor as nomor_meja,
        u.nama as nama_kasir,
        pb.metode as metode_bayar,
        pb.status as status_bayar
      FROM pesanan p
      LEFT JOIN meja m ON p.meja_id = m.id
      LEFT JOIN users u ON p.kasir_id = u.id
      LEFT JOIN pembayaran pb ON pb.pesanan_id = p.id AND pb.status = 'sukses'
      WHERE p.status IN ('selesai')
      AND DATE(p.created_at) BETWEEN ? AND ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [dari_filter, sampai_filter, parseInt(limit), offset]);

    // Get detail items for each pesanan
    for (const pesanan of rows) {
      const [detail] = await db.query(`
        SELECT dp.qty, dp.harga, dp.catatan, mn.nama as nama_menu
        FROM detail_pesanan dp
        LEFT JOIN menu mn ON dp.menu_id = mn.id
        WHERE dp.pesanan_id = ?
      `, [pesanan.id]);
      pesanan.items = detail;
    }

    res.json({
      dari: dari_filter,
      sampai: sampai_filter,
      total: countRows[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: rows
    });

  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};