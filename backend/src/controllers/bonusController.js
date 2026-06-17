const db = require('../config/database');

exports.getBonusBulanan = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const bln = bulan || new Date().getMonth() + 1;
    const thn = tahun || new Date().getFullYear();

    const blnStr = String(bln).padStart(2, '0');
    const lastDay = new Date(thn, bln, 0).getDate();
    
    const startOfMonth = `${thn}-${blnStr}-01 00:00:00`;
    const endOfMonth = `${thn}-${blnStr}-${String(lastDay).padStart(2, '0')} 23:59:59`;

    // 1. Dapatkan Total Pendapatan Kotor
    const [pendapatan] = await db.query(`
      SELECT COALESCE(SUM(jumlah), 0) as total
      FROM pembayaran
      WHERE status = 'sukses'
      AND created_at >= ? AND created_at <= ?
    `, [startOfMonth, endOfMonth]);
    
    const grossRevenue = Number(pendapatan[0].total);

    // 2. Dapatkan PPN Rate & Hitung PPN
    const [ppnRows] = await db.query("SELECT nilai FROM settings WHERE `key` = 'ppn' LIMIT 1");
    const ppnRate = ppnRows.length > 0 ? parseFloat(ppnRows[0].nilai) : 11;
    const ppnAmount = Math.round(grossRevenue * (ppnRate / 100));
    const netRevenue = grossRevenue - ppnAmount;

    // 3. Dapatkan Total HPP (Berdasarkan menu yang terjual)
    const [hppData] = await db.query(`
      SELECT SUM(dp.qty * COALESCE(m.hpp, 0)) as total_hpp
      FROM detail_pesanan dp
      LEFT JOIN menu m ON dp.menu_id = m.id
      LEFT JOIN pesanan p ON dp.pesanan_id = p.id
      WHERE p.status = 'selesai'
      AND p.created_at >= ? AND p.created_at <= ?
    `, [startOfMonth, endOfMonth]);
    
    const totalHpp = Number(hppData[0].total_hpp || 0);

    // 4. Hitung Profit Bersih
    const totalProfit = netRevenue - totalHpp;

    // 5. Dapatkan Persentase Bonus dari settings
    const [bonusRows] = await db.query("SELECT nilai FROM settings WHERE `key` = 'bonus_percent' LIMIT 1");
    const bonusPercent = bonusRows.length > 0 ? parseFloat(bonusRows[0].nilai) : 5; // Default 5%

    // 6. Dapatkan Karyawan Aktif (Selain owner & investor)
    const [karyawan] = await db.query(`
      SELECT id, username, nama, role 
      FROM users 
      WHERE role NOT IN ('owner', 'investor')
    `);

    const jumlahKaryawan = karyawan.length;

    // 7. Hitung Bonus
    // Profit bisa minus, jadi set minimal 0
    const profitPositif = Math.max(0, totalProfit);
    const totalBonus = Math.round(profitPositif * (bonusPercent / 100));
    const bonusPerKaryawan = jumlahKaryawan > 0 ? Math.round(totalBonus / jumlahKaryawan) : 0;

    res.json({
      periode: {
        bulan: parseInt(bln),
        tahun: parseInt(thn)
      },
      perhitungan: {
        gross_revenue: grossRevenue,
        ppn_amount: ppnAmount,
        net_revenue: netRevenue,
        total_hpp: totalHpp,
        total_profit: profitPositif
      },
      bonus: {
        persentase: bonusPercent,
        total_bonus: totalBonus,
        jumlah_karyawan: jumlahKaryawan,
        bonus_per_karyawan: bonusPerKaryawan,
        karyawan_list: karyawan
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateBonusPercent = async (req, res) => {
  try {
    const { percent } = req.body;
    
    if (percent === undefined || percent < 0 || percent > 100) {
      return res.status(400).json({ message: 'Persentase tidak valid (0-100)' });
    }

    // Upsert bonus_percent
    await db.query(`
      INSERT INTO settings (\`key\`, nilai) 
      VALUES ('bonus_percent', ?) 
      ON DUPLICATE KEY UPDATE nilai = ?
    `, [percent, percent]);

    res.json({ message: 'Persentase bonus berhasil diupdate', percent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
