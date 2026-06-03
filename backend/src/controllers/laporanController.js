const db = require('../config/database');

exports.ringkasan = async (req, res) => {
  try {
    const { tanggal } = req.query;
    const filter = tanggal || new Date().toISOString().split('T')[0];
    
    // Gunakan range query untuk optimasi index database
    const startDate = `${filter} 00:00:00`;
    const endDate = `${filter} 23:59:59`;

    // Total pendapatan hari ini (gross revenue)
    const [pendapatan] = await db.query(`
      SELECT COALESCE(SUM(pb.jumlah), 0) as total
      FROM pembayaran pb
      WHERE pb.status = 'sukses'
      AND pb.created_at >= ? AND pb.created_at <= ?
    `, [startDate, endDate]);

    // Total pesanan hari ini (hanya yang berstatus selesai)
    const [pesanan] = await db.query(`
      SELECT COUNT(*) as total
      FROM pesanan p
      WHERE p.status = 'selesai'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startDate, endDate]);

    // Menu terlaris
    const [terlaris] = await db.query(`
      SELECT m.nama, SUM(dp.qty) as total_terjual
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.status = 'selesai'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY dp.menu_id
      ORDER BY total_terjual DESC
      LIMIT 5
    `, [startDate, endDate]);

    // Pendapatan per jam
    const [perJam] = await db.query(`
      SELECT HOUR(pb.created_at) as jam, 
             SUM(pb.jumlah) as total
      FROM pembayaran pb
      WHERE pb.status = 'sukses'
      AND pb.created_at >= ? AND pb.created_at <= ?
      GROUP BY HOUR(pb.created_at)
      ORDER BY jam
    `, [startDate, endDate]);

    // Metode pembayaran breakdown
    const [metodePembayaran] = await db.query(`
      SELECT 
        pb.metode,
        COUNT(*) as jumlah_transaksi,
        COALESCE(SUM(pb.jumlah), 0) as total
      FROM pembayaran pb
      WHERE pb.status = 'sukses'
      AND pb.created_at >= ? AND pb.created_at <= ?
      GROUP BY pb.metode
    `, [startDate, endDate]);

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
      WHERE p.status = 'selesai'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY dp.menu_id
      ORDER BY total_terjual DESC
    `, [startDate, endDate]);

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

    // Pastikan format bulanan 2 digit
    const blnStr = String(bln).padStart(2, '0');
    // Cari tanggal terakhir di bulan ini
    const lastDay = new Date(thn, bln, 0).getDate();
    
    const startOfMonth = `${thn}-${blnStr}-01 00:00:00`;
    const endOfMonth = `${thn}-${blnStr}-${String(lastDay).padStart(2, '0')} 23:59:59`;

    // Pendapatan harian dari pembayaran sukses
    const [harianPendapatan] = await db.query(`
      SELECT 
        DATE(pb.created_at) as tanggal,
        SUM(pb.jumlah) as pendapatan
      FROM pembayaran pb
      WHERE pb.status = 'sukses'
      AND pb.created_at >= ? AND pb.created_at <= ?
      GROUP BY DATE(pb.created_at)
      ORDER BY tanggal
    `, [startOfMonth, endOfMonth]);

    // Total pesanan harian (Hanya pesanan berstatus selesai)
    const [harianPesanan] = await db.query(`
      SELECT 
        DATE(p.created_at) as tanggal,
        COUNT(*) as total_pesanan
      FROM pesanan p
      WHERE p.status = 'selesai'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY DATE(p.created_at)
      ORDER BY tanggal
    `, [startOfMonth, endOfMonth]);

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

    // Tambahkan tanggal yang ada pesanan tapi belum ada pembayaran (kalau ada)
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
      AND pb.created_at >= ? AND pb.created_at <= ?
      GROUP BY pb.metode
    `, [startOfMonth, endOfMonth]);

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
      WHERE p.status = 'selesai'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY dp.menu_id
      ORDER BY total_terjual DESC
    `, [startOfMonth, endOfMonth]);

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
    
    const startDate = `${dari_filter} 00:00:00`;
    const endDate = `${sampai_filter} 23:59:59`;

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
      WHERE p.status = 'selesai'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY dp.menu_id
      ORDER BY total_terjual DESC
    `, [startDate, endDate]);

    // Get PPN rate
    const [ppnRows] = await db.query("SELECT nilai FROM settings WHERE `key` = 'ppn' LIMIT 1");
    const ppnRate = ppnRows.length > 0 ? parseFloat(ppnRows[0].nilai) : 11;

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
    const { dari, sampai, page = 1, limit = 20, metode, search } = req.query;
    const dari_filter = dari || new Date().toISOString().split('T')[0];
    const sampai_filter = sampai || new Date().toISOString().split('T')[0];
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const startDate = `${dari_filter} 00:00:00`;
    const endDate = `${sampai_filter} 23:59:59`;

    let filterQuery = '';
    const queryParamsCount = [startDate, endDate];
    const queryParamsData = [startDate, endDate];

    if (metode && metode !== 'semua') {
      filterQuery += ' AND pb.metode = ?';
      queryParamsCount.push(metode);
      queryParamsData.push(metode);
    }
    
    if (search) {
      filterQuery += ' AND (p.id LIKE ? OR u.nama LIKE ?)';
      const searchParam = '%' + search + '%';
      queryParamsCount.push(searchParam, searchParam);
      queryParamsData.push(searchParam, searchParam);
    }

    // Count total dengan filter dinamis
    const [countRows] = await db.query(`
      SELECT COUNT(DISTINCT p.id) as total 
      FROM pesanan p
      LEFT JOIN users u ON p.kasir_id = u.id
      LEFT JOIN pembayaran pb ON pb.pesanan_id = p.id AND pb.status = 'sukses'
      WHERE p.status = 'selesai'
      AND p.created_at >= ? AND p.created_at <= ?
      ${filterQuery}
    `, queryParamsCount);

    queryParamsData.push(parseInt(limit), offset);

    // Get pesanan with details and dynamic filters
    const [rows] = await db.query(`
      SELECT DISTINCT p.id, p.meja_id, p.tipe, p.catatan, p.total, p.status, p.created_at,
        m.nomor as nomor_meja,
        u.nama as nama_kasir,
        pb.metode as metode_bayar,
        pb.status as status_bayar
      FROM pesanan p
      LEFT JOIN meja m ON p.meja_id = m.id
      LEFT JOIN users u ON p.kasir_id = u.id
      LEFT JOIN pembayaran pb ON pb.pesanan_id = p.id AND pb.status = 'sukses'
      WHERE p.status = 'selesai'
      AND p.created_at >= ? AND p.created_at <= ?
      ${filterQuery}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, queryParamsData);

    // Get detail items for all pesanan in one batch query
    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      const [allDetails] = await db.query(`
        SELECT dp.qty, dp.harga, dp.catatan, dp.pesanan_id, mn.nama as nama_menu
        FROM detail_pesanan dp
        LEFT JOIN menu mn ON dp.menu_id = mn.id
        WHERE dp.pesanan_id IN (?)
      `, [ids]);

      const detailMap = {};
      for (const d of allDetails) {
        if (!detailMap[d.pesanan_id]) detailMap[d.pesanan_id] = [];
        detailMap[d.pesanan_id].push(d);
      }
      for (const pesanan of rows) {
        pesanan.items = detailMap[pesanan.id] || [];
      }
    }

    res.json({
      dari: dari_filter,
      sampai: sampai_filter,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limit),
      page: parseInt(page),
      limit: parseInt(limit),
      data: rows
    });

  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};