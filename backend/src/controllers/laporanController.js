const db = require('../config/database');

exports.ringkasan = async (req, res) => {
  try {
    const { tanggal } = req.query;
    const filter = tanggal || new Date().toISOString().split('T')[0];

    // Total pendapatan hari ini
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

    // Total pesanan batal
    const [batal] = await db.query(`
      SELECT COUNT(*) as total
      FROM pesanan
      WHERE DATE(created_at) = ?
      AND status = 'batal'
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

    res.json({
      tanggal: filter,
      pendapatan: pendapatan[0].total,
      total_pesanan: pesanan[0].total,
      total_batal: batal[0].total,
      menu_terlaris: terlaris,
      pendapatan_per_jam: perJam
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

    res.json({
      bulan: parseInt(bln),
      tahun: parseInt(thn),
      total_pendapatan: totalBulan,
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
        SUM(dp.qty) as total_terjual,
        SUM(dp.qty * dp.harga) as total_pendapatan
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN kategori k ON m.kategori_id = k.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.status != 'batal'
      AND DATE(p.created_at) BETWEEN ? AND ?
      GROUP BY dp.menu_id
      ORDER BY total_terjual DESC
    `, [dari_filter, sampai_filter]);

    res.json({
      dari: dari_filter,
      sampai: sampai_filter,
      data: rows
    });

  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
};