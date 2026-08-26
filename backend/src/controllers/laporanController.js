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
      SELECT COALESCE(SUM(p.total), 0) as total
      FROM pesanan p
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startDate, endDate]);

    // Total pesanan hari ini (hanya yang berstatus selesai)
    const [pesanan] = await db.query(`
      SELECT COUNT(*) as total
      FROM pesanan p
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startDate, endDate]);

    // Menu terlaris
    const [terlaris] = await db.query(`
      SELECT m.nama, SUM(dp.qty) as total_terjual
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY dp.menu_id, dp.harga, dp.harga
      ORDER BY total_terjual DESC
      LIMIT 5
    `, [startDate, endDate]);

    // Pendapatan per jam
    const [perJam] = await db.query(`
      SELECT HOUR(pb.created_at) as jam, 
             SUM(pb.jumlah) as total
      FROM pembayaran pb
      JOIN pesanan p ON pb.pesanan_id = p.id
      WHERE pb.status = 'sukses' AND p.status != 'batal'
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
      JOIN pesanan p ON pb.pesanan_id = p.id
      WHERE pb.status = 'sukses' AND p.status != 'batal'
      AND pb.created_at >= ? AND pb.created_at <= ?
      GROUP BY pb.metode
    `, [startDate, endDate]);

    const [diskon] = await db.query(`
      SELECT COALESCE(SUM(
        LEAST(
          p.discount_value + COALESCE(p.point_used, 0),
          (SELECT COALESCE(SUM(dp.qty * dp.harga), 0) FROM detail_pesanan dp WHERE dp.pesanan_id = p.id)
        )
      ), 0) as total_diskon
      FROM pesanan p
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startDate, endDate]);

    const grossRevenue = Number(pendapatan[0].total);
    const totalDiskon = Number(diskon[0].total_diskon);
    const aov = pesanan[0].total > 0 ? Math.round(grossRevenue / pesanan[0].total) : 0;

    // HPP Harian
    const [hppRows] = await db.query(`
      SELECT SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startDate, endDate]);
    const grossProfit = grossRevenue - (hppRows[0]?.total_hpp || 0);

    // Penjualan per menu (detail menu + hpp + profit)
    const [menuDetail] = await db.query(`
      SELECT 
        m.nama,
        k.nama as kategori,
        dp.harga as harga_jual,
        COALESCE(m.hpp, 0) as hpp,
        SUM(dp.qty) as total_terjual,
        SUM(dp.qty * dp.harga) as total_pendapatan,
        SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN kategori k ON m.kategori_id = k.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY dp.menu_id, dp.harga, dp.harga
      ORDER BY total_terjual DESC
    `, [startDate, endDate]);

    // Kunjungan menu publik hari ini
    const [kunjungan] = await db.query(`
      SELECT COUNT(*) as total_kunjungan, COUNT(DISTINCT ip_address) as unik_kunjungan
      FROM public_menu_visits
      WHERE tanggal = ?
    `, [filter]);

    res.json({
      tanggal: filter,
      pendapatan: grossRevenue,
      total_diskon: totalDiskon,
      gross_profit: grossProfit,
      net_revenue: grossRevenue, // Keep net_revenue same as grossRevenue just in case frontend needs it temporarily
      total_pesanan: pesanan[0].total,
      total_kunjungan: kunjungan[0].total_kunjungan || 0,
      unik_kunjungan: kunjungan[0].unik_kunjungan || 0,
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
        DATE_FORMAT(pb.created_at, '%Y-%m-%d') as tanggal,
        SUM(pb.jumlah) as pendapatan
      FROM pembayaran pb
      JOIN pesanan p ON pb.pesanan_id = p.id
      WHERE pb.status = 'sukses' AND p.status != 'batal'
      AND pb.created_at >= ? AND pb.created_at <= ?
      GROUP BY DATE_FORMAT(pb.created_at, '%Y-%m-%d')
      ORDER BY tanggal
    `, [startOfMonth, endOfMonth]);

    // Total pesanan harian (Hanya pesanan berstatus selesai)
    const [harianPesanan] = await db.query(`
      SELECT 
        DATE_FORMAT(p.created_at, '%Y-%m-%d') as tanggal,
        COUNT(*) as total_pesanan
      FROM pesanan p
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY DATE_FORMAT(p.created_at, '%Y-%m-%d')
      ORDER BY tanggal
    `, [startOfMonth, endOfMonth]);

    // Kunjungan menu publik harian bulan ini
    const [harianKunjungan] = await db.query(`
      SELECT 
        DATE_FORMAT(tanggal, '%Y-%m-%d') as tanggal,
        COUNT(*) as total_kunjungan,
        COUNT(DISTINCT ip_address) as unik_kunjungan
      FROM public_menu_visits
      WHERE tanggal >= DATE(?) AND tanggal <= DATE(?)
      GROUP BY DATE_FORMAT(tanggal, '%Y-%m-%d')
      ORDER BY tanggal
    `, [startOfMonth, endOfMonth]);

    // Gabungkan data harian (petakan per tanggal)
    const pesananMap = {};
    harianPesanan.forEach(h => {
      pesananMap[h.tanggal] = h.total_pesanan;
    });

    const pendapatanMap = {};
    harianPendapatan.forEach(h => {
      pendapatanMap[h.tanggal] = h.pendapatan;
    });

    const kunjunganMap = {};
    harianKunjungan.forEach(h => {
      kunjunganMap[h.tanggal] = {
        total: h.total_kunjungan,
        unik: h.unik_kunjungan
      };
    });

    // Buat data lengkap dari hari ke-1 sampai hari terakhir bulan ini
    const harian = [];
    for (let d = 1; d <= lastDay; d++) {
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${thn}-${blnStr}-${dStr}`;
      harian.push({
        tanggal: dateStr,
        pendapatan: Number(pendapatanMap[dateStr] || 0),
        total_pesanan: Number(pesananMap[dateStr] || 0),
        total_kunjungan: Number(kunjunganMap[dateStr]?.total || 0),
        unik_kunjungan: Number(kunjunganMap[dateStr]?.unik || 0),
      });
    }

    const totalBulan = harian.reduce((sum, h) => sum + parseInt(h.pendapatan || 0), 0);
    const totalPesananBulan = harian.reduce((sum, h) => sum + parseInt(h.total_pesanan || 0), 0);
    const totalKunjunganBulan = harian.reduce((sum, h) => sum + parseInt(h.total_kunjungan || 0), 0);

    // Metode pembayaran breakdown bulan ini
    const [metodePembayaran] = await db.query(`
      SELECT 
        pb.metode,
        COUNT(*) as jumlah_transaksi,
        COALESCE(SUM(pb.jumlah), 0) as total
      FROM pembayaran pb
      JOIN pesanan p ON pb.pesanan_id = p.id
      WHERE pb.status = 'sukses' AND p.status != 'batal'
      AND pb.created_at >= ? AND pb.created_at <= ?
      GROUP BY pb.metode
    `, [startOfMonth, endOfMonth]);

    const netRevenue = totalBulan;

    // Diskon Bulanan
    const [diskonRows] = await db.query(`
      SELECT COALESCE(SUM(
        LEAST(
          p.discount_value + COALESCE(p.point_used, 0),
          (SELECT COALESCE(SUM(dp.qty * dp.harga), 0) FROM detail_pesanan dp WHERE dp.pesanan_id = p.id)
        )
      ), 0) as total_diskon
      FROM pesanan p
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startOfMonth, endOfMonth]);
    const totalDiskon = Number(diskonRows[0]?.total_diskon || 0);

    // HPP Bulanan
    const [hppRows] = await db.query(`
      SELECT SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startOfMonth, endOfMonth]);
    const grossProfit = totalBulan - (hppRows[0]?.total_hpp || 0);

    // Penjualan per menu bulan ini
    const [menuDetail] = await db.query(`
      SELECT 
        m.nama,
        k.nama as kategori,
        dp.harga as harga_jual,
        COALESCE(m.hpp, 0) as hpp,
        SUM(dp.qty) as total_terjual,
        SUM(dp.qty * dp.harga) as total_pendapatan,
        SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN kategori k ON m.kategori_id = k.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY dp.menu_id, dp.harga, dp.harga
      ORDER BY total_terjual DESC
    `, [startOfMonth, endOfMonth]);

    res.json({
      bulan: parseInt(bln),
      tahun: parseInt(thn),
      total_pendapatan: totalBulan,
      total_pesanan: totalPesananBulan,
      total_kunjungan: totalKunjunganBulan,
      gross_profit: grossProfit,
      total_diskon: totalDiskon,
      net_revenue: netRevenue,
      metode_pembayaran: metodePembayaran,
      menu_detail: menuDetail,
      harian
    });

  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};

exports.laporanTahunan = async (req, res) => {
  try {
    const { tahun } = req.query;
    const thn = tahun || new Date().getFullYear();

    const startOfYear = `${thn}-01-01 00:00:00`;
    const endOfYear = `${thn}-12-31 23:59:59`;

    // Total pendapatan tahun ini
    const [pendapatanTahunan] = await db.query(`
      SELECT COALESCE(SUM(pb.jumlah), 0) as total
      FROM pembayaran pb
      JOIN pesanan p ON pb.pesanan_id = p.id
      WHERE pb.status = 'sukses' AND p.status != 'batal'
      AND pb.created_at >= ? AND pb.created_at <= ?
    `, [startOfYear, endOfYear]);

    // Total pesanan tahun ini
    const [pesananTahunan] = await db.query(`
      SELECT COUNT(*) as total
      FROM pesanan p
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startOfYear, endOfYear]);

    // Pendapatan bulanan
    const [bulananPendapatan] = await db.query(`
      SELECT 
        MONTH(pb.created_at) as bulan,
        SUM(pb.jumlah) as pendapatan
      FROM pembayaran pb
      JOIN pesanan p ON pb.pesanan_id = p.id
      WHERE pb.status = 'sukses' AND p.status != 'batal'
      AND pb.created_at >= ? AND pb.created_at <= ?
      GROUP BY MONTH(pb.created_at)
      ORDER BY bulan
    `, [startOfYear, endOfYear]);

    // Total pesanan bulanan
    const [bulananPesanan] = await db.query(`
      SELECT 
        MONTH(p.created_at) as bulan,
        COUNT(*) as total_pesanan
      FROM pesanan p
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY MONTH(p.created_at)
      ORDER BY bulan
    `, [startOfYear, endOfYear]);

    // Gabungkan data bulanan (1-12)
    const pesananMap = {};
    bulananPesanan.forEach(b => {
      pesananMap[b.bulan] = b.total_pesanan;
    });

    const bulananMap = {};
    bulananPendapatan.forEach(b => {
      bulananMap[b.bulan] = b.pendapatan;
    });

    const bulanan = [];
    for (let m = 1; m <= 12; m++) {
      bulanan.push({
        bulan: m,
        pendapatan: Number(bulananMap[m] || 0),
        total_pesanan: Number(pesananMap[m] || 0)
      });
    }

    // Metode pembayaran breakdown
    const [metodePembayaran] = await db.query(`
      SELECT 
        pb.metode,
        COUNT(*) as jumlah_transaksi,
        COALESCE(SUM(pb.jumlah), 0) as total
      FROM pembayaran pb
      JOIN pesanan p ON pb.pesanan_id = p.id
      WHERE pb.status = 'sukses' AND p.status != 'batal'
      AND pb.created_at >= ? AND pb.created_at <= ?
      GROUP BY pb.metode
    `, [startOfYear, endOfYear]);

    const grossRevenue = Number(pendapatanTahunan[0].total);
    const netRevenue = grossRevenue;
    const aov = pesananTahunan[0].total > 0 ? Math.round(grossRevenue / pesananTahunan[0].total) : 0;

    // Diskon Tahunan
    const [diskonRows] = await db.query(`
      SELECT COALESCE(SUM(
        LEAST(
          p.discount_value + COALESCE(p.point_used, 0),
          (SELECT COALESCE(SUM(dp.qty * dp.harga), 0) FROM detail_pesanan dp WHERE dp.pesanan_id = p.id)
        )
      ), 0) as total_diskon
      FROM pesanan p
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startOfYear, endOfYear]);
    const totalDiskon = Number(diskonRows[0]?.total_diskon || 0);

    // HPP Tahunan
    const [hppRows] = await db.query(`
      SELECT SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startOfYear, endOfYear]);
    const grossProfit = grossRevenue - (hppRows[0]?.total_hpp || 0);

    // Penjualan per menu tahun ini
    const [menuDetail] = await db.query(`
      SELECT 
        m.nama,
        k.nama as kategori,
        dp.harga as harga_jual,
        COALESCE(m.hpp, 0) as hpp,
        SUM(dp.qty) as total_terjual,
        SUM(dp.qty * dp.harga) as total_pendapatan,
        SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN kategori k ON m.kategori_id = k.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY dp.menu_id, dp.harga, dp.harga
      ORDER BY total_terjual DESC
    `, [startOfYear, endOfYear]);

    res.json({
      tahun: parseInt(thn),
      total_pendapatan: grossRevenue,
      total_pesanan: pesananTahunan[0].total,
      aov,
      gross_profit: grossProfit,
      total_diskon: totalDiskon,
      net_revenue: netRevenue,
      metode_pembayaran: metodePembayaran,
      menu_detail: menuDetail,
      bulanan
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
        dp.harga as harga_jual,
        COALESCE(m.hpp, 0) as hpp,
        SUM(dp.qty) as total_terjual,
        SUM(dp.qty * dp.harga) as total_pendapatan,
        SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN kategori k ON m.kategori_id = k.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      GROUP BY dp.menu_id, dp.harga, dp.harga
      ORDER BY total_terjual DESC
    `, [startDate, endDate]);

    res.json({
      dari: dari_filter,
      sampai: sampai_filter,
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

    // 1. Hitung total summary statistik (Pendapatan, Keuntungan, dll) untuk date range
    const [summaryRows] = await db.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_pesanan,
        COALESCE(SUM(p.total), 0) as total_pendapatan,
        COALESCE(SUM(
          LEAST(
            p.discount_value + COALESCE(p.point_used, 0),
            (SELECT COALESCE(SUM(dp.qty * dp.harga), 0) FROM detail_pesanan dp WHERE dp.pesanan_id = p.id)
          )
        ), 0) as total_diskon,
        COALESCE(SUM(
          (SELECT SUM(dp.qty * COALESCE(mn.hpp, 0)) 
           FROM detail_pesanan dp 
           LEFT JOIN menu mn ON dp.menu_id = mn.id 
           WHERE dp.pesanan_id = p.id)
        ), 0) as total_hpp
      FROM pesanan p
      LEFT JOIN users u ON p.kasir_id = u.id
      LEFT JOIN pembayaran pb ON pb.pesanan_id = p.id AND pb.status = 'sukses'
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      ${filterQuery}
    `, [startDate, endDate, ...filterQuery ? (metode && metode !== 'semua' ? [metode] : []).concat(search ? [searchParam, searchParam] : []) : []]);

    const total_pesanan = summaryRows[0]?.total_pesanan || 0;
    const total_pendapatan = Number(summaryRows[0]?.total_pendapatan || 0);
    const total_diskon = Number(summaryRows[0]?.total_diskon || 0);
    const total_keuntungan = Math.max(0, total_pendapatan - Number(summaryRows[0]?.total_hpp || 0));

    // 2. Hitung chart data harian untuk date range
    const [chartRows] = await db.query(`
      SELECT 
        DATE(p.created_at) as tanggal,
        COALESCE(SUM(p.total), 0) as pendapatan,
        COUNT(*) as total_pesanan
      FROM pesanan p
      LEFT JOIN users u ON p.kasir_id = u.id
      LEFT JOIN pembayaran pb ON pb.pesanan_id = p.id AND pb.status = 'sukses'
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      ${filterQuery}
      GROUP BY DATE(p.created_at)
      ORDER BY tanggal
    `, [startDate, endDate, ...filterQuery ? (metode && metode !== 'semua' ? [metode] : []).concat(search ? [searchParam, searchParam] : []) : []]);

    queryParamsData.push(parseInt(limit), offset);

    // 3. Get list pesanan dengan HPP per pesanan
    const [rows] = await db.query(`
      SELECT DISTINCT p.id, p.local_id, p.meja_id, p.tipe, p.catatan, p.total, p.status, p.created_at,
        m.nomor as nomor_meja,
        u.nama as nama_kasir,
        pb.metode as metode_bayar,
        pb.status as status_bayar,
        p.nama_pelanggan,
        p.no_telepon,
        COALESCE(
          (SELECT SUM(dp.qty * COALESCE(mn.hpp, 0)) 
           FROM detail_pesanan dp 
           LEFT JOIN menu mn ON dp.menu_id = mn.id 
           WHERE dp.pesanan_id = p.id), 
          0
        ) as total_hpp
      FROM pesanan p
      LEFT JOIN meja m ON p.meja_id = m.id
      LEFT JOIN users u ON p.kasir_id = u.id
      LEFT JOIN pembayaran pb ON pb.pesanan_id = p.id AND pb.status = 'sukses'
      WHERE p.payment_status = 'paid' AND p.status != 'batal'
      AND p.created_at >= ? AND p.created_at <= ?
      ${filterQuery}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, queryParamsData);

    // Get detail items for all pesanan in one batch query
    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
        const [allDetails] = await db.query(`
          SELECT dp.qty, dp.harga, dp.catatan, dp.pesanan_id, mn.nama as nama_menu, k.nama as kategori_nama, k.print_destination as kategori_print_destination, k2.nama as kategori2_nama
          FROM detail_pesanan dp
          LEFT JOIN menu mn ON dp.menu_id = mn.id
          LEFT JOIN kategori k ON mn.kategori_id = k.id
          LEFT JOIN kategori k2 ON mn.kategori2_id = k2.id
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
      total: total_pesanan,
      totalPages: Math.ceil(total_pesanan / limit),
      page: parseInt(page),
      limit: parseInt(limit),
      summary: {
        total_pesanan,
        total_pendapatan,
        total_keuntungan,
        total_diskon
      },
      chart: chartRows,
      data: rows
    });

  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};